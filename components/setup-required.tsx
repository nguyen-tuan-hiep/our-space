import Card from "@mui/material/Card";
import type { User } from "@supabase/supabase-js";
import { CreateProfileForm } from "@/components/create-profile-form";
import { PairingForm } from "@/components/pairing-form";
import { PairingRequests } from "@/components/pairing-requests";
import { SetupRealtimeRefresh } from "@/components/setup-realtime-refresh";
import type { PairingRequest, Profile } from "@/lib/types";

interface SetupRequiredProps {
  user: User;
  profile: Profile | null;
  pairingRequests?: PairingRequest[];
  details?: string[];
}

export function SetupRequired({
  user,
  profile,
  pairingRequests = [],
  details = [],
}: SetupRequiredProps) {
  return (
    <main className="min-h-svh bg-bg">
      <section className="container-page grid min-h-svh items-center py-12">
        <Card className="mx-auto w-full max-w-3xl border border-neutral-200 bg-paper p-6 sm:p-8">
          {profile ? <SetupRealtimeRefresh profileId={profile.id} /> : null}
          <p className="eyebrow">Setup required</p>
          <h1 className="mt-3 font-serif text-5xl leading-none">
            Pair with your partner
          </h1>
          <p className="mt-5 leading-7 text-neutral-600">
            Share your pairing code with your partner. Only one person needs to
            enter the code; the other person can accept the request here.
          </p>

          <div className="grid gap-3 bg-paper p-4 text-sm">
            {/* <p>
              <span className="font-semibold">Current user id:</span>{" "}
              <code>{user.id}</code>
            </p>
            <p>
              <span className="font-semibold">Current email:</span>{" "}
              <code>{user.email ?? "No email"}</code>
            </p>
            <p>
              <span className="font-semibold">Profile row:</span>{" "}
              {profile
                ? "found, waiting for partner pairing"
                : "missing"}
            </p> */}
            {profile?.pair_code ? (
              <p className="text-center">
                <span className="font-semibold text-xl">Your pairing code: {profile.pair_code}</span>{" "}
                {/* <code></code> */}
              </p>
            ) : null}
            {profile?.partner_id ? (
              <p>
                <span className="font-semibold text-lg">Partner id:</span>{" "}
                <code>{profile.partner_id}</code>
              </p>
            ) : null}
          </div>

          {profile ? (
            <>
              <PairingRequests
                profileId={profile.id}
                requests={pairingRequests}
              />
              <PairingForm />
            </>
          ) : (
            <CreateProfileForm user={user} />
          )}

          {/* {details.length ? (
            <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Diagnostics</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          ) : null} */}

          {!profile ? (
            <p className="mt-6 text-sm leading-6 text-neutral-600">
              Create your profile first. After that, your pairing code and the
              partner code field will appear.
            </p>
          ) : null}
        </Card>
      </section>
    </main>
  );
}
