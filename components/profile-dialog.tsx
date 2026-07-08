"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTabs,
} from "@/components/ui/native-controls";
import { updatePassword, updateProfile } from "@/app/actions";
import {
	avatarOptions,
	extractEmojiOnly,
	getSupportedCurrencyCodes,
	getUtcTimeZoneOptions,
	isCustomAvatarEmoji,
	normalizeTimeZoneValue,
	supportedCountryCodes,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";

interface ProfileDialogProps {
	open: boolean;
	onClose: () => void;
	profile: Profile;
}

export function ProfileDialog({ open, onClose, profile }: ProfileDialogProps) {
	const router = useRouter();
	const toast = useToast();
	const [tab, setTab] = useState<"profile" | "password">("profile");
	const [avatar, setAvatar] = useState(profile.avatar_url || "💖");
	const countryNames = useMemo(() => {
		return new Intl.DisplayNames(["en"], { type: "region" });
	}, []);
	const currencyOptions = useMemo(() => getSupportedCurrencyCodes(), []);
	const timeZoneOptions = useMemo(() => getUtcTimeZoneOptions(), []);
	const customAvatarInvalid =
		avatar.trim().length > 0 && !isCustomAvatarEmoji(avatar);
	const [pending, startTransition] = useTransition();
	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	useEffect(() => {
		if (!open) return;
		setAvatar(profile.avatar_url || "💖");
	}, [open, profile.avatar_url]);

	return (
		<NativeDialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			title="Edit profile"
			actions={
				<>
					<NativeButton type="button" variant="text" onClick={handleClose}>
						Cancel
					</NativeButton>
					<NativeButton
						type="submit"
						form={tab === "profile" ? "profile-form" : "password-form"}
						disabled={pending}
					>
						{pending
							? "Saving..."
							: tab === "profile"
								? "Save profile"
								: "Change password"}
					</NativeButton>
				</>
			}
		>
				<NativeTabs
					value={tab}
					onChange={setTab}
						options={[
							{ value: "profile", label: "Profile" },
							{ value: "password", label: "Password" },
						]}
							className="mb-5 rounded-full border-0 bg-mui/10 p-1 sm:rounded-none sm:border-b sm:border-neutral-200 sm:bg-transparent sm:p-0 [&>button]:relative [&>button]:flex-1 [&>button]:rounded-full [&>button]:border-b-0 [&>button]:px-4 [&>button]:text-center [&>button]:text-neutral-900 [&>button]:hover:text-mui [&>button]:sm:rounded-none [&>button[aria-selected='true']]:bg-paper [&>button[aria-selected='true']]:text-mui [&>button[aria-selected='true']]:shadow-sm [&>button[aria-selected='true']]:sm:bg-transparent [&>button[aria-selected='true']]:sm:shadow-none"
				/>

				{tab === "profile" ? (
					<form
						id="profile-form"
						className="grid gap-4"
						action={(formData) => {
							formData.set("avatar", avatar);
							startTransition(async () => {
								const result = await updateProfile(formData);
								toast(result.message, {
									variant: result.ok ? "success" : "error",
								});
								if (result.ok) {
									router.refresh();
									handleClose();
								}
							});
						}}
					>
						<NativeInput
							required
							name="display_name"
							label="Display name"
							defaultValue={profile.display_name}
						/>
						<div className="grid gap-3 sm:grid-cols-3">
							<NativeSelect
									name="country_code"
									label="Country"
									defaultValue={profile.country_code}
								>
									{supportedCountryCodes.map((country) => (
										<option
											key={country}
											value={country}
										>
											{country} - {countryNames.of(country)}
										</option>
									))}
							</NativeSelect>
							<NativeSelect
									name="currency"
									label="Currency"
									defaultValue={profile.currency}
								>
									{currencyOptions.map((currency) => (
										<option
											key={currency}
											value={currency}
										>
											{currency}
										</option>
									))}
							</NativeSelect>
							<NativeSelect
									name="time_zone"
									label="Time zone"
									defaultValue={normalizeTimeZoneValue(profile.time_zone)}
								>
									{timeZoneOptions.map((timeZone) => (
										<option
											key={timeZone.value}
											value={timeZone.value}
										>
											{timeZone.label}
										</option>
									))}
							</NativeSelect>
						</div>
						<NativeInput
							label="Custom emoji"
							value={avatar}
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
						/>

						<div>
							<div className="grid max-h-72 grid-cols-5 gap-3 overflow-auto pr-1 sm:grid-cols-8">
								{avatarOptions.map((option) => {
									const selected = avatar === option;
									return (
										<button
											key={option}
											type="button"
											aria-label={`Choose ${option} avatar`}
											onClick={() => setAvatar(option)}
											className={`grid aspect-square place-items-center border transition rounded-2xl ${
												selected
													? "border-[color-mix(in_srgb,#000000_48%,transparent)] bg-[color-mix(in_srgb,#000000_12%,transparent)] text-white"
													: "border-bg-[color-mix(in_srgb,#000000_12%,transparent)] bg-paper hover:border-[color-mix(in_srgb,#000000_48%,transparent)]"
											}`}
										>
											<span className="grid size-10 place-items-center text-2xl">
												{option}
											</span>
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
								toast(result.message, {
									variant: result.ok ? "success" : "error",
								});
								if (result.ok) onClose();
							});
						}}
					>
						<NativeInput
							required
							name="password"
							label="New password"
							type="password"
							autoComplete="new-password"
						/>
						<NativeInput
							required
							name="confirm_password"
							label="Confirm password"
							type="password"
							autoComplete="new-password"
						/>
					</form>
				)}
		</NativeDialog>
	);
}
