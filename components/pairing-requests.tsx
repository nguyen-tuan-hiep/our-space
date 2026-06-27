"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";
import { acceptPairingRequest } from "@/app/actions";
import type { PairingRequest } from "@/lib/types";

interface PairingRequestsProps {
  profileId: string;
  requests: PairingRequest[];
}

export function PairingRequests({ profileId, requests }: PairingRequestsProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();

  if (!requests.length) return null;

  return (
    <div className="grid gap-3">
      {requests.map((request) => {
        const incoming = request.recipient_id === profileId;
        const otherProfile = incoming ? request.requester : request.recipient;
        const label = otherProfile
          ? `${otherProfile.display_name} ${otherProfile.avatar_url ?? "🙂"}`
          : "Your partner";

        return (
          <div
            key={request.id}
            className="grid gap-3 border border-neutral-300 bg-paper p-4 sm:grid-cols-[1fr_auto] sm:items-center mb-5"
          >
            <div>
              <p className="font-semibold">
                {incoming
                  ? `${label} wants to pair with you.`
                  : `Waiting for ${label} to accept.`}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {incoming
                  ? "Accepting will link both profiles."
                  : "They will see this request on their setup screen."}
              </p>
            </div>
            {incoming ? (
              <form
                action={(formData) => {
                  startTransition(async () => {
                    const result = await acceptPairingRequest(formData);
                    enqueueSnackbar(result.message, {
                      variant: result.ok ? "success" : "error",
                    });
                    if (result.ok) router.refresh();
                  });
                }}
              >
                <input type="hidden" name="request_id" value={request.id} />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={pending}
                  className="min-h-11 px-5 text-white hover:bg-neutral-700"
                >
                  {pending ? "Accepting..." : "Accept"}
                </Button>
              </form>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
