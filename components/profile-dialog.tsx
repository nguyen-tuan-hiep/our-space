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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
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
	const [avatar, setAvatar] = useState(profile.avatar_url || "heart");
	const [location, setLocation] = useState<LocationCode>(profile.country_code);
	const customAvatarInvalid =
		avatar.trim().length > 0 &&
		!isAvatarKey(avatar) &&
		!isCustomAvatarEmoji(avatar);
	const [pending, startTransition] = useTransition();
	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	useEffect(() => {
		if (!open) return;
		setAvatar(profile.avatar_url || "heart");
		setLocation(profile.country_code);
	}, [open, profile.avatar_url, profile.country_code]);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle sx={{ p: 3, pb: 0 }}>
				<span className="font-serif text-3xl">Edit profile</span>
			</DialogTitle>
			<DialogContent sx={{ px: 3, py: 0 }}>
				<Tabs
					value={tab}
					onChange={(_, value) => setTab(value)}
					className="mb-5 border-b border-neutral-200"
				>
					<Tab
						value="profile"
						label="Profile"
					/>
					<Tab
						value="password"
						label="Password"
					/>
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
								if (result.ok) handleClose();
							});
						}}
					>
						<FormControl fullWidth>
							<InputLabel id="default-location-label">
								Default location
							</InputLabel>

							<Select
								labelId="default-location-label"
								id="default-location"
								name="country_code"
								value={location}
								label="Default location"
								onChange={(event) =>
									setLocation(event.target.value as LocationCode)
								}
							>
								{supportedLocations.map((option) => (
									<MenuItem
										key={option}
										value={option}
									>
										{locationSettings[option].flag}{" "}
										{locationSettings[option].label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<p className="-mt-3 text-xs leading-5 text-neutral-500">
							Default time zone and currency by location.
						</p>

						<TextField
							required
							name="display_name"
							label="Display name"
							defaultValue={profile.display_name}
						/>
						<TextField
							label="Custom emoji"
							value={isAvatarKey(avatar) ? "" : avatar}
							onChange={(event) =>
								setAvatar(extractEmojiOnly(event.target.value))
							}
							placeholder="Paste emoji"
							error={customAvatarInvalid}
							helperText={
								customAvatarInvalid
									? "Please enter one emoji only."
									: "Paste an emoji, or choose one below."
							}
							className="mb-4"
						/>

						<div>
							{/* <p className="mb-3 text-sm font-semibold text-neutral-700">
								Avatar emoji
							</p> */}

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
													? "border-[color-mix(in_srgb,#000000_48%,transparent)] bg-[color-mix(in_srgb,#000000_12%,transparent)] text-white"
													: "border-bg-[color-mix(in_srgb,#000000_12%,transparent)] bg-paper hover:border-[color-mix(in_srgb,#000000_48%,transparent)]"
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
						className="grid gap-4"
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
			<DialogActions sx={{ p: 0, px: 3, py: 3 }}>
				<Button onClick={handleClose}>Cancel</Button>
				<Button
					type="submit"
					form={tab === "profile" ? "profile-form" : "password-form"}
					variant="contained"
					disabled={pending}
				>
					{pending
						? "Saving..."
						: tab === "profile"
							? "Save profile"
							: "Change password"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
