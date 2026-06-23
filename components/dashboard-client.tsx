"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import { ImageUp, LogOut, NotebookPen, Plus, Settings, WalletCards } from "lucide-react";
import { useSnackbar } from "notistack";
import { createClient } from "@/lib/supabase/browser";
import { signOut } from "@/app/actions";
import type {
  FinanceAggregate,
  IndividualExpense,
  Profile,
  SharedNote,
} from "@/lib/types";
import { NoteDialog } from "@/components/notes/note-dialog";
import { NoteCard } from "@/components/notes/note-card";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseFeed } from "@/components/expenses/expense-feed";
import { FinanceCharts } from "@/components/expenses/finance-charts";
import { AvatarIcon } from "@/components/avatar-icon";
import { ProfileDialog } from "@/components/profile-dialog";
import { HeroImageDialog } from "@/components/hero-image-dialog";
import {
  formatAppDayMonthYear,
  formatAppMonthLong,
  getAppMonthKey,
} from "@/lib/date-format";

interface DashboardClientProps {
  profile: Profile;
  partner: Profile;
  initialNotes: SharedNote[];
  initialExpenses: IndividualExpense[];
  aggregates: FinanceAggregate[];
  heroImageUrl: string;
  currentTimeIso: string;
}

export function DashboardClient({
  profile,
  partner,
  initialNotes,
  initialExpenses,
  aggregates,
  heroImageUrl,
  currentTimeIso,
}: DashboardClientProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [noteOpen, setNoteOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [heroOpen, setHeroOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"notes" | "financial">(
    "notes",
  );
  const initialClock = useMemo(() => new Date(currentTimeIso), [currentTimeIso]);
  const [clock, setClock] = useState(initialClock);
  const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
  const [editingExpense, setEditingExpense] = useState<IndividualExpense | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const anniversaryStart = useMemo(() => new Date(2025, 9, 16), []);
  const relationshipStats = useMemo(() => {
    const startOfToday = new Date(
      clock.getFullYear(),
      clock.getMonth(),
      clock.getDate(),
    );
    const daysTogether = Math.max(
      0,
      Math.floor(
        (startOfToday.getTime() - anniversaryStart.getTime()) / 86400000,
      ) + 1,
    );
    const nextMonthly = new Date(clock.getFullYear(), clock.getMonth(), 16);
    if (nextMonthly.getTime() <= clock.getTime()) {
      nextMonthly.setMonth(nextMonthly.getMonth() + 1);
    }
    const diff = Math.max(0, nextMonthly.getTime() - clock.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      daysTogether,
      nextMonthlyLabel: formatAppDayMonthYear(nextMonthly),
      countdown: `${days}d ${hours}h ${minutes}m`,
    };
  }, [anniversaryStart, clock]);

  const monthOptions = useMemo(() => {
    const keys = new Map<string, string>();
    [...initialNotes, ...initialExpenses].forEach((item) => {
      const dateValue =
        "transaction_date" in item ? item.transaction_date : item.created_at;
      const date = new Date(dateValue);
      const key = getAppMonthKey(date);
      keys.set(key, formatAppMonthLong(date));
    });

    const now = initialClock;
    const currentKey = getAppMonthKey(now);
    if (!keys.has(currentKey)) {
      keys.set(currentKey, formatAppMonthLong(now));
    }

    return Array.from(keys.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [initialClock, initialExpenses, initialNotes]);

  const [selectedMonth, setSelectedMonth] = useState(
    () => monthOptions[0]?.value ?? "",
  );

  const isInSelectedMonth = (dateValue: string) => {
    if (!selectedMonth) return true;
    return getAppMonthKey(dateValue) === selectedMonth;
  };

  const filteredNotes = useMemo(
    () => initialNotes.filter((note) => isInSelectedMonth(note.created_at)),
    [initialNotes, selectedMonth],
  );

  const myExpenses = useMemo(
    () =>
      initialExpenses.filter(
        (expense) =>
          expense.owner_id === profile.id &&
          isInSelectedMonth(expense.transaction_date),
      ),
    [initialExpenses, profile.id, selectedMonth],
  );
  const partnerExpenses = useMemo(
    () =>
      initialExpenses.filter(
        (expense) =>
          expense.owner_id === partner.id &&
          isInSelectedMonth(expense.transaction_date),
      ),
    [initialExpenses, partner.id, selectedMonth],
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("couple-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "individual_expenses" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-svh bg-paper text-ink">
      <section className="relative min-h-[58svh] bg-black text-white">
        <Image
          src={heroImageUrl}
          alt="Our Space hero"
          fill
          priority
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <div className="container-page relative flex min-h-[58svh] flex-col justify-between py-7">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/25 pb-5">
            <p className="font-serif text-2xl tracking-wide">Our Space 𑣲⋆</p>
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <AvatarIcon
                  value={profile.avatar_url}
                  label={profile.display_name}
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{profile.display_name}</p>
                  <p className="text-xs text-white/65">{profile.currency}</p>
                </div>
              </div>
              <Button
                variant="outlined"
                startIcon={<Settings size={16} />}
                className="min-h-10 border-white px-3 text-white hover:border-white hover:bg-white hover:text-ink sm:px-4"
                onClick={() => setProfileOpen(true)}
              >
                Profile
              </Button>
              <Button
                variant="outlined"
                startIcon={<LogOut size={16} />}
                disabled={pending}
                className="min-h-10 border-white px-3 text-white hover:border-white hover:bg-white hover:text-ink sm:px-4"
                onClick={() =>
                  startTransition(async () => {
                    enqueueSnackbar("Logged out successfully!", { variant: "success" });
                    await signOut();
                  })
                }
              >
                Logout
              </Button>
            </div>
          </header>
          <div className="max-w-5xl pb-8">
            <p className="eyebrow !text-white/70">
              Vietnam / Singapore daily hub
            </p>
            <h1 className="mt-4 font-serif text-6xl leading-[0.9] sm:text-8xl lg:text-9xl">
              A private place for both of us.
            </h1>
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              <div className="border border-white/25 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                  Days together
                </p>
                <p className="mt-2 font-serif text-4xl leading-none sm:text-5xl">
                  {relationshipStats.daysTogether}
                </p>
                <p className="mt-2 text-sm text-white/70">Since 16 Oct 2025</p>
              </div>
              <div className="border border-white/25 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                  Next monthly anniversary
                </p>
                <p className="mt-2 font-serif text-4xl leading-none sm:text-5xl">
                  {relationshipStats.countdown}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {relationshipStats.nextMonthlyLabel}
                </p>
              </div>
            </div>
            <Button
              variant="outlined"
              startIcon={<ImageUp size={16} />}
              className="mt-4 border-white bg-black/20 text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-ink sm:hidden"
              onClick={() => setHeroOpen(true)}
            >
              Edit image
            </Button>
          </div>
          <Button
            variant="outlined"
            startIcon={<ImageUp size={16} />}
            className="absolute bottom-7 right-5 hidden border-white bg-black/20 text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-ink sm:inline-flex sm:right-8 lg:right-12"
            onClick={() => setHeroOpen(true)}
          >
            Edit image
          </Button>
        </div>
      </section>

      <section className="container-page py-6 sm:py-8">
        <div className="sticky top-0 z-20 -mx-5 border-b border-neutral-200 bg-paper/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <ToggleButtonGroup
              exclusive
              value={activeSection}
              onChange={(_, value) => value && setActiveSection(value)}
              size="small"
              className="bg-white"
            >
              <ToggleButton value="notes" className="gap-2 px-3 sm:px-5">
                <NotebookPen size={16} />
                Notes
              </ToggleButton>
              <ToggleButton value="financial" className="gap-2 px-3 sm:px-5">
                <WalletCards size={16} />
                Financial
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              select
              size="small"
              label="Month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full bg-white sm:w-56"
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        {activeSection === "notes" ? (
          <div className="grid gap-6 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Shared notes</p>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
                  For each other
                </h2>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus size={17} />}
                className="min-h-11 bg-ink px-5 text-white hover:bg-neutral-700"
                onClick={() => setNoteOpen(true)}
              >
                New note
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredNotes.length ? (
                filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUserId={profile.id}
                    initialNowMs={initialClock.getTime()}
                    onEdit={(selectedNote) => {
                      setEditingNote(selectedNote);
                      setNoteOpen(true);
                    }}
                  />
                ))
              ) : (
                <p className="border border-neutral-200 bg-white p-6 text-neutral-500 md:col-span-2 xl:col-span-3">
                  No notes for this month.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Financial</p>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
                  Monthly ledgers
                </h2>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus size={17} />}
                className="min-h-11 bg-ink px-5 text-white hover:bg-neutral-700"
                onClick={() => setExpenseOpen(true)}
              >
                Log expense
              </Button>
            </div>
            <FinanceCharts aggregates={aggregates} />
            <div className="grid gap-6 xl:grid-cols-2">
              <ExpenseFeed
                title="My ledger"
                expenses={myExpenses}
                currentUserId={profile.id}
                readOnly={false}
                onEdit={(expense) => {
                  setEditingExpense(expense);
                  setExpenseOpen(true);
                }}
              />
              <ExpenseFeed
                title={`${partner.display_name}'s ledger`}
                expenses={partnerExpenses}
                currentUserId={profile.id}
                readOnly
              />
            </div>
          </div>
        )}
      </section>

      <NoteDialog
        open={noteOpen}
        onClose={() => {
          setNoteOpen(false);
          setEditingNote(null);
        }}
        recipient={partner}
        note={editingNote}
      />
      <ExpenseDialog
        open={expenseOpen}
        onClose={() => {
          setExpenseOpen(false);
          setEditingExpense(null);
        }}
        profile={profile}
        expense={editingExpense}
      />
      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
      />
      <HeroImageDialog
        open={heroOpen}
        onClose={() => setHeroOpen(false)}
        currentUrl={heroImageUrl}
      />
    </main>
  );
}
