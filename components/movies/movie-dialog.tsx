"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { ImageUp, SmilePlus, X } from "lucide-react";
import { createMovie, updateMovie } from "@/app/actions";
import { useToast } from "@/components/feedback/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTextarea,
} from "@/components/ui/native-controls";
import { movieCategories, movieStatuses } from "@/lib/constants";
import type { Movie } from "@/lib/types";
import { EmojiStyle, type EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

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
	const [reaction, setReaction] = useState("");
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		setPosterUrl(movie?.poster_url ?? "");
		setReaction(movie?.reaction ?? "");
		setReactionPickerOpen(false);
	}, [movie, open]);

	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
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
			maxWidth="md"
			title={movie ? "Edit movie" : "Add movie"}
		>
			<form
				action={(formData) => {
					formData.set("poster_url", posterUrl);
					formData.set("reaction", reaction);
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

					<div className="grid grid-cols-2 gap-3">
						<NativeSelect
							required
							name="status"
							label="Status"
							defaultValue={movie?.status ?? "wishlist"}
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

						<NativeSelect
							required
							name="category"
							label="Category"
							defaultValue={movie?.category ?? movieCategories[0]}
						>
							{movieCategories.map((category) => (
								<option
									key={category}
									value={category}
								>
									{category}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-[10rem_10rem]">
						<NativeInput
							type="number"
							name="rating"
							label="Rating"
							min="1"
							max="10"
							step="0.5"
							defaultValue={movie?.rating ?? ""}
						/>
						<div className="relative">
							<input
								type="hidden"
								name="reaction"
								value={reaction}
							/>
							<div className="relative">
								<button
									type="button"
									aria-label="Choose reaction emoji"
									aria-expanded={reactionPickerOpen ? "true" : undefined}
									className="peer flex h-12 w-full items-center justify-between rounded-2xl border border-neutral-400 bg-transparent px-3 text-left text-sm text-neutral-900 outline-none transition-all duration-200 sm:h-11"
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

							{reactionPickerOpen ? (
								<div className="absolute right-0 top-[calc(100%+0.5rem)] z-[65] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-neutral-900/10 bg-paper p-2 shadow-[0_24px_70px_rgba(30,25,20,0.22)]">
									<EmojiPicker
										width="100%"
										height={420}
										emojiStyle={EmojiStyle.NATIVE}
										previewConfig={{ showPreview: false }}
										onEmojiClick={(emojiData: EmojiClickData) => {
											setReaction(emojiData.emoji);
											setReactionPickerOpen(false);
										}}
									/>
									<button
										type="button"
										className="mt-2 inline-flex h-9 items-center gap-2 rounded-2xl px-3 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
										onClick={() => {
											setReaction("");
											setReactionPickerOpen(false);
										}}
									>
										<X size={15} />
										Clear
									</button>
								</div>
							) : null}
						</div>
					</div>

					<NativeInput
						type="url"
						label="Poster URL"
						value={posterUrl}
						onChange={(event) => setPosterUrl(event.target.value)}
					/>

					{posterUrl ? (
						<div className="relative aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
							<Image
								src={posterUrl}
								alt="Movie poster preview"
								fill
								className="object-cover"
							/>
						</div>
					) : null}

					<div className="grid gap-3 sm:flex sm:items-center">
						<label
							className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-mui px-5 text-sm font-bold text-mui transition hover:bg-mui/10 sm:min-h-11 ${
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
							<NativeButton
								type="button"
								variant="text"
								onClick={() => setPosterUrl("")}
							>
								Remove poster
							</NativeButton>
						) : null}
					</div>

					<NativeTextarea
						rows={5}
						name="comment"
						label="Comment"
						defaultValue={movie?.comment ?? ""}
					/>
				</div>

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
