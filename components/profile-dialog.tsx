"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import { updatePassword, updateProfile } from "@/app/actions";
import { AvatarIcon } from "@/components/avatar-icon";
import { avatarOptions, isAvatarKey } from "@/lib/constants";
import type { Profile } from "@/lib/types";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

export function ProfileDialog({ open, onClose, profile }: ProfileDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [avatar, setAvatar] = useState(
    profile.avatar_url && isAvatarKey(profile.avatar_url)
      ? profile.avatar_url
      : "heart",
  );
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="font-serif text-3xl">Edit profile</DialogTitle>
      <DialogContent className="pt-0">
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          className="mb-5 border-b border-neutral-200"
        >
          <Tab value="profile" label="Profile" />
          <Tab value="password" label="Password" />
        </Tabs>

        {tab === "profile" ? (
          <form
            id="profile-form"
            className="grid gap-5"
            action={(formData) => {
              formData.set("avatar", avatar);
              startTransition(async () => {
                const result = await updateProfile(formData);
                enqueueSnackbar(result.message, {
                  variant: result.ok ? "success" : "error",
                });
                if (result.ok) onClose();
              });
            }}
          >
            <TextField
              required
              name="display_name"
              label="Display name"
              defaultValue={profile.display_name}
            />
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-700">
                Avatar icon
              </p>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {avatarOptions.map((option) => {
                  const selected = avatar === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-label={`Choose ${option} avatar`}
                      onClick={() => setAvatar(option)}
                      className={`grid aspect-square place-items-center border transition ${
                        selected
                          ? "border-ink bg-ink text-white"
                          : "border-neutral-200 bg-[#f7f7f5] text-ink hover:border-neutral-400"
                      }`}
                    >
                      <AvatarIcon
                        value={option}
                        label={option}
                        className="grid size-10 place-items-center rounded-full"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        ) : (
          <form
            id="password-form"
            className="grid gap-5"
            action={(formData) => {
              startTransition(async () => {
                const result = await updatePassword(formData);
                enqueueSnackbar(result.message, {
                  variant: result.ok ? "success" : "error",
                });
                if (result.ok) onClose();
              });
            }}
          >
            <TextField
              required
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
            />
            <TextField
              required
              name="confirm_password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
            />
          </form>
        )}
      </DialogContent>
      <DialogActions className="px-6 pb-6">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          form={tab === "profile" ? "profile-form" : "password-form"}
          variant="contained"
          disabled={pending}
        >
          {pending ? "Saving..." : tab === "profile" ? "Save profile" : "Change password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
