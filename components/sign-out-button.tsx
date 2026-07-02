"use client";

import { useTransition } from "react";
import { NativeButton } from "@/components/ui/native-controls";
import { signOut } from "@/app/actions";
import { logoutOneSignal } from "@/lib/onesignal-web";

interface SignOutButtonProps {
	className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
	const [pending, startTransition] = useTransition();

	const handleSignOut = () => {
		startTransition(async () => {
			try {
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
			disabled={pending}
			onClick={handleSignOut}
			className={className}
		>
			Logout
		</NativeButton>
	);
}
