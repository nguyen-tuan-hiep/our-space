"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { ImageUp, LocateFixed } from "lucide-react";
import { createMemory, updateMemory } from "@/app/actions";
import { useToast } from "@/components/feedback/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTextarea,
} from "@/components/ui/native-controls";
import { memoryTypeOptions } from "@/lib/memory-map";
import type { MemoryMapEntry } from "@/lib/types";

interface MemoryMapDialogProps {
	open: boolean;
	memory?: MemoryMapEntry | null;
	onClose: () => void;
	onSaved?: (memory: MemoryMapEntry) => void;
}

function getGeolocationUnavailableMessage() {
  if (!("geolocation" in navigator)) {
    return "Current location is not available in this browser.";
  }

  if (!window.isSecureContext) {
    return "Current location only works on HTTPS or localhost.";
  }

  return null;
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (
    error.code === error.PERMISSION_DENIED ||
    error.message.toLowerCase().includes("permission")
  ) {
    return "Location permission is blocked for this site. Please allow Location in browser site settings.";
  }

  return error.message || "Could not get your current location.";
}

export function MemoryMapDialog({
	open,
	memory,
	onClose,
	onSaved,
}: MemoryMapDialogProps) {
	const toast = useToast();
	const [pending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);
	const [locating, setLocating] = useState(false);
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [photoUrl, setPhotoUrl] = useState("");
	const [photoPublicId, setPhotoPublicId] = useState("");

	useEffect(() => {
		if (!open) return;
		setLatitude(memory ? String(memory.latitude) : "");
		setLongitude(memory ? String(memory.longitude) : "");
		setPhotoUrl(memory?.photo_url ?? "");
		setPhotoPublicId(memory?.photo_public_id ?? "");
	}, [memory, open]);

	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	async function uploadMemoryPhoto(file: File) {
		setUploading(true);

		try {
			const response = await fetch("/api/cloudinary/upload?kind=memory", {
				method: "POST",
				headers: {
					"content-type": file.type || "image/jpeg",
				},
				body: file,
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? "Upload failed");
			setPhotoUrl(result.secure_url);
			setPhotoPublicId(result.public_id);
		} catch (error) {
			toast(error instanceof Error ? error.message : "Upload failed", {
				variant: "error",
			});
		} finally {
			setUploading(false);
		}
	}

	const useCurrentLocation = () => {
		const unavailableMessage = getGeolocationUnavailableMessage();
		if (unavailableMessage) {
			toast(unavailableMessage, {
				variant: "error",
			});
			return;
		}

		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(String(position.coords.latitude));
				setLongitude(String(position.coords.longitude));
				setLocating(false);
				toast("Current location added.", { variant: "success" });
			},
			(error) => {
				setLocating(false);
				toast(getGeolocationErrorMessage(error), {
					variant: "error",
				});
			},
			{
				enableHighAccuracy: true,
				maximumAge: 30000,
				timeout: 10000,
			},
		);
	};

	return (
		<NativeDialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			title={memory ? "Edit memory" : "Add memory to map"}
		>
			<form
				action={(formData) => {
					formData.set("latitude", latitude);
          formData.set("longitude", longitude);
					if (!latitude || !longitude) {
						toast("Please use current location before saving.", {
							variant: "error",
						});
						return;
					}
					formData.set("photo_url", photoUrl);
					formData.set("photo_public_id", photoPublicId);
					if (memory) formData.set("id", memory.id);

					startTransition(async () => {
						const result = memory
							? await updateMemory(formData)
							: await createMemory(formData);
						toast(result.message, {
							variant: result.ok ? "success" : "error",
						});
						if (result.ok) {
							onSaved?.(result.memory);
							handleClose();
						}
					});
				}}
			>
				<div className="grid gap-4">
					<div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
						<NativeInput
							required
							name="title"
							label="Memory title"
							defaultValue={memory?.title ?? ""}
						/>
						<NativeSelect
							required
							name="memory_type"
							label="Type"
							defaultValue={memory?.memory_type ?? "date"}
						>
							{memoryTypeOptions.map((option) => (
								<option
									key={option.value}
									value={option.value}
								>
									{option.emoji} {option.label}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
						<div className="rounded-2xl border border-neutral-200 bg-mui/10 px-4 py-3 text-sm font-semibold text-neutral-700">
							{latitude && longitude
								? "Current location added."
								: "Use your current location to place this memory on the map."}
						</div>
						<NativeButton
							type="button"
							variant="outlined"
							className="sm:mt-0"
							disabled={locating}
							onClick={useCurrentLocation}
						>
							<LocateFixed size={17} />
							{locating ? "Locating..." : "Current"}
						</NativeButton>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<NativeInput
							required
							type="date"
							name="visited_at"
							label="Memory date"
							defaultValue={
								memory?.visited_at.slice(0, 10) ?? getTodayDateInputValue()
							}
						/>
					</div>

					<NativeTextarea
						rows={5}
						name="description"
						label="Description"
						defaultValue={memory?.description ?? ""}
					/>

					{photoUrl ? (
						<div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
							<Image
								src={photoUrl}
								alt="Memory upload preview"
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
								: photoUrl
									? "Replace image"
									: "Upload 1 image"}
							<input
								aria-label="Upload memory image"
								hidden
								type="file"
								accept="image/*"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) void uploadMemoryPhoto(file);
								}}
							/>
						</label>
						{photoUrl ? (
							<NativeButton
								type="button"
								variant="text"
								onClick={() => {
									setPhotoUrl("");
									setPhotoPublicId("");
								}}
							>
								Remove image
							</NativeButton>
						) : null}
					</div>
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
						{pending ? "Saving..." : "Save memory"}
					</NativeButton>
				</div>
			</form>
		</NativeDialog>
	);
}
