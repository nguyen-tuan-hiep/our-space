"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { ImageUp, SmilePlus } from "lucide-react";
import { createMovie, updateMovie } from "@/app/actions";
import { EmojiPickerDialog } from "@/components/common/emoji-picker-dialog";
import { useToast } from "@/components/feedback/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTextarea,
} from "@/components/ui/native-controls";
import { movieCategories, movieStatuses } from "@/lib/constants";
import type { Movie, MovieStatus } from "@/lib/types";

const ratingOptions = Array.from({ length: 19 }, (_, index) =>
	String(1 + index * 0.5),
);

interface MovieDialogProps {
	open: boolean;
	movie?: Movie | null;
	onClose: () => void;
	onSaved?: (movie: Movie) => void;
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
}: MovieDialogProps) {
	const toast = useToast();
	const [pending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);
	const [posterUrl, setPosterUrl] = useState("");
	const [status, setStatus] = useState<MovieStatus>("wishlist");
	const [rating, setRating] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [reaction, setReaction] = useState("");
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		setPosterUrl(movie?.poster_url ?? "");
		setStatus(movie?.status ?? "wishlist");
		setRating(movie?.rating ? String(movie.rating) : "");
		setSelectedCategories(getMovieCategories(movie));
		setReaction(movie?.reaction ?? "");
		setReactionPickerOpen(false);
	}, [movie, open]);

	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
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
			setPosterUrl(result.secure_url);
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
							onSaved?.(result.movie);
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
							<div className="relative">
								<input
									type="hidden"
									name="reaction"
									value={status === "wishlist" ? "" : reaction}
								/>
								<div className="relative">
									<button
										type="button"
										aria-label="Choose reaction emoji"
										aria-expanded={reactionPickerOpen ? "true" : undefined}
										disabled={status === "wishlist"}
										className={`peer flex h-12 w-full items-center justify-between rounded-2xl border border-neutral-400 bg-transparent px-3 text-left text-sm text-neutral-900 outline-none transition-all duration-200 sm:h-11 ${
											status === "wishlist"
												? "cursor-not-allowed opacity-50"
												: ""
										}`}
										onClick={() => setReactionPickerOpen((open) => !open)}
									>
										<span className="text-2xl leading-none">
											{reaction || "🙂"}
										</span>
										<SmilePlus
											size={17}
											className="text-neutral-500"
										/>
									</button>
									<label className="pointer-events-none absolute left-3 top-3 origin-[top_left] -translate-y-5 scale-75 bg-paper px-1 text-sm text-neutral-500 transition-all duration-200">
										Reaction
									</label>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-neutral-400 px-3 py-3">
						<div className="mb-2 flex items-center justify-between gap-3">
							<div className="text-xs font-semibold text-neutral-500">
								Categories
							</div>
							<button
								type="button"
								className="text-[11px] font-semibold text-neutral-500 transition hover:text-neutral-950 disabled:pointer-events-none disabled:text-neutral-300"
								disabled={selectedCategories.length === 0}
								onClick={() => setSelectedCategories([])}
							>
								Clear
							</button>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{movieCategories.map((category) => {
								const selected = selectedCategories.includes(category);
								return (
									<button
										key={category}
										type="button"
										aria-pressed={selected}
										className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
											selected
												? "border-neutral-950 bg-neutral-950 text-white"
												: "border-neutral-300 bg-transparent text-neutral-600 hover:border-neutral-500"
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

					<NativeInput
						type="url"
						label="Poster URL"
						value={posterUrl}
						onChange={(event) => setPosterUrl(event.target.value)}
					/>

					{posterUrl ? (
						/* Thêm class 'mx-auto' vào dòng dưới đây để căn giữa */
						<div className="mx-auto relative aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
							<Image
								src={posterUrl}
								alt="Movie poster preview"
								fill
								className="object-cover"
							/>
						</div>
					) : null}

					{/* Sử dụng dynamic class để:
    - Nếu có poster (2 nút): chia 2 cột (grid-cols-2)
    - Nếu chưa có poster (1 nút): chiếm full 1 cột (grid-cols-1)
*/}
					<div
						className={`grid gap-3 w-full ${posterUrl ? "grid-cols-2" : "grid-cols-1"}`}
					>
						<label
							// Thay 'inline-flex' bằng 'flex w-full' để label giãn hết 100% cột grid
							className={`flex w-full min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-mui px-5 text-sm font-bold text-mui transition hover:bg-mui/10 sm:min-h-11 ${
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
									variant="text"
									className="w-full"
									onClick={() => setPosterUrl("")}
								>
									Remove poster
								</NativeButton>
							</div>
						) : null}
					</div>

					<NativeTextarea
						rows={5}
						name="comment"
						label="Comment"
						defaultValue={movie?.comment ?? ""}
					/>
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
