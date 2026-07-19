"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { Check, Clapperboard, Play, Edit2, Plus, Star, X } from "lucide-react";

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
import type { Movie, MovieStatus } from "@/lib/types";

interface MoviesPanelProps {
	loading: boolean;
	movies: Movie[];
	onEditMovie: (movie: Movie) => void;
	onMovieDeleted: (movieId: string) => void;
	onMovieSaved: (movie: Movie) => void;
	onNewMovie: () => void;
}

const columns: Array<{
	status: MovieStatus;
	title: string;
	empty: string;
}> = [
	{
		status: "watching",
		title: "Watching",
		empty: "No movies are currently playing.",
	},
	{
		status: "wishlist",
		title: "Wishlist",
		empty: "No saved movies yet.",
	},
	{
		status: "watched",
		title: "Watched",
		empty: "No watched movies yet.",
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
		<article className="app-card-interactive content-fade-in relative overflow-hidden p-0 w-full h-full rounded-2xl">
			<button
				type="button"
				aria-label={`View details for ${movie.title}`}
				className="relative block aspect-[2/3] w-full h-full overflow-hidden bg-neutral-100 text-left"
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
					<div className="grid h-full place-items-center bg-neutral-950 p-4 text-center text-neutral-50">
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
		</article>
	);
}

function MovieDetailsDialog({
	movie,
	busy,
	onClose,
	onEdit,
	onMoveStatus,
}: {
	movie: Movie | null;
	busy: boolean;
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
				className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-paper/90 text-neutral-700 shadow-[0_8px_22px_rgba(23,23,23,0.16)] backdrop-blur hover:bg-neutral-950 hover:text-white"
				onClick={onClose}
			>
				<X size={18} />
			</button>

			<div className="grid min-h-0 sm:grid-cols-[15rem_1fr]">
				<div className="relative overflow-visible bg-neutral-950 px-4 pb-0 pt-5 sm:overflow-hidden sm:bg-neutral-100 sm:p-0">
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
								<div className="absolute inset-0 bg-black/20" />
							</div>
						</>
					) : null}
					<div className="relative z-[1] mx-auto -mb-14 aspect-[2/3] w-[min(70vw,15rem)] overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:mb-0 sm:h-full sm:w-full sm:rounded-none sm:shadow-none">
						{movie.poster_url ? (
							<Image
								src={movie.poster_url}
								alt={`${movie.title} poster`}
								fill
								sizes="(min-width: 640px) 15rem, 100vw"
								className="object-cover"
							/>
						) : (
							<div className="grid h-full place-items-center bg-neutral-950 text-neutral-50">
								<Clapperboard size={52} />
							</div>
						)}
					</div>
				</div>

				<div className="flex min-h-0 flex-col gap-4 p-5 pt-24 sm:p-6">
					<div>
						<div>
							<h2 className="font-serif text-3xl leading-tight text-neutral-950">
								{movie.title}
							</h2>
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex flex-wrap items-center gap-2">
							{categories.map((category) => (
								<span
									key={category}
									className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-600"
								>
									{category}
								</span>
							))}
							<span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-600">
								{movie.status === "wishlist"
									? "Wishlist"
									: movie.status === "watching"
										? "Watching"
										: "Watched"}
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{movie.rating ? (
								<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">
									<Star
										size={15}
										fill="currentColor"
									/>
									{movie.rating.toFixed(1)}
								</span>
							) : null}
							{movie.reaction ? (
								<span className="text-2xl leading-none">{movie.reaction}</span>
							) : null}
						</div>
					</div>

					{movie.comment ? (
						<p className="text-sm leading-7 text-neutral-600">
							{movie.comment}
						</p>
					) : (
						<p className="text-sm leading-7 text-neutral-500">
							No comment yet.
						</p>
					)}

					<div className="mt-auto flex flex-col gap-2 pt-2">
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
					<p className="mt-1 text-sm text-neutral-500">
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
						<div className="flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3 text-neutral-50">
							<h3 className="font-bold">{column.title}</h3>
							<span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
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
										className="!overflow-visible [--swiper-pagination-color:#0a0a0a] [--swiper-pagination-bottom:-20px]"
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
																? "scale-100 opacity-100 shadow-[10px_10px_30px_-10px_rgba(0,0,0,0.5)] -translate-y-2 ring-1 ring-black/5" // Nổi lên, sáng, bóng đổ to
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
								<div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
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
							<div className="app-card p-5 text-sm font-semibold text-neutral-500">
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
