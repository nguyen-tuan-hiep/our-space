"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
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
import { NativeDialog } from "@/components/ui/native-controls";
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
			"border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200",
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

function UserCommentBlock({
	movie,
	profile,
}: {
	movie: Movie;
	profile: Profile;
}) {
	const comment = getUserComment(movie, profile.id);

	return (
		<div className="flex items-start gap-3">
			<div className="grid size-10 shrink-0 place-items-center">
				<UserAvatar profile={profile} />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<p className="min-w-0 truncate text-sm font-bold leading-5 text-foreground">
						{profile.display_name}
					</p>

					<MovieSignal
						movie={movie}
						profile={profile}
						inline
						showAvatar={false}
					/>
				</div>

				<p
					className={[
						"whitespace-pre-wrap break-words text-sm leading-5",
						comment ? "text-muted-foreground" : "text-subtle-foreground",
					].join(" ")}
				>
					{comment || "No comment yet."}
				</p>
			</div>
		</div>
	);
}

function MovieSignal({
	movie,
	profile,
	inline = false,
	showAvatar = true,
}: {
	movie: Movie;
	profile: Profile;
	inline?: boolean;
	showAvatar?: boolean;
}) {
	const rating = getUserRating(movie, profile.id);
	const reaction = getUserReaction(movie, profile.id);

	if (rating === null && !reaction) return null;

	return (
		<div
			className={[
				"inline-flex shrink-0 items-center gap-1 rounded-full text-primary backdrop-blur-md h-5 px-2 leading-none",
			].join(" ")}
		>
			{showAvatar ? <UserAvatar profile={profile} /> : null}

			{rating !== null ? (
				<span className="inline-flex items-center gap-0.5 font-bold">
					<Star
						size={14}
						fill="currentColor"
					/>
					{rating.toFixed(1)}
				</span>
			) : null}

			{reaction ? <span>{reaction}</span> : null}
		</div>
	);
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
		<article className="content-fade-in relative h-full w-full overflow-hidden rounded-2xl bg-transparent shadow-none sm:bg-surface sm:shadow-[0_14px_32px_rgba(23,23,23,0.08)] dark:sm:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
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
						className="object-cover"
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

function MovieDetailsDialog({
	movie,
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
	if (!movie) return null;

	const nextStatus = getNextStatus(movie);
	const NextIcon = nextStatus?.icon;
	const categories = getMovieCategories(movie);

	return (
		<NativeDialog
			open={Boolean(movie)}
			onClose={onClose}
			title={movie.title}
			maxWidth="md"
			showHandle={false}
			showTitle={false}
			contentClassName="!p-0"
		>
			<button
				type="button"
				aria-label="Close movie details"
				className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-surface/90 text-muted-foreground shadow-[0_8px_22px_rgba(23,23,23,0.16)] backdrop-blur hover:bg-surface-hover hover:text-foreground"
				onClick={onClose}
			>
				<X size={18} />
			</button>

			<div className="grid min-h-0 sm:grid-cols-[15rem_1fr]">
				<div className="relative overflow-visible bg-primary px-4 pb-0 pt-5 sm:overflow-hidden sm:bg-primary-subtle sm:p-0">
					{movie.poster_url ? (
						<>
							<div className="absolute inset-0 overflow-hidden sm:hidden">
								<Image
									src={movie.poster_url}
									alt=""
									fill
									sizes="100vw"
									className="scale-110 object-cover opacity-90 blur-md"
									aria-hidden="true"
								/>
								<div className="absolute inset-0 bg-primary/20" />
							</div>
						</>
					) : null}
					<div className="relative z-[1] mx-auto -mb-14 aspect-[2/3] w-[min(70vw,15rem)] overflow-hidden rounded-2xl bg-surface-hover shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:mb-0 sm:h-full sm:w-full sm:rounded-none sm:shadow-none">
						{movie.poster_url ? (
							<Image
								src={movie.poster_url}
								alt={`${movie.title} poster`}
								fill
								sizes="(min-width: 640px) 15rem, 100vw"
								className="object-cover"
							/>
						) : (
							<div className="grid h-full place-items-center bg-primary text-primary-foreground">
								<Clapperboard size={52} />
							</div>
						)}
					</div>
				</div>

				<div className="flex min-h-0 flex-col gap-3 p-5 pt-24 sm:p-6">
					<div>
						<div>
							<h2 className="font-serif text-3xl leading-tight text-foreground">
								{movie.title}
							</h2>
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex flex-wrap items-center gap-2">
							{categories.map((category) => (
								<span
									key={category}
									className="rounded-full bg-primary-subtle px-3 py-1.5 text-sm font-bold text-muted-foreground"
								>
									{category}
								</span>
							))}
							<span className="rounded-full bg-primary-subtle px-3 py-1.5 text-sm font-bold text-muted-foreground">
								{movie.status === "wishlist"
									? "Wishlist"
									: movie.status === "watching"
										? "Watching"
										: "Watched"}
							</span>
						</div>
						{/* <div className="flex flex-wrap items-center gap-2">
							{participants.map((participant) => (
								<MovieSignal
									key={participant.id}
									movie={movie}
									profile={participant}
								/>
							))}
						</div> */}
					</div>

					<div className="mt-auto overflow-hidden rounded-2xl border border-primary-border bg-primary-subtle/55">
						<div
							className="
			max-h-32 overflow-y-auto
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
									<UserCommentBlock
										key={participant.id}
										movie={movie}
										profile={participant}
									/>
								))}
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-11 w-full rounded-2xl"
							onClick={() => onEdit(movie)}
						>
							<Edit2 size={16} />
							Edit
						</Button>
						{nextStatus ? (
							<Button
								type="button"
								variant="outline"
								className="h-11 w-full rounded-2xl"
								disabled={busy}
								onClick={() => onMoveStatus(movie, nextStatus.status)}
							>
								{NextIcon ? <NextIcon size={16} /> : null}
								{busy ? "Updating..." : nextStatus.label}
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</NativeDialog>
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
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Movies
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Keeping track of your favorite movies.
					</p>
				</div>
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					onClick={onNewMovie}
				>
					<Plus size={17} />
					New movie
				</Button>
			</div>

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
							<div className="rounded-2xl border border-dashed border-primary-border bg-muted p-5 text-sm font-semibold text-muted-foreground">
								{column.empty}
							</div>
						)}
					</section>
				))}
			</div>

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
