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
import { locationSettings } from "@/lib/constants";
import {
  type FilterRange,
  getPeriodOptions,
  getRelationshipStats,
  isInPeriod,
} from "@/lib/dashboard-utils";

interface DashboardClientProps {
  profile: Profile;
  partner: Profile;
  initialNotes: SharedNote[];
  initialExpenses: IndividualExpense[];
  heroImageUrl: string;
  currentTimeIso: string;
  exchangeRateSgdToVnd: number | null;
  exchangeRateUpdatedAt: string | null;
  exchangeRateSource: string | null;
}

export function DashboardClient({
  profile,
  partner,
  initialNotes,
  initialExpenses,
  heroImageUrl,
  currentTimeIso,
  exchangeRateSgdToVnd,
  exchangeRateUpdatedAt,
  exchangeRateSource,
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
  const [filterRange, setFilterRange] = useState<FilterRange>("month");
  const initialClock = useMemo(() => new Date(currentTimeIso), [currentTimeIso]);
  const [clock, setClock] = useState(initialClock);
  const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
  const [editingExpense, setEditingExpense] = useState<IndividualExpense | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const profileLocation = locationSettings[profile.country_code];
  const profileTimeZone = profileLocation.timeZone;
  const relationshipStats = useMemo(
    () => getRelationshipStats(clock, profileTimeZone),
    [clock, profileTimeZone],
  );

  const periodOptions = useMemo(() => {
    return getPeriodOptions(
      initialNotes,
      initialExpenses,
      initialClock,
      profileTimeZone,
      filterRange,
    );
  }, [
    filterRange,
    initialClock,
    initialExpenses,
    initialNotes,
    profileTimeZone,
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState(
    () => periodOptions[0]?.value ?? "",
  );
  const activePeriod = periodOptions.some(
    (option) => option.value === selectedPeriod,
  )
    ? selectedPeriod
    : periodOptions[0]?.value ?? "";

  useEffect(() => {
    if (selectedPeriod !== activePeriod) {
      setSelectedPeriod(activePeriod);
    }
  }, [activePeriod, selectedPeriod]);

  const filteredNotes = useMemo(
    () =>
      initialNotes.filter((note) =>
        isInPeriod(note.created_at, activePeriod, profileTimeZone, filterRange),
      ),
    [activePeriod, filterRange, initialNotes, profileTimeZone],
  );

  const filteredExpenses = useMemo(
    () =>
      initialExpenses.filter((expense) =>
        isInPeriod(
          expense.transaction_date,
          activePeriod,
          profileTimeZone,
          filterRange,
        ),
      ),
    [activePeriod, filterRange, initialExpenses, profileTimeZone],
  );

  const myExpenses = useMemo(
    () => filteredExpenses.filter((expense) => expense.owner_id === profile.id),
    [filteredExpenses, profile.id],
  );
  const partnerExpenses = useMemo(
    () =>
      filteredExpenses.filter((expense) => expense.owner_id === partner.id),
    [filteredExpenses, partner.id],
  );
  const chartExpenses = filterRange === "week" ? filteredExpenses : initialExpenses;
  const coupleProfiles = useMemo<[Profile, Profile]>(
    () => [profile, partner],
    [profile, partner],
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
                  <p className="text-xs text-white/65">
                    {profileLocation.flag} {profileLocation.currency}
                  </p>
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
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <ToggleButtonGroup
                exclusive
                value={filterRange}
                onChange={(_, value: FilterRange | null) => {
                  if (value) {
                    setFilterRange(value);
                  }
                }}
                size="small"
                className="bg-white"
              >
                <ToggleButton value="week" className="px-4">
                  Week
                </ToggleButton>
                <ToggleButton value="month" className="px-4">
                  Month
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                select
                size="small"
                label={filterRange === "week" ? "Week" : "Month"}
                value={activePeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className="w-full bg-white sm:w-72"
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </div>
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
                    timeZone={profileTimeZone}
                    onEdit={(selectedNote) => {
                      setEditingNote(selectedNote);
                      setNoteOpen(true);
                    }}
                  />
                ))
              ) : (
                <p className="border border-neutral-200 bg-white p-6 text-neutral-500 md:col-span-2 xl:col-span-3">
                  No notes for this {filterRange}.
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
                  {filterRange === "week" ? "Weekly ledgers" : "Monthly ledgers"}
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
            <FinanceCharts
              expenses={filteredExpenses}
              barExpenses={chartExpenses}
              profiles={coupleProfiles}
              exchangeRateSgdToVnd={exchangeRateSgdToVnd}
              exchangeRateUpdatedAt={exchangeRateUpdatedAt}
              exchangeRateSource={exchangeRateSource}
              timeZone={profileTimeZone}
              filterRange={filterRange}
              selectedPeriod={activePeriod}
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <ExpenseFeed
                title="My ledger"
                expenses={myExpenses}
                currentUserId={profile.id}
                readOnly={false}
                timeZone={profileTimeZone}
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
                timeZone={profileTimeZone}
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
