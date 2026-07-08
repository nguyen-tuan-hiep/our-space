"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImageUp } from "lucide-react";
import { useToast } from "@/components/toast";
import { NativeButton, NativeDialog } from "@/components/ui/native-controls";
import { updateHeroImage } from "@/app/actions";

interface HeroImageDialogProps {
	open: boolean;
	onClose: () => void;
	currentUrl: string;
}

export function HeroImageDialog({
	open,
	onClose,
	currentUrl,
}: HeroImageDialogProps) {
	const toast = useToast();
	const [pending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);
	const [heroUrl, setHeroUrl] = useState(currentUrl);
	const [publicId, setPublicId] = useState("");
	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	async function uploadHero(file: File) {
		setUploading(true);

		try {
			const response = await fetch("/api/cloudinary/upload", {
				method: "POST",
				headers: {
					"content-type": file.type || "image/jpeg",
				},
				body: file,
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? "Upload failed");
			setHeroUrl(result.secure_url);
			setPublicId(result.public_id);
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
			title="Edit hero image"
			actions={
				<form
					action={(formData) => {
						formData.set("hero_image_url", heroUrl);
						formData.set("hero_image_public_id", publicId);
						startTransition(async () => {
							const result = await updateHeroImage(formData);
							toast(result.message, {
								variant: result.ok ? "success" : "error",
							});
							if (result.ok) handleClose();
						});
					}}
        >

          {/* Cancel and Save button */}
          <div className="flex justify-end gap-3">
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
							{pending ? "Saving..." : "Save image"}
						</NativeButton>
            </div>
				</form>
			}
		>
			<div className="grid gap-5">
				<div className="relative aspect-[16/9] overflow-hidden border border-neutral-200 bg-neutral-100">
					<Image
						src={heroUrl}
						alt="Current hero"
						fill
						className="object-cover"
					/>
				</div>
				<label
					className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-mui px-5 text-sm font-bold text-mui transition hover:bg-mui/10 sm:min-h-11 ${
						uploading ? "pointer-events-none opacity-50" : ""
					}`}
				>
					<ImageUp size={17} />
					{uploading ? "Uploading..." : "Upload new hero image"}
					<input
						aria-label="Upload hero image file"
						hidden
						type="file"
						accept="image/*"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) void uploadHero(file);
						}}
					/>
				</label>
			</div>
		</NativeDialog>
	);
}
