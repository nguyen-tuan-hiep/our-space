"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NativeButton, NativeInput } from "@/components/ui/native-controls";
import { useToast } from "@/components/toast";
import { pairWithCode } from "@/app/actions";

export function PairingForm() {
	const router = useRouter();
	const toast = useToast();
	const [pending, startTransition] = useTransition();

	return (
		<form
			className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2"
			action={(formData) => {
				startTransition(async () => {
					const result = await pairWithCode(formData);

					toast(result.message, {
						variant: result.ok ? "success" : "error",
					});

					if (result.ok) router.refresh();
				});
			}}
		>
			<NativeInput
				required
				name="pair_code"
				label="Your partner's code"
				placeholder=""
				maxLength={16}
				className="uppercase"
			/>

			<NativeButton
				type="submit"
				disabled={pending}
			>
				{pending ? "Sending..." : "Send request"}
			</NativeButton>
		</form>
	);
}
