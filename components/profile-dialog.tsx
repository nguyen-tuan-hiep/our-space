"use client";

import { useEffect, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import { updatePassword, updateProfile } from "@/app/actions";
import { AvatarIcon } from "@/components/avatar-icon";
import {
  avatarEmojis,
  avatarOptions,
  extractEmojiOnly,
  isCustomAvatarEmoji,
  isAvatarKey,
  locationSettings,
  supportedLocations,
} from "@/lib/constants";
import type { LocationCode, Profile } from "@/lib/types";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

export function ProfileDialog({ open, onClose, profile }: ProfileDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [avatar, setAvatar] = useState(
    profile.avatar_url || "heart",
  );
  const [location, setLocation] = useState<LocationCode>(profile.country_code);
  const customAvatarInvalid = !isAvatarKey(avatar) && !isCustomAvatarEmoji(avatar);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setAvatar(profile.avatar_url || "heart");
    setLocation(profile.country_code);
  }, [open, profile.avatar_url, profile.country_code]);

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
              formData.set("location", location);
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
            <TextField
              select
              label="Default location"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value as LocationCode)
              }
            >
              {supportedLocations.map((option) => (
                <MenuItem key={option} value={option}>
                  {locationSettings[option].flag} {locationSettings[option].label}
                </MenuItem>
              ))}
            </TextField>
            <p className="-mt-3 text-xs leading-5 text-neutral-500">
              Time display and default expense currency use this location.
            </p>
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-700">
                Avatar emoji
              </p>
              <TextField
                label="Custom emoji"
                value={isAvatarKey(avatar) ? "" : avatar}
                onChange={(event) => setAvatar(extractEmojiOnly(event.target.value))}
                placeholder="Paste any emoji"
                inputProps={{ maxLength: 12 }}
                error={customAvatarInvalid}
                helperText={
                  customAvatarInvalid
                    ? "Please enter an emoji, not text."
                    : "Paste an emoji you like, or choose one below."
                }
                className="mb-4"
              />
              <div className="grid max-h-72 grid-cols-5 gap-3 overflow-auto pr-1 sm:grid-cols-8">
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
                          : "border-neutral-200 text-ink hover:border-neutral-400"
                      }`}
                    >
                      <AvatarIcon
                        value={option}
                        label={avatarEmojis[option].label}
                        className="grid size-10 place-items-center rounded-full text-2xl"
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
