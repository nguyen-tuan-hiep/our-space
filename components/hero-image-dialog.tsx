"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { ImageUp } from "lucide-react";
import { useSnackbar } from "notistack";
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
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [heroUrl, setHeroUrl] = useState(currentUrl);
  const [publicId, setPublicId] = useState("");

  async function uploadHero(file: File) {
    const body = new FormData();
    body.append("file", file);
    setUploading(true);

    try {
      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      setHeroUrl(result.secure_url);
      setPublicId(result.public_id);
      enqueueSnackbar("Hero image uploaded successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : "Upload failed", {
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle className="font-serif text-3xl">Edit hero image</DialogTitle>
      <form
        action={(formData) => {
          formData.set("hero_image_url", heroUrl);
          formData.set("hero_image_public_id", publicId);
          startTransition(async () => {
            const result = await updateHeroImage(formData);
            enqueueSnackbar(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) onClose();
          });
        }}
      >
        <DialogContent className="grid gap-5 pt-3">
          <div className="relative aspect-[16/9] overflow-hidden border border-neutral-200 bg-neutral-100">
            <Image
              src={heroUrl}
              alt="Current hero"
              fill
              className="object-cover"
            />
          </div>
          <Button
            component="label"
            variant="outlined"
            startIcon={<ImageUp size={17} />}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload new hero image"}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadHero(file);
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending || uploading}>
            {pending ? "Saving..." : "Save hero"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
