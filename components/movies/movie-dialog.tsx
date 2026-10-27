"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useOpenSync } from "@/components/common/use-open-sync";
import { ImageUp, SmilePlus } from "lucide-react";
import {
	createMovie,
	deleteUnsavedCloudinaryImage,
	updateMovie,
} from "@/app/actions";
import { EmojiPickerDialog } from "@/components/common/emoji-picker-dialog";
import { useToast } from "@/components/feedback/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTextarea,
	style as fieldClass,
} from "@/components/ui/native-controls";
import { movieCategories, movieStatuses } from "@/lib/constants";
import type { Movie, MovieStatus, Profile } from "@/lib/types";
import { celebrateSave } from "@/components/common/save-celebration";

const ratingOptions = Array.from({ length: 19 }, (_, index) =>
	String(1 + index * 0.5),
);

interface MovieDialogProps {
	open: boolean;
	movie?: Movie | null;
	onClose: () => void;
	onSaved?: (movie: Movie) => void;
	profile: Profile;
}

function getUserComment(movie: Movie | null | undefined, userId: string) {
	return movie?.comment_by_user?.[userId] ?? "";
}

function getUserRating(movie: Movie | null | undefined, userId: string) {
	const rating = movie?.rating_by_user?.[userId];
	return typeof rating === "number" ? String(rating) : "";
}

function getUserReaction(movie: Movie | null | undefined, userId: string) {
	return movie?.reaction_by_user?.[userId] ?? "";
}

function UserFieldLabel({ profile }: { profile: Profile }) {
	const avatar = profile.avatar_url;
	const isImage = avatar?.startsWith("http://") || avatar?.startsWith("https://");
	const imageSrc = isImage ? avatar : null;

	return (
		<div className="mb-4 flex items-center gap-2">
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
					avatar ?? "🙂"
				)}
			</span>
			<span className="min-w-0 truncate text-sm font-bold text-foreground">
				{profile.display_name}
			</span>
		</div>
	);
}

function getStatusLabel(status: Movie["status"]) {
	return status === "wishlist"
		? "Wishlist"
		: status === "watching"
			? "Watching"
			: "Watched";
}

function getMovieCategories(movie: Movie | null | undefined) {
	if (!movie?.category) return [];
	const category = movie.category as Movie["category"] | string;
	return (Array.isArray(category) ? category : [category]).filter(
		(category): category is string => Boolean(category),
	);
}

export function MovieDialog({
	open,
	movie,
	onClose,
	onSaved,
	profile,
}: MovieDialogProps) {
	const toast = useToast();
	const [pending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);
	const [posterUrl, setPosterUrl] = useState("");
	const [posterPublicId, setPosterPublicId] = useState("");
	const [status, setStatus] = useState<MovieStatus>("wishlist");
	const [rating, setRating] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [reaction, setReaction] = useState("");
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const unsavedPosterPublicIds = useRef<Set<string>>(new Set());

	if (useOpenSync(open, [movie, profile.id])) {
		setPosterUrl(movie?.poster_url ?? "");
		setPosterPublicId(movie?.poster_public_id ?? "");
		setStatus(movie?.status ?? "wishlist");
		setRating(getUserRating(movie, profile.id));
		setSelectedCategories(getMovieCategories(movie));
		setReaction(getUserReaction(movie, profile.id));
		setReactionPickerOpen(false);
	}

	useEffect(() => {
		if (open) unsavedPosterPublicIds.current.clear();
	}, [movie, open]);

	async function cleanupUnsavedPoster(publicId: string) {
		if (!unsavedPosterPublicIds.current.has(publicId)) return;
		unsavedPosterPublicIds.current.delete(publicId);
		await deleteUnsavedCloudinaryImage(publicId).catch(() => null);
	}

	const cleanupUnsavedPosters = () => {
		const publicIds = Array.from(unsavedPosterPublicIds.current);
		unsavedPosterPublicIds.current.clear();
		publicIds.forEach((publicId) => {
			void deleteUnsavedCloudinaryImage(publicId).catch(() => null);
		});
	};

	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		cleanupUnsavedPosters();
		onClose();
	};

	const toggleCategory = (category: string) => {
		setSelectedCategories((current) => {
			if (current.includes(category)) {
				return current.filter((item) => item !== category);
			}
			return [...current, category];
		});
	};

	async function uploadPoster(file: File) {
		setUploading(true);

		try {
			const response = await fetch("/api/cloudinary/upload?kind=movie", {
				method: "POST",
				headers: {
					"content-type": file.type || "image/jpeg",
				},
				body: file,
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? "Upload failed");
			if (posterPublicId) void cleanupUnsavedPoster(posterPublicId);
			unsavedPosterPublicIds.current.add(result.public_id);
			setPosterUrl(result.secure_url);
			setPosterPublicId(result.public_id);
		} catch (error) {
			toast(error instanceof Error ? error.message : "Upload failed", {
				variant: "error",
			});
		} finally {
			setUploading(false);
		}
	}

	return (
		<NativeDialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			title={movie ? "Edit movie" : "Add movie"}
		>
			<form
				action={(formData) => {
					formData.set("poster_url", posterUrl);
					formData.set("poster_public_id", posterPublicId);
					formData.set("status", status);
					formData.set("reaction", status === "wishlist" ? "" : reaction);
					formData.set("rating", status === "wishlist" ? "" : rating);
					formData.delete("category");
					selectedCategories.forEach((category) => {
						formData.append("category", category);
					});
					if (movie) formData.set("id", movie.id);

					startTransition(async () => {
						const result = movie
							? await updateMovie(formData)
							: await createMovie(formData);
						toast(result.message, {
							variant: result.ok ? "success" : "error",
						});
						if (result.ok) {
							unsavedPosterPublicIds.current.clear();
							onSaved?.(result.movie);
							if (!movie) celebrateSave("movie");
							handleClose();
						}
					});
				}}
			>
				<div className="grid gap-4">
					<NativeInput
						required
						name="title"
						label="Title"
						defaultValue={movie?.title ?? ""}
					/>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_20.75rem]">
						<NativeSelect
							required
							name="status"
							label="Status"
							value={status}
							onChange={(event) => {
								const nextStatus = event.target.value as MovieStatus;
								setStatus(nextStatus);
								if (nextStatus === "wishlist") {
									setRating("");
									setReaction("");
									setReactionPickerOpen(false);
								}
							}}
						>
							{movieStatuses.map((status) => (
								<option
									key={status}
									value={status}
								>
									{getStatusLabel(status)}
								</option>
							))}
						</NativeSelect>

						<div className="grid grid-cols-2 gap-3">
							<NativeSelect
								name="rating"
								label="Rating"
								value={rating}
								disabled={status === "wishlist"}
								className={
									status === "wishlist" ? "cursor-not-allowed opacity-50" : ""
								}
								onChange={(event) => setRating(event.target.value)}
							>
								<option value="">No rating</option>
								{ratingOptions.map((option) => (
									<option
										key={option}
										value={option}
									>
										{option}
									</option>
								))}
							</NativeSelect>
							{/* Same label-above layout and field height as the selects beside it. */}
							<div className="grid min-w-0 gap-2">
								<input
									type="hidden"
									name="reaction"
									value={status === "wishlist" ? "" : reaction}
								/>
								<span id="movie-reaction-label" className="text-sm font-semibold text-foreground">
									Reaction
								</span>
								<button
									type="button"
									aria-labelledby="movie-reaction-label"
									aria-expanded={reactionPickerOpen ? "true" : undefined}
									disabled={status === "wishlist"}
									className={`${fieldClass} flex items-center justify-between text-left ${
										status === "wishlist" ? "cursor-not-allowed opacity-50" : "hover:border-foreground/40"
									}`}
									onClick={() => setReactionPickerOpen((open) => !open)}
								>
									<span className={`text-2xl leading-none ${reaction ? "" : "opacity-40 grayscale"}`}>
										{reaction || "🙂"}
									</span>
									<SmilePlus
										size={18}
										className="text-muted-foreground"
										aria-hidden="true"
									/>
								</button>
							</div>
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between gap-3">
							<div className="text-sm font-semibold text-foreground">
								Categories
							</div>
							<button
								type="button"
								className="text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
								disabled={selectedCategories.length === 0}
								onClick={() => setSelectedCategories([])}
							>
								Clear
							</button>
						</div>
						<div className="glass-chip flex flex-wrap gap-1.5 rounded-2xl p-3">
							{movieCategories.map((category) => {
								const selected = selectedCategories.includes(category);
								return (
									<button
										key={category}
										type="button"
										aria-pressed={selected}
										className={`min-h-8 rounded-full border px-3 text-xs font-semibold transition ${
											selected
												? "border-primary bg-primary text-primary-foreground"
												: "border-foreground/10 bg-surface-elevated/70 text-muted-foreground hover:border-foreground/25 hover:text-foreground dark:bg-white/5"
										}`}
										onClick={() => toggleCategory(category)}
									>
										{category}
									</button>
								);
							})}
						</div>
						{selectedCategories.map((category) => (
							<input
								key={category}
								type="hidden"
								name="category"
								value={category}
							/>
						))}
					</div>

					{posterUrl ? (
						<div className="mx-auto relative aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-primary-border bg-primary-subtle">
							<Image
								src={posterUrl}
								alt="Movie poster preview"
								fill
								className="object-cover"
							/>
						</div>
					) : null}

					<div
						className={`grid gap-3 w-full ${posterUrl ? "grid-cols-2" : "grid-cols-1"}`}
					>
						<label
							className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary-border bg-surface px-5 text-sm font-bold text-primary-ink transition hover:border-primary hover:bg-primary-container-hover hover:text-accent-foreground sm:min-h-11 ${
								uploading ? "pointer-events-none opacity-50" : ""
							}`}
						>
							<ImageUp size={17} />
							{uploading
								? "Uploading..."
								: posterUrl
									? "Replace poster"
									: "Upload poster"}
							<input
								aria-label="Upload movie poster"
								hidden
								type="file"
								accept="image/*"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) void uploadPoster(file);
								}}
							/>
						</label>

						{posterUrl ? (
							<div className="flex w-full">
								<NativeButton
									type="button"
									variant="outlined"
									className="w-full !border-transparent !text-danger hover:!bg-danger-bg"
									onClick={() => {
										void cleanupUnsavedPoster(posterPublicId);
										setPosterUrl("");
										setPosterPublicId("");
									}}
								>
									Remove poster
								</NativeButton>
							</div>
						) : null}
					</div>

					<div>
						<UserFieldLabel profile={profile} />
						<NativeTextarea
							rows={4}
							name={`comment:${profile.id}`}
							label="Your comment"
							defaultValue={getUserComment(movie, profile.id)}
						/>
					</div>
				</div>

				<EmojiPickerDialog
					open={reactionPickerOpen}
					title="Choose reaction"
					clearLabel="Clear reaction"
					onClose={() => setReactionPickerOpen(false)}
					onClear={() => setReaction("")}
					onSelect={setReaction}
				/>

				<div className="mt-6 flex justify-end gap-3">
					<NativeButton
						type="button"
						variant="text"
						onClick={handleClose}
					>
						Cancel
					</NativeButton>
					<NativeButton
						type="submit"
						disabled={pending || uploading}
					>
						{pending ? "Saving..." : "Save movie"}
					</NativeButton>
				</div>
			</form>
		</NativeDialog>
	);
}
