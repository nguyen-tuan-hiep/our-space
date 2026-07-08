"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
	useEffect,
	useRef,
	useState,
	useTransition,
	type RefObject,
} from "react";
import { Edit2, EllipsisVertical, MapPin, Plus, Trash2 } from "lucide-react";
import { deleteMemory } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { useDelayedRender } from "@/components/ui/use-delayed-render";
import { getMemoryTypeOption } from "@/lib/memory-map";
import type { MemoryMapEntry } from "@/lib/types";
import { outlineButtonClass, primaryButtonClass } from "./shared-classes";

interface MemoryMapPanelProps {
	loading: boolean;
	memories: MemoryMapEntry[];
	timeZone: string;
	onEditMemory: (memory: MemoryMapEntry) => void;
	onMemoryDeleted: (memoryId: string) => void;
	onNewMemory: () => void;
}

const LeafletMemoryMap = dynamic(
	() =>
		import("@/components/our-space/memory-map-leaflet-surface").then(
			(mod) => mod.LeafletMemoryMap,
		),
	{
		ssr: false,
		loading: () => (
			<div className="overflow-hidden rounded-2xl border border-neutral-200 bg-paper p-2 shadow-md rounded-2xl sm:p-3">
				<div className="grid min-h-[22rem] place-items-center rounded-2xl bg-[#dbe7df] text-sm font-semibold text-neutral-600 sm:min-h-[31rem]">
					Loading map...
				</div>
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

function MemoryCard({
	memory,
	timeZone,
	active,
	menuClosing,
	deleting,
	menuRef,
	shouldRenderMenu,
	onEdit,
	onMenuClose,
	onMenuOpen,
	onRequestDelete,
}: {
	active: boolean;
	deleting: boolean;
	menuClosing: boolean;
	memory: MemoryMapEntry;
	menuRef: RefObject<HTMLDivElement | null>;
	shouldRenderMenu: boolean;
	timeZone: string;
	onEdit: () => void;
	onMenuClose: () => void;
	onMenuOpen: () => void;
	onRequestDelete: () => void;
}) {
	const option = getMemoryTypeOption(memory.memory_type);
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${memory.latitude},${memory.longitude}`;

	const handleEditClick = () => {
		onMenuClose();
		onEdit();
	};

	const handleDeleteClick = () => {
		onMenuClose();
		onRequestDelete();
	};

	return (
		<article
			className={[
				"relative overflow-visible rounded-2xl border border-neutral-200 bg-paper shadow-md",
			].join(" ")}
		>
			{memory.photo_url ? (
				<div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-neutral-100 sm:rounded-t-lg">
					<Image
						src={memory.photo_url}
						alt={memory.title}
						fill
						className="object-cover"
					/>
				</div>
			) : null}
			<div className="grid gap-3 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
							{option.emoji} {option.label}
						</p>
						<h3 className="mt-1 truncate font-serif text-2xl leading-tight text-neutral-950">
							{memory.title}
						</h3>
					</div>

					<div
						className="relative -mr-2 shrink-0"
						ref={active ? menuRef : null}
					>
						<button
							type="button"
							aria-label={`Open actions for ${memory.title}`}
							id={`memory-menu-button-${memory.id}`}
							aria-controls={active ? "memory-menu" : undefined}
							aria-expanded={active ? "true" : undefined}
							aria-haspopup="menu"
							disabled={deleting}
							className="grid size-9 place-items-center rounded-full text-neutral-500 transition active:scale-[0.8] hover:bg-mui/10 disabled:cursor-not-allowed disabled:opacity-50 sm:size-8"
							onClick={onMenuOpen}
						>
							<EllipsisVertical size={18} />
						</button>
						{shouldRenderMenu ? (
							<>
								<button
									type="button"
									aria-label="Close memory actions"
									className={[
										"fixed inset-0 z-[50] bg-black/20 backdrop-blur-sm sm:hidden",
										menuClosing
											? "native-dialog-backdrop-out"
											: "native-dialog-backdrop-in",
									].join(" ")}
									onClick={onMenuClose}
								/>
								<div
									id="memory-menu"
									role="menu"
									aria-labelledby={`memory-menu-button-${memory.id}`}
									className={[
										"mobile-sheet-motion fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] overflow-hidden rounded-2xl border border-white/80 bg-paper p-2 shadow-[0_18px_60px_rgba(30,25,20,0.24)] backdrop-blur-xl will-change-transform sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-9 sm:w-44 sm:border-neutral-200 sm:p-1 sm:shadow-lg sm:backdrop-blur-none",
										menuClosing ? "native-sheet-out" : "native-sheet-in",
									].join(" ")}
								>
									<button
										type="button"
										role="menuitem"
										onClick={handleEditClick}
										className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-neutral-800 transition active:scale-[0.8] hover:bg-mui/10 sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
									>
										<span className="grid size-9 place-items-center rounded-full bg-mui/10 text-mui sm:size-auto sm:bg-transparent sm:text-inherit">
											<Edit2 size={16} />
										</span>
										Edit
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={handleDeleteClick}
										className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-danger transition active:scale-[0.8] hover:bg-danger-bg sm:mt-0 sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
									>
										<span className="grid size-9 place-items-center rounded-full bg-danger-bg text-danger sm:size-auto sm:bg-transparent">
											<Trash2 size={16} />
										</span>
										Delete
									</button>
								</div>
							</>
						) : null}
					</div>
				</div>
				<div className="grid gap-1 text-sm text-neutral-600">
					<p>{getMemoryDateLabel(memory.visited_at, timeZone)}</p>
					{memory.description ? (
						<p className="line-clamp-3 leading-6 text-neutral-600">
							{memory.description}
						</p>
					) : null}
				</div>
				<a
					href={mapsUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 text-sm font-bold text-neutral-700 transition hover:border-mui hover:text-mui sm:w-fit"
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
	timeZone,
	onEditMemory,
	onMemoryDeleted,
	onNewMemory,
}: MemoryMapPanelProps) {
	const toast = useToast();
	const [activeMemory, setActiveMemory] = useState<MemoryMapEntry | null>(null);
	const [renderedMenuMemoryId, setRenderedMenuMemoryId] = useState<
		string | null
	>(null);
	const [memoryToDelete, setMemoryToDelete] = useState<MemoryMapEntry | null>(
		null,
	);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const menuOpen = Boolean(activeMemory);
	const { closing: menuClosing, shouldRender: shouldRenderMenu } =
		useDelayedRender(menuOpen);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (activeMemory) setRenderedMenuMemoryId(activeMemory.id);
	}, [activeMemory]);

	useEffect(() => {
		if (shouldRenderMenu) return;
		setRenderedMenuMemoryId(null);
	}, [shouldRenderMenu]);

	useEffect(() => {
		if (!menuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !menuRef.current?.contains(target)) {
				setActiveMemory(null);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setActiveMemory(null);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuOpen]);

	const handleMenuOpen = (memory: MemoryMapEntry) => {
		setActiveMemory((current) => (current?.id === memory.id ? null : memory));
	};

	const handleMenuClose = () => {
		setActiveMemory(null);
	};

	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Memory map
					</h2>
					<p className="mt-1 hidden text-sm text-neutral-500 sm:block">
						Pin the places where your story happened.
					</p>
				</div>
				<button
					type="button"
					className={`${primaryButtonClass} hidden sm:inline-flex sm:w-auto`}
					onClick={onNewMemory}
				>
					<Plus size={17} />
					Add memory
				</button>
			</div>

			<div className="relative">
				{loading ? (
					<div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-white/45 text-sm font-semibold text-neutral-600 backdrop-blur-[1px]">
						Loading memories...
					</div>
				) : null}
				<LeafletMemoryMap
					memories={memories}
					onEditMemory={onEditMemory}
					onNewMemory={onNewMemory}
				/>
			</div>

			{memories.length ? (
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{memories.map((memory) => (
						<MemoryCard
							key={memory.id}
							active={activeMemory?.id === memory.id}
							deleting={pending && deletingId === memory.id}
							menuClosing={menuClosing}
							menuRef={menuRef}
							memory={memory}
							shouldRenderMenu={
								shouldRenderMenu && renderedMenuMemoryId === memory.id
							}
							timeZone={timeZone}
							onEdit={() => onEditMemory(memory)}
							onMenuClose={handleMenuClose}
							onMenuOpen={() => handleMenuOpen(memory)}
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
