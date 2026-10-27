"use client";

import { PanelHeader } from "@/components/common/panel-header";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState, useTransition, type CSSProperties } from "react";
import { Edit2, ImageIcon, MapPin, Plus, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { deleteMemory } from "@/app/actions";
import { ActionMenu } from "@/components/common/action-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { useDialogPresence } from "@/components/common/use-dialog-presence";
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

/** One person's note about the place, written on the back of the photo. */
function MemoryNote({ memory, profile }: { memory: MemoryMapEntry; profile: Profile }) {
	const description = getUserDescription(memory, profile.id);

	return (
		<div className="pola-note">
			<UserAvatar profile={profile} />
			<div className="min-w-0 flex-1">
				<p className="pola-note-name">{profile.display_name}</p>
				<p className={description ? "pola-note-text" : "pola-note-text pola-note-text--empty"}>
					{description || "No description yet."}
				</p>
			</div>
		</div>
	);
}

// A pinned-up photo wall: each print sits at its own slight tilt, every other
// one held by a strip of tape.
const POLAROID_TILTS = [-2.6, 1.8, -1.2, 2.4, -1.9, 1.1, 2.8, -0.8];

/** A memory in the grid: just the Polaroid print; everything else is in the details. */
function MemoryPolaroid({
	memory,
	index,
	deleting,
	onEdit,
	onOpen,
	onRequestDelete,
}: {
	memory: MemoryMapEntry;
	index: number;
	deleting: boolean;
	onEdit: () => void;
	onOpen: () => void;
	onRequestDelete: () => void;
}) {
	const tape = index % 2 === 0 ? (index % 4 === 0 ? "pink" : "blue") : null;

	return (
		<article
			className="pola-card content-fade-in"
			style={{ viewTransitionName: `memory-${memory.id}`, "--tilt": `${POLAROID_TILTS[index % POLAROID_TILTS.length]}deg` } as CSSProperties}
		>
			{tape ? <span aria-hidden="true" className={`pola-tape pola-tape--${tape}`} /> : null}
			<button
				type="button"
				aria-label={`View ${memory.title}`}
				aria-haspopup="dialog"
				onClick={onOpen}
				className="pola-card-photo"
			>
				{memory.photo_url ? (
					<Image
						src={memory.photo_url}
						alt={memory.title}
						fill
						sizes="(min-width: 1024px) 16rem, (min-width: 640px) 30vw, 45vw"
						className="reveal-image object-cover"
						onLoad={(event) => { event.currentTarget.dataset.loaded = ""; }}
					/>
				) : (
					<span className="grid h-full place-items-center text-[#c76f87]">
						<ImageIcon size={28} strokeWidth={1.7} />
					</span>
				)}
			</button>
			<div className="pola-card-foot">
				<ActionMenu
					label={`Open actions for ${memory.title}`}
					disabled={deleting}
					sheetTitle="Memory actions"
					sheetDescription={memory.title}
					triggerClassName="pola-card-menu"
					onEdit={onEdit}
					onDelete={onRequestDelete}
				/>
			</div>
		</article>
	);
}

/**
 * Memory details. Opening plays a little Polaroid camera: it pops in, flashes,
 * the print slides out of its slot and develops from a pale wash into colour,
 * then the camera lifts away and the notes appear under the photo. Tapping
 * skips it; reduced motion shows the print straight away.
 */
function MemoryDetailsDialog({ memory: selected, participants, timeZone, onClose, onEdit }: {
	memory: MemoryMapEntry | null;
	participants: [Profile, Profile];
	timeZone: string;
	onClose: () => void;
	onEdit: (memory: MemoryMapEntry) => void;
}) {
	const { content: memory, open } = useDialogPresence(selected);
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const selectedId = selected?.id ?? null;
	const [introFor, setIntroFor] = useState(selectedId);
	const [introDone, setIntroDone] = useState(false);
	// Focus the stage itself on open: the close button is hidden during the
	// intro, and focusing a button lower down would scroll the print away.
	const stageRef = useRef<HTMLDivElement>(null);

	// Each opening takes the picture again.
	if (selectedId !== introFor) {
		setIntroFor(selectedId);
		if (selectedId) setIntroDone(false);
	}

	if (!memory) return null;
	const playIntro = !introDone && !reducedMotion;
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${memory.latitude},${memory.longitude}`;

	return (
		<Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Popup initialFocus={stageRef} className="note-reader-bare note-reader mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100svh-env(safe-area-inset-top)-1rem)] w-full flex-col text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90svh] sm:w-[min(25rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2">
					<div
						ref={stageRef}
						tabIndex={-1}
						className={`pola-stage outline-none ${playIntro ? "pola-stage--intro cursor-pointer" : ""}`}
						onClick={playIntro ? () => setIntroDone(true) : undefined}
					>
						{playIntro ? (
							<>
								<div
									aria-hidden="true"
									className="pola-camera"
									onAnimationEnd={(event) => { if (event.animationName === "pola-camera-out") setIntroDone(true); }}
								>
									<span className="pola-cam-button" />
									<span className="pola-cam-viewfinder" />
									<span className="pola-cam-bulb" />
									<span className="pola-cam-stripe" />
									<span className="pola-cam-lens" />
									<span className="pola-cam-heart">♥</span>
									<span className="pola-cam-slot" />
								</div>
								<span aria-hidden="true" className="pola-flash" />
							</>
						) : null}
						<DialogPrimitive.Close className={`pola-close ${playIntro ? "invisible" : ""}`}>
							<X size={18} aria-hidden="true" /><span className="sr-only">Close memory</span>
						</DialogPrimitive.Close>

						<figure className="pola-print">
							<div className="pola-print-photo">
								{memory.photo_url ? (
									<Image src={memory.photo_url} alt={memory.title} fill sizes="(min-width: 640px) 20rem, 80vw" className="pola-develop object-cover" />
								) : (
									<div className="pola-develop grid h-full place-items-center bg-[#f3e6ea] text-[#c76f87]">
										<ImageIcon size={36} strokeWidth={1.6} />
									</div>
								)}
								<span aria-hidden="true" className="pola-wash" />
							</div>
							<figcaption className="pola-print-caption">
								<DialogTitle className="pola-print-title">{memory.title}</DialogTitle>
								<span className="pola-print-date">{getMemoryDateLabel(memory.visited_at, timeZone)}</span>
							</figcaption>
						</figure>
						<DialogDescription className="sr-only">Photo, date and both of your notes about this place</DialogDescription>

						<div className="pola-details">
							<p className="flex justify-center">
								<span className="pola-type" style={{ backgroundColor: getMemoryTypeColor(memory.memory_type) }}>
									{memory.memory_type}
								</span>
							</p>
							<div className="grid gap-3">
								{participants.map((participant) => (
									<MemoryNote key={participant.id} memory={memory} profile={participant} />
								))}
							</div>
							<div className="grid grid-cols-2 gap-2">
								<a href={mapsUrl} target="_blank" rel="noreferrer" className="pola-button">
									<MapPin size={15} aria-hidden="true" />
									Open location
								</a>
								<button type="button" className="pola-button pola-button--primary" onClick={() => onEdit(memory)}>
									<Edit2 size={15} aria-hidden="true" />
									Edit
								</button>
							</div>
						</div>
					</div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
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
	const [detailMemory, setDetailMemory] = useState<MemoryMapEntry | null>(null);

	if (loading && memories.length === 0) {
		return <MemoryPanelSkeleton />;
	}

	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeader title="Memory map" description="Pin the places where your story happened.">
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					onClick={onNewMemory}
				>
					<Plus size={17} />
					Add memory
				</Button>
			</PanelHeader>

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
					onOpenMemory={setDetailMemory}
				/>
			</div>

			{memories.length ? (
				<div className="pola-grid">
					{memories.map((memory, index) => (
						<MemoryPolaroid
							key={memory.id}
							index={index}
							deleting={pending && deletingId === memory.id}
							memory={memory}
							onEdit={() => onEditMemory(memory)}
							onOpen={() => setDetailMemory(memory)}
							onRequestDelete={() => setMemoryToDelete(memory)}
						/>
					))}
				</div>
			) : (
				<div className="empty-state">
					<h3 className="font-serif text-2xl text-foreground">Every place has a story</h3>
					<p>Save your first place together, then add a photo or a little memory.</p>
				</div>
			)}

			<MemoryDetailsDialog
				memory={detailMemory}
				participants={participants}
				timeZone={timeZone}
				onClose={() => setDetailMemory(null)}
				onEdit={(memory) => {
					setDetailMemory(null);
					// Let the sheet slide away before the edit form opens.
					window.setTimeout(() => onEditMemory(memory), 260);
				}}
			/>

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
