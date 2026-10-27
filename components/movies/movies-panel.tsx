"use client";

import { useDialogPresence } from "@/components/common/use-dialog-presence";
import { PanelHeader } from "@/components/common/panel-header";
import Image from "next/image";
import { useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import {
	Bookmark,
	Check,
	CircleCheck,
	Clapperboard,
	Edit2,
	Play,
	Plus,
	Star,
	X,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

// --- Import Swiper React components, Modules và Styles ---
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { deleteMovie, updateMovieStatus } from "@/app/actions";
import { ActionMenu } from "@/components/common/action-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useToast } from "@/components/feedback/toast";
import { MoviesPanelSkeleton } from "@/components/our-space/tab-skeletons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie, MovieStatus, Profile } from "@/lib/types";

interface MoviesPanelProps {
	loading: boolean;
	movies: Movie[];
	partner: Profile;
	profile: Profile;
	onEditMovie: (movie: Movie) => void;
	onMovieDeleted: (movieId: string) => void;
	onMovieSaved: (movie: Movie) => void;
	onNewMovie: () => void;
}

const columns: Array<{
	status: MovieStatus;
	title: string;
	empty: string;
	icon: typeof Play;
	iconClassName: string;
}> = [
	{
		status: "watching",
		title: "Watching",
		empty: "No movies are currently playing.",
		icon: Play,
		iconClassName:
			"border-foreground/10 bg-foreground/6 text-foreground",
	},
	{
		status: "wishlist",
		title: "Wishlist",
		empty: "No saved movies yet.",
		icon: Bookmark,
		iconClassName:
			"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200",
	},
	{
		status: "watched",
		title: "Watched",
		empty: "No watched movies yet.",
		icon: CircleCheck,
		iconClassName:
			"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200",
	},
];

function getNextStatus(movie: Movie) {
	if (movie.status === "wishlist") {
		return {
			status: "watching" as const,
			label: "Mark as watching",
			icon: Play,
		};
	}

	if (movie.status === "watching") {
		return {
			status: "watched" as const,
			label: "Mark as watched",
			icon: Check,
		};
	}

	return null;
}

function getMovieCategories(movie: Movie) {
	if (!movie.category) return [];
	const category = movie.category as Movie["category"] | string;
	return (Array.isArray(category) ? category : [category]).filter(
		(category): category is string => Boolean(category),
	);
}

function UserAvatar({
	profile,
	className = "size-8 text-base",
	imageSizes = "2rem",
}: {
	profile: Profile;
	className?: string;
	imageSizes?: string;
}) {
	const avatar = profile.avatar_url;
	const isImage =
		avatar?.startsWith("http://") || avatar?.startsWith("https://");
	const imageSrc = isImage ? avatar : null;

	return (
		<span
			className={[
				"relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/30",
				className,
			].join(" ")}
		>
			{imageSrc ? (
				<Image
					src={imageSrc}
					alt=""
					fill
					sizes={imageSizes}
					className="object-cover"
				/>
			) : (
				(avatar ?? "🙂")
			)}
		</span>
	);
}

function getUserComment(movie: Movie, userId: string) {
	return movie.comment_by_user?.[userId] ?? null;
}

function getUserRating(movie: Movie, userId: string) {
	const rating = movie.rating_by_user?.[userId];
	return typeof rating === "number" ? rating : null;
}

function getUserReaction(movie: Movie, userId: string) {
	return movie.reaction_by_user?.[userId] ?? null;
}

function MovieCard({
	movie,
	onEdit,
	onRequestDelete,
	onShowDetails,
}: {
	movie: Movie;
	onEdit: () => void;
	onRequestDelete: () => void;
	onShowDetails: () => void;
}) {
	return (
		<article style={{ viewTransitionName: `movie-${movie.id}` }} className="content-fade-in relative h-full w-full overflow-hidden rounded-2xl bg-transparent shadow-none sm:bg-surface sm:shadow-[0_14px_32px_rgba(23,23,23,0.08)] dark:sm:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
			<button
				type="button"
				aria-label={`View details for ${movie.title}`}
				className="relative block aspect-[2/3] h-full w-full overflow-hidden rounded-[1rem] bg-surface-hover text-left"
				onClick={onShowDetails}
			>
				{movie.poster_url ? (
					<Image
						src={movie.poster_url}
						alt={`${movie.title} poster`}
						fill
						sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 80vw"
						className="reveal-image object-cover"
						onLoad={(event) => { event.currentTarget.dataset.loaded = ""; }}
					/>
				) : (
					<div className="grid h-full place-items-center bg-primary p-4 text-center text-primary-foreground">
						<Clapperboard size={42} />
						<span className="sr-only">{movie.title}</span>
					</div>
				)}
			</button>
			<div className="absolute right-3 top-3">
				<ActionMenu
					label={`Open actions for ${movie.title}`}
					sheetTitle="Movie actions"
					sheetDescription={movie.title}
					onEdit={onEdit}
					onDelete={onRequestDelete}
				/>
			</div>
			{/* <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap gap-1.5">
				{participants.map((participant) => (
					<MovieSignal
						key={participant.id}
						movie={movie}
						profile={participant}
						compact
					/>
				))}
			</div> */}
		</article>
	);
}

const statusLabels: Record<MovieStatus, string> = {
	wishlist: "🔖 Wishlist",
	watching: "🍿 Watching",
	watched: "✅ Watched",
};

/** A punched perforation across the ticket: dashes between two half-circle notches. */
function TicketPerforation() {
	return <div aria-hidden="true" className="movie-pass-perf movie-pass-reveal" />;
}

/** One person's seat on the ticket: their rating, reaction and comment. */
function TicketSeat({ movie, profile, seat }: { movie: Movie; profile: Profile; seat: string }) {
	const rating = getUserRating(movie, profile.id);
	const reaction = getUserReaction(movie, profile.id);
	const comment = getUserComment(movie, profile.id);

	return (
		<div className="movie-pass-seat movie-pass-reveal">
			<span className="movie-pass-seat-no" aria-label={`Seat ${seat}`}>{seat}</span>
			<UserAvatar profile={profile} className="size-9 text-lg" imageSizes="2.25rem" />
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<p className="movie-pass-seat-name">{profile.display_name}</p>
					{rating !== null || reaction ? (
						<p className="movie-pass-score">
							{rating !== null ? (
								<span className="inline-flex items-center gap-0.5">
									<Star size={13} fill="currentColor" aria-hidden="true" />
									{rating.toFixed(1)}
								</span>
							) : null}
							{reaction ? <span>{reaction}</span> : null}
						</p>
					) : null}
				</div>
				<p className={comment ? "movie-pass-comment" : "movie-pass-comment movie-pass-comment--empty"}>
					{comment ? `“${comment}”` : "No comment yet."}
				</p>
			</div>
		</div>
	);
}

/**
 * Movie details drawn as one big cinema ticket (no dialog chrome). Opening
 * plays on the ticket itself: it drops in, its "Admit two" stub tears off the
 * top, and the lines print onto the stock in turn. Tapping skips it.
 */
function MovieDetailsDialog({
	movie: selectedDetail,
	busy,
	participants,
	onClose,
	onEdit,
	onMoveStatus,
}: {
	movie: Movie | null;
	busy: boolean;
	participants: [Profile, Profile];
	onClose: () => void;
	onEdit: (movie: Movie) => void;
	onMoveStatus: (movie: Movie, status: MovieStatus) => void;
}) {
	const { content: movie, open } = useDialogPresence(selectedDetail);
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const selectedId = selectedDetail?.id ?? null;
	const [introFor, setIntroFor] = useState(selectedId);
	const [introDone, setIntroDone] = useState(false);
	// Focus the ticket itself on open: the close button is hidden during the
	// intro, and focusing a button at the foot would scroll the ticket.
	const ticketRef = useRef<HTMLElement>(null);

	// Each opening plays the ticket intro afresh.
	if (selectedId !== introFor) {
		setIntroFor(selectedId);
		if (selectedId) setIntroDone(false);
	}

	if (!movie) return null;

	const playIntro = !introDone && !reducedMotion;
	const nextStatus = getNextStatus(movie);
	const NextIcon = nextStatus?.icon;
	const categories = getMovieCategories(movie);
	const ticketNo = movie.id.replace(/-/g, "").slice(0, 8).toUpperCase();
	let line = 0;
	const reveal = () => ({ "--i": line++ }) as CSSProperties;

	return (
		<Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Popup initialFocus={ticketRef} className="note-reader-bare note-reader mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100svh-env(safe-area-inset-top)-1rem)] w-full flex-col text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88svh] sm:w-[min(27rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2">
					<div
						className={`flex min-h-0 flex-1 flex-col px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-16 sm:p-0 ${playIntro ? "cursor-pointer" : ""}`}
						onClick={playIntro ? () => setIntroDone(true) : undefined}
					>
						<div className={`movie-pass-wrap ${playIntro ? "movie-pass--intro" : ""}`}>
							{playIntro ? (
								<div aria-hidden="true" className="movie-pass-stub" onAnimationEnd={() => setIntroDone(true)}>
									<span>Admit</span>
									<strong>♥ 2 ♥</strong>
									<span>Our Space cinema</span>
								</div>
							) : null}
							<DialogPrimitive.Close className={`movie-pass-close ${playIntro ? "invisible" : ""}`}>
								<X size={18} aria-hidden="true" /><span className="sr-only">Close movie details</span>
							</DialogPrimitive.Close>
							<article ref={ticketRef} tabIndex={-1} className="movie-pass outline-none">
								<p className="movie-pass-kicker movie-pass-reveal" style={reveal()}>
									<span aria-hidden="true">✦</span> Admit two · Row ♥
								</p>

								<div className="movie-pass-hero">
									<div className="movie-pass-poster movie-pass-reveal" style={reveal()}>
										<span aria-hidden="true" className="movie-pass-tape" />
										<div className="relative aspect-[2/3] overflow-hidden rounded-[10px] bg-[#f3eef0]">
											{movie.poster_url ? (
												<Image
													src={movie.poster_url}
													alt={`${movie.title} poster`}
													fill
													sizes="9rem"
													className="object-cover"
												/>
											) : (
												<div className="grid h-full place-items-center text-[#c76f87]">
													<Clapperboard size={34} />
												</div>
											)}
										</div>
									</div>
									<div className="min-w-0 flex-1 movie-pass-reveal" style={reveal()}>
										<p className="movie-pass-label">Now showing</p>
										<DialogTitle className="movie-pass-title">{movie.title}</DialogTitle>
										<DialogDescription className="sr-only">Movie details and both of your reviews</DialogDescription>
										<div className="mt-3 flex flex-wrap gap-1.5">
											{categories.map((category) => (
												<span key={category} className="movie-pass-chip">🎬 {category}</span>
											))}
											<span className="movie-pass-chip movie-pass-chip--status">{statusLabels[movie.status]}</span>
										</div>
									</div>
								</div>

								<TicketPerforation />

								<div className="grid gap-3.5">
									{participants.map((participant, index) => (
										<div key={participant.id} style={reveal()} className="contents">
											<TicketSeat movie={movie} profile={participant} seat={`A${index + 1}`} />
										</div>
									))}
								</div>

								<TicketPerforation />

								<div className="movie-pass-actions movie-pass-reveal" style={reveal()}>
									<button type="button" className="movie-pass-button" onClick={() => onEdit(movie)}>
										<Edit2 size={15} aria-hidden="true" />
										Edit
									</button>
									{nextStatus ? (
										<button
											type="button"
											className="movie-pass-button movie-pass-button--primary"
											disabled={busy}
											onClick={() => onMoveStatus(movie, nextStatus.status)}
										>
											{NextIcon ? <NextIcon size={15} aria-hidden="true" /> : null}
											{busy ? "Updating..." : nextStatus.label}
										</button>
									) : null}
								</div>

								<footer className="movie-pass-footer movie-pass-reveal" style={reveal()} aria-hidden="true">
									<span className="movie-pass-doodle">♡ ✦ ♡</span>
									<span className="grid justify-items-end gap-1">
										<span className="movie-pass-barcode" />
										<span className="movie-pass-no">No. {ticketNo}</span>
									</span>
								</footer>
							</article>
						</div>
					</div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	);
}

export function MoviesPanel({
	loading,
	movies,
	partner,
	profile,
	onEditMovie,
	onMovieDeleted,
	onMovieSaved,
	onNewMovie,
}: MoviesPanelProps) {
	const toast = useToast();
	const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
	const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const participants: [Profile, Profile] = [profile, partner];
	const moviesByStatus = useMemo(
		() =>
			columns.map((column) => ({
				...column,
				movies: movies.filter((movie) => movie.status === column.status),
			})),
		[movies],
	);

	const handleDelete = () => {
		if (!selectedMovie) return;
		const movieId = selectedMovie.id;
		setBusyId(movieId);

		startTransition(async () => {
			const result = await deleteMovie(movieId);
			toast(result.message, {
				variant: result.ok ? "success" : "error",
			});
			if (result.ok) {
				onMovieDeleted(movieId);
				setSelectedMovie(null);
			}
			setBusyId(null);
		});
	};

	const handleMoveStatus = (movie: Movie, status: MovieStatus) => {
		setBusyId(movie.id);
		startTransition(async () => {
			const result = await updateMovieStatus(movie.id, status);
			toast(result.message, {
				variant: result.ok ? "success" : "error",
			});
			if (result.ok) {
				onMovieSaved(result.movie);
				closeMovieDetails();
			}
			setBusyId(null);
		});
	};

	const openMovieDetails = (movie: Movie) => {
		setDetailMovie(movie);
	};

	const closeMovieDetails = () => {
		setDetailMovie(null);
	};

	if (loading && movies.length === 0) {
		return <MoviesPanelSkeleton />;
	}

	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeader title="Movies" description="Keeping track of your favorite movies.">
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					onClick={onNewMovie}
				>
					<Plus size={17} />
					New movie
				</Button>
			</PanelHeader>

			{/* With nothing in any list, one empty state replaces the three empty sections. */}
			{!loading && movies.length === 0 ? (
				<div className="app-card flex flex-col items-center px-6 py-14 text-center sm:py-20">
					<span className="glass-chip grid size-14 place-items-center rounded-full text-foreground">
						<Clapperboard size={24} aria-hidden="true" />
					</span>
					<h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Your movie list is empty</h3>
					<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Save films to watch together, then keep track of what you have seen and loved.</p>
				</div>
			) : (
			<div className="grid gap-6">
				{moviesByStatus.map((column) => (
					<section
						key={column.status}
						className="grid content-start gap-3 min-w-0"
					>
						<div className="app-card flex items-center justify-between px-4 py-3">
							<div className="flex min-w-0 items-center gap-3">
								<span
									className={`grid size-9 shrink-0 place-items-center rounded-full border ${column.iconClassName}`}
								>
									<column.icon size={17} />
								</span>
								<h3 className="truncate font-bold text-foreground">
									{column.title}
								</h3>
							</div>
							<span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary-border bg-primary-subtle text-xs font-bold text-accent-foreground">
								{column.movies.length}
							</span>
						</div>

						{column.movies.length ? (
							<>
								{/* --- NÂNG CẤP CHẾ ĐỘ MOBILE --- */}
								<div className="block sm:hidden -mx-4 overflow-hidden p-6">
									<Swiper
										modules={[Pagination]}
										cssMode={false}
										grabCursor={true}
										watchSlidesProgress={true}
										centeredSlides={true}
										pagination={{
											clickable: true,
											dynamicBullets: true,
											dynamicMainBullets: 3,
										}}
										spaceBetween={12} // Khoảng cách nhỏ lại để UI chặt chẽ hơn
										slidesPerView="auto"
										className="!overflow-visible [--swiper-pagination-bottom:-20px] [--swiper-pagination-color:var(--theme-primary)]"
									>
										{column.movies.map((movie) => (
											<SwiperSlide
												key={movie.id}
												className="!w-[175px]" // Tỷ lệ vàng cho mobile, không to tràn viền
											>
												{({ isActive }) => (
													<div
														// Custom easing Apple-style, thêm shadow và trục Y 3D
														className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] h-full origin-center rounded-2xl ${
															isActive
																? "scale-100 opacity-100 shadow-[10px_10px_30px_-10px_rgba(0,0,0,0.5)] -translate-y-2" // Nổi lên, sáng, bóng đổ to
																: "scale-[0.82] opacity-40 translate-y-3 pointer-events-none" // Chìm xuống, mờ, khóa click
														}`}
													>
														<MovieCard
															movie={movie}
															onEdit={() => onEditMovie(movie)}
															onRequestDelete={() => setSelectedMovie(movie)}
															onShowDetails={() => openMovieDetails(movie)}
														/>
													</div>
												)}
											</SwiperSlide>
										))}
									</Swiper>
								</div>

								{/* --- CHẾ ĐỘ DESKTOP: GRID NHƯ CŨ --- */}
								<div className="hidden sm:grid md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7 gap-4">
									{column.movies.map((movie) => (
										<MovieCard
											key={movie.id}
											movie={movie}
											onEdit={() => onEditMovie(movie)}
											onRequestDelete={() => setSelectedMovie(movie)}
											onShowDetails={() => openMovieDetails(movie)}
										/>
									))}
								</div>
							</>
						) : loading ? (
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
								{Array.from({ length: 5 }).map((_, index) => (
									<div
										key={index}
										className="app-card overflow-hidden p-0"
									>
										<Skeleton className="aspect-[2/3] rounded-none" />
									</div>
								))}
							</div>
						) : (
							<p className="px-4 text-sm text-muted-foreground">{column.empty}</p>
						)}
					</section>
				))}
			</div>
			)}

			<ConfirmDialog
				open={Boolean(selectedMovie)}
				title="Delete movie?"
				description={
					selectedMovie
						? `${selectedMovie.title} will be removed from your couple movie list.`
						: "This movie will be removed."
				}
				pending={pending && Boolean(busyId)}
				onClose={() => setSelectedMovie(null)}
				onConfirm={handleDelete}
			/>
			<MovieDetailsDialog
				movie={detailMovie}
				busy={pending && busyId === detailMovie?.id}
				participants={participants}
				onClose={closeMovieDetails}
				onEdit={(movie) => {
					closeMovieDetails();
					window.setTimeout(() => onEditMovie(movie), 260);
				}}
				onMoveStatus={handleMoveStatus}
			/>
		</div>
	);
}
