"use client";

import { useTransition } from "react";
import { NativeButton } from "@/components/ui/native-controls";
import { signOut } from "@/app/actions";

interface SignOutButtonProps {
	className?: string;
}

function clearSpaceCaches() {
	try {
		for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
			const key = window.localStorage.key(index);
			if (
				key?.startsWith("our-space:home:") ||
				key?.startsWith("our-space:dashboard:")
			) {
				window.localStorage.removeItem(key);
			}
		}
	} catch {
		// Best-effort cleanup only; auth sign-out still happens server-side.
	}
}

export function SignOutButton({ className }: SignOutButtonProps) {
	const [pending, startTransition] = useTransition();

	const handleSignOut = () => {
		startTransition(async () => {
			clearSpaceCaches();

			try {
				const { logoutOneSignal } = await import("@/lib/onesignal-web");
				await logoutOneSignal();
			} catch (error) {
				console.warn("OneSignal logout failed", error);
			}

			await signOut();
		});
	};

	return (
		<NativeButton
			type="button"
			variant="outlined"
			disabled={pending}
			onClick={handleSignOut}
			className={[
				"!border-transparent !text-danger hover:!bg-danger-bg",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			Logout
		</NativeButton>
	);
}
