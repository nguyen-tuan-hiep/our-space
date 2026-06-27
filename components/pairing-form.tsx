"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import { pairWithCode } from "@/app/actions";

export function PairingForm() {
	const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
	const [pending, startTransition] = useTransition();

	return (
		<form
			className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-3"
			action={(formData) => {
				startTransition(async () => {
					const result = await pairWithCode(formData);

					enqueueSnackbar(result.message, {
						variant: result.ok ? "success" : "error",
					});

					if (result.ok) router.refresh();
				});
			}}
		>
			<TextField
				required
				fullWidth
				name="pair_code"
				label="Partner pairing code"
				placeholder="AB12CD34"
				slotProps={{
					htmlInput: {
						maxLength: 16,
						style: { textTransform: "uppercase" },
					},
				}}
			/>

			<Button
				type="submit"
				variant="contained"
				disabled={pending}
				className="min-h-14 whitespace-nowrap px-4 text-white hover:bg-neutral-700 sm:px-6"
			>
				{pending ? "Sending..." : "Send request"}
			</Button>
		</form>
	);
}