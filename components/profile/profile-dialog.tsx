"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { SmilePlus } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import {
	NativeButton,
	NativeDialog,
	NativeInput,
	NativeSelect,
	NativeTabs,
} from "@/components/ui/native-controls";
import { updatePassword, updateProfile } from "@/app/actions";
import {
	getSupportedCurrencyCodes,
	getUtcTimeZoneOptions,
	normalizeTimeZoneValue,
	commonCountryCodes,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { EmojiStyle, type EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

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
	const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
	const countryNames = useMemo(() => {
		return new Intl.DisplayNames(["en"], { type: "region" });
	}, []);
	const currencyOptions = useMemo(() => getSupportedCurrencyCodes(), []);
	const timeZoneOptions = useMemo(() => getUtcTimeZoneOptions(), []);
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
		setAvatarPickerOpen(false);
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
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<NativeSelect
									name="country_code"
									label="Country"
									defaultValue={profile.country_code}
								>
									{commonCountryCodes.map((country) => (
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
									containerClassName="col-span-2 sm:col-span-1"
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
							<div className="grid gap-3">
								<input
									type="hidden"
									name="avatar"
									value={avatar}
								/>
								<button
									type="button"
									aria-label="Choose profile emoji"
									aria-expanded={avatarPickerOpen ? "true" : undefined}
									className="flex min-h-12 items-center justify-between rounded-2xl border border-neutral-400 bg-transparent px-3 text-left text-neutral-900 transition hover:border-neutral-950/40 sm:min-h-11"
									onClick={() => setAvatarPickerOpen((open) => !open)}
								>
									<span className="flex items-center gap-3">
										<span className="grid size-9 place-items-center rounded-xl bg-bg text-2xl">
											{avatar}
										</span>
										<span className="text-sm font-semibold text-neutral-700">
											Profile emoji
										</span>
									</span>
									<SmilePlus
										size={18}
										className="text-neutral-500"
									/>
								</button>

								{avatarPickerOpen ? (
									<div className="overflow-hidden rounded-3xl border border-neutral-900/10 bg-paper p-2 shadow-[0_18px_44px_rgba(23,23,23,0.14)]">
										<EmojiPicker
											width="100%"
											height={420}
											emojiStyle={EmojiStyle.NATIVE}
											previewConfig={{ showPreview: false }}
											onEmojiClick={(emojiData: EmojiClickData) => {
												setAvatar(emojiData.emoji);
												setAvatarPickerOpen(false);
											}}
										/>
									</div>
								) : null}
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
