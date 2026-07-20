"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useTransition } from "react";
import { MapPin, Plus } from "lucide-react";
import { deleteMemory } from "@/app/actions";
import { ActionMenu } from "@/components/common/action-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryPanelSkeleton } from "@/components/our-space/tab-skeletons";
import { getMemoryTypeColor } from "@/lib/constants";
import type { MemoryMapEntry, Profile } from "@/lib/types";

interface MemoryMapPanelProps {
	loading: boolean;
	memories: MemoryMapEntry[];
	partner: Profile;
	profile: Profile;
	timeZone: string;
	onEditMemory: (memory: MemoryMapEntry) => void;
	onMemoryDeleted: (memoryId: string) => void;
	onNewMemory: () => void;
}

const LeafletMemoryMap = dynamic(
	() =>
		import("@/components/memory/memory-map-leaflet-surface").then(
			(mod) => mod.LeafletMemoryMap,
		),
	{
		ssr: false,
		loading: () => (
			<div className="relative overflow-hidden rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.2)]">
				<Skeleton className="min-h-[22rem] rounded-2xl sm:min-h-[31rem]" />
			</div>
		),
	},
);

function getMemoryDateLabel(value: string, timeZone: string) {
	return new Intl.DateTimeFormat("en-SG", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone,
	}).format(new Date(value));
}

function UserAvatar({ profile }: { profile: Profile }) {
	const avatar = profile.avatar_url;
	const isImage =
		avatar?.startsWith("http://") || avatar?.startsWith("https://");
	const imageSrc = isImage ? avatar : null;

	return (
		<span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/30 text-base">
			{imageSrc ? (
				<Image
					src={imageSrc}
					alt=""
					fill
					sizes="2rem"
					className="object-cover"
				/>
			) : (
				(avatar ?? "🙂")
			)}
		</span>
	);
}

function getUserDescription(memory: MemoryMapEntry, userId: string) {
	return memory.description_by_user?.[userId] ?? null;
}

function UserDescriptionBlock({
	memory,
	profile,
}: {
	memory: MemoryMapEntry;
	profile: Profile;
}) {
	const description = getUserDescription(memory, profile.id);

	return (
		<div className="flex items-start gap-3">
			<div className="grid size-10 shrink-0 place-items-center">
				<UserAvatar profile={profile} />
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-bold leading-5 text-foreground">
					{profile.display_name}
				</p>

				<p
					className={[
						"whitespace-pre-wrap break-words text-sm leading-5",
						description ? "text-muted-foreground" : "text-subtle-foreground",
					].join(" ")}
				>
					{description || "No description yet."}
				</p>
			</div>
		</div>
	);
}

function MemoryCard({
	memory,
	participants,
	timeZone,
	deleting,
	onEdit,
	onRequestDelete,
}: {
	memory: MemoryMapEntry;
	participants: [Profile, Profile];
	deleting: boolean;
	timeZone: string;
	onEdit: () => void;
	onRequestDelete: () => void;
}) {
	const memoryTypeColor = getMemoryTypeColor(memory.memory_type);
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${memory.latitude},${memory.longitude}`;

	return (
		<article className="app-card app-card-interactive content-fade-in relative overflow-visible flex flex-col h-full">
			{memory.photo_url ? (
				<div className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-t-2xl bg-surface-hover sm:rounded-t-lg">
					<Image
						src={memory.photo_url}
						alt={memory.title}
						fill
						className="object-cover"
					/>
				</div>
			) : null}

			{/* Đổi grid thành flex flex-col flex-1 để chiếm hết chiều cao còn lại */}
			<div className="flex flex-col flex-1 gap-3 p-4 bg-surface/92 rounded-b-2xl">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p
							className="inline-flex max-w-full items-center rounded-full border border-primary-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
							style={{ backgroundColor: memoryTypeColor }}
						>
							{memory.memory_type}
						</p>
						<h3 className="mt-2 break-words font-serif text-2xl leading-tight text-foreground">
							{memory.title}
						</h3>
					</div>

					<div className="relative shrink-0">
						<ActionMenu
							label={`Open actions for ${memory.title}`}
							disabled={deleting}
							sheetTitle="Memory actions"
							sheetDescription={memory.title}
							onEdit={onEdit}
							onDelete={onRequestDelete}
						/>
					</div>
				</div>

				<div className="mt-auto overflow-hidden rounded-2xl border border-primary-border bg-primary-subtle">
					<div
						className="
			max-h-28 overflow-y-auto
			[scrollbar-color:rgb(var(--theme-primary-rgb)/0.7)_transparent]
			[scrollbar-width:thin]
			[&::-webkit-scrollbar]:w-2
			[&::-webkit-scrollbar-track]:bg-transparent
			[&::-webkit-scrollbar-thumb]:min-h-6
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-transparent
			[&::-webkit-scrollbar-thumb]:bg-primary/70
			[&::-webkit-scrollbar-thumb]:bg-clip-padding
			hover:[&::-webkit-scrollbar-thumb]:bg-primary
		"
					>
						<div className="grid gap-2 p-2.5">
							{participants.map((participant) => (
								<UserDescriptionBlock
									key={participant.id}
									memory={memory}
									profile={participant}
								/>
							))}
						</div>
					</div>
				</div>

				<a
					href={mapsUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-primary-border bg-surface px-4 text-sm font-bold text-muted-foreground transition hover:border-primary hover:bg-surface-hover hover:text-primary"
				>
					<MapPin size={16} />
					Open location
				</a>
			</div>
		</article>
	);
}

export function MemoryMapPanel({
	loading,
	memories,
	partner,
	profile,
	timeZone,
	onEditMemory,
	onMemoryDeleted,
	onNewMemory,
}: MemoryMapPanelProps) {
	const toast = useToast();
	const [memoryToDelete, setMemoryToDelete] = useState<MemoryMapEntry | null>(
		null,
	);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const participants: [Profile, Profile] = [profile, partner];

	if (loading && memories.length === 0) {
		return <MemoryPanelSkeleton />;
	}

	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Memory map
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Pin the places where your story happened.
					</p>
				</div>
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					onClick={onNewMemory}
				>
					<Plus size={17} />
					Add memory
				</Button>
			</div>

			<div className="relative">
				{loading ? (
					<div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-surface/70 p-4 backdrop-blur-sm">
						<div className="grid w-full max-w-sm gap-3">
							<Skeleton className="h-4 w-32 rounded-full" />
							<Skeleton className="h-20 rounded-2xl" />
						</div>
					</div>
				) : null}
				<LeafletMemoryMap
					memories={memories}
					onEditMemory={onEditMemory}
					onNewMemory={onNewMemory}
				/>
			</div>

			{memories.length ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{memories.map((memory) => (
						<MemoryCard
							key={memory.id}
							deleting={pending && deletingId === memory.id}
							memory={memory}
							participants={participants}
							timeZone={timeZone}
							onEdit={() => onEditMemory(memory)}
							onRequestDelete={() => setMemoryToDelete(memory)}
						/>
					))}
				</div>
			) : null}

			<ConfirmDialog
				open={Boolean(memoryToDelete)}
				title="Delete memory?"
				description={
					memoryToDelete
						? `"${memoryToDelete.title}" will be permanently removed from your memory map.`
						: "This memory will be permanently removed from your memory map."
				}
				confirmLabel="Delete memory"
				pending={pending}
				onClose={() => setMemoryToDelete(null)}
				onConfirm={() => {
					if (!memoryToDelete) return;
					setDeletingId(memoryToDelete.id);
					startTransition(async () => {
						const result = await deleteMemory(memoryToDelete.id);
						toast(result.message, {
							variant: result.ok ? "success" : "error",
						});
						setDeletingId(null);
						if (result.ok) {
							onMemoryDeleted(memoryToDelete.id);
							setMemoryToDelete(null);
						}
					});
				}}
			/>
		</div>
	);
}
