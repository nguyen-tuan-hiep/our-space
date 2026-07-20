"use client";

import { useCallback, useEffect, useState } from "react";
import { PairingForm } from "@/components/pairing/pairing-form";
import { PairingRequests } from "@/components/pairing/pairing-requests";
import { createClient } from "@/lib/supabase/browser";
import type { PairingRequest } from "@/lib/types";

interface SetupPairingPanelProps {
	initialRequests: PairingRequest[];
	profileId: string;
}

function isRelatedRequest(
	request: Partial<PairingRequest> | null | undefined,
	profileId: string,
) {
	return request?.requester_id === profileId || request?.recipient_id === profileId;
}

export function SetupPairingPanel({
	initialRequests,
	profileId,
}: SetupPairingPanelProps) {
	const [requests, setRequests] = useState(initialRequests);

	const refreshRequests = useCallback(async () => {
		const supabase = createClient();
		const { data } = await supabase
			.from("pairing_requests")
			.select(
				"*, requester:profiles!pairing_requests_requester_id_fkey(id, display_name, avatar_url, pair_code), recipient:profiles!pairing_requests_recipient_id_fkey(id, display_name, avatar_url, pair_code)",
			)
			.or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`)
			.eq("status", "pending")
			.order("created_at", { ascending: false })
			.returns<PairingRequest[]>();

		setRequests(data ?? []);
	}, [profileId]);

	useEffect(() => {
		setRequests(initialRequests);
	}, [initialRequests]);

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel(`pairing-requests-${profileId}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "pairing_requests" },
				(payload) => {
					const record = payload.new as Partial<PairingRequest> | null;
					const oldRecord = payload.old as Partial<PairingRequest> | null;
					if (
						!isRelatedRequest(record, profileId) &&
						!isRelatedRequest(oldRecord, profileId)
					) {
						return;
					}

					if (record?.status === "pending" && record.id) {
						setRequests((current) => {
							if (current.some((request) => request.id === record.id)) {
								return current;
							}
							return [record as PairingRequest, ...current];
						});
					} else if (record?.id || oldRecord?.id) {
						const requestId = record?.id ?? oldRecord?.id;
						setRequests((current) =>
							current.filter((request) => request.id !== requestId),
						);
					}

					void refreshRequests();
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [profileId, refreshRequests]);

	return (
		<div className="mt-4 space-y-4">
			{requests.length ? (
				<div className="rounded-2xl border border-neutral-400 bg-secondaryLight dark:bg-secondaryDark p-4 sm:p-5">
					<PairingRequests
						profileId={profileId}
						requests={requests}
						onRequestResolved={(requestId) =>
							setRequests((current) =>
								current.filter((request) => request.id !== requestId),
							)
						}
					/>
				</div>
			) : null}

			<div className="rounded-2xl border border-neutral-400 bg-secondaryLight dark:bg-secondaryDark p-4 sm:p-5">
				<p className="mb-4 text-sm font-medium text-neutral-700">
					Enter your partner&apos;s pairing code
				</p>

				<PairingForm />
			</div>
		</div>
	);
}
