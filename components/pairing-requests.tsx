"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NativeButton } from "@/components/ui/native-controls";
import { useToast } from "@/components/toast";
import { acceptPairingRequest } from "@/app/actions";
import type { PairingRequest } from "@/lib/types";

interface PairingRequestsProps {
	profileId: string;
	requests: PairingRequest[];
	onRequestResolved?: (requestId: string) => void;
}

export function PairingRequests({
	profileId,
	requests,
	onRequestResolved,
}: PairingRequestsProps) {
	const router = useRouter();
	const toast = useToast();
	const [pending, startTransition] = useTransition();

	if (!requests.length) return null;

	return (
		<div className="grid gap-2">
			{requests.map((request) => {
				const incoming = request.recipient_id === profileId;
				const otherProfile = incoming ? request.requester : request.recipient;
				const label = otherProfile
					? `${otherProfile.display_name} ${otherProfile.avatar_url ?? "🙂"}`
					: "Your partner";

				return (
					<div
						key={request.id}
						className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
					>
						<div className="min-w-0">
							<p className="font-semibold leading-6 text-neutral-900">
								{incoming
									? `${label} wants to pair with you.`
									: `Waiting for ${label} to accept.`}
							</p>

							<p className="mt-1 text-sm leading-6 text-neutral-500">
								{incoming
									? "Accepting will link both profiles."
									: "They will see this request on their setup screen."}
							</p>
						</div>

						{incoming ? (
							<form
								className="w-full sm:w-auto"
								action={(formData) => {
									startTransition(async () => {
										const result = await acceptPairingRequest(formData);

										toast(result.message, {
											variant: result.ok ? "success" : "error",
										});

										if (result.ok) router.refresh();
										if (result.ok) onRequestResolved?.(request.id);
									});
								}}
							>
								<input
									type="hidden"
									name="request_id"
									value={request.id}
								/>

								<NativeButton
									type="submit"
									disabled={pending}
									className="min-h-12 w-full sm:min-h-11 sm:w-36"
								>
									{pending ? "Accepting..." : "Accept"}
								</NativeButton>
							</form>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
