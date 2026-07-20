"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SmilePlus } from "lucide-react";
import { EmojiPickerDialog } from "@/components/common/emoji-picker-dialog";
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
			maxWidth="xs"
			title="Edit profile"
		>
			<div className="grid gap-5">
				<NativeTabs
					value={tab}
					onChange={setTab}
					options={[
						{ value: "profile", label: "Profile" },
						{ value: "password", label: "Password" },
					]}
					className="[&>button]:relative [&>button]:flex-1 [&>button]:px-4 [&>button]:text-center"
				/>

				{tab === "profile" ? (
					<form
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
										<span className="grid size-9 place-items-center rounded-xl bg-background text-2xl">
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
							</div>

							<div className="mt-2 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
								<NativeButton
									type="button"
									variant="text"
									className="w-full sm:w-auto"
									onClick={handleClose}
								>
									Cancel
								</NativeButton>
								<NativeButton
									type="submit"
									className="w-full sm:w-auto"
									disabled={pending}
								>
									{pending ? "Saving..." : "Save profile"}
								</NativeButton>
							</div>
						</form>
					) : (
					<form
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
						<div className="mt-2 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
							<NativeButton
								type="button"
								variant="text"
								className="w-full sm:w-auto"
								onClick={handleClose}
							>
								Cancel
							</NativeButton>
							<NativeButton
								type="submit"
								className="w-full sm:w-auto"
								disabled={pending}
							>
								{pending ? "Saving..." : "Change password"}
							</NativeButton>
						</div>
					</form>
				)}
			</div>
			<EmojiPickerDialog
				open={avatarPickerOpen}
				title="Choose profile emoji"
				onClose={() => setAvatarPickerOpen(false)}
				onSelect={setAvatar}
			/>
		</NativeDialog>
	);
}
