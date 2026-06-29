"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
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
		<Button
			type="button"
			variant="contained"
			disabled={pending}
			onClick={handleSignOut}
			className={className}
		>
			Logout
		</Button>
	);
}
