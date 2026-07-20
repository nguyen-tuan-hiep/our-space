import type { User } from "@supabase/supabase-js";
import { SetupPairingPanel } from "@/components/setup/setup-pairing-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SetupRealtimeRefresh } from "@/components/setup/setup-realtime-refresh";
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
		<main className="min-h-svh bg-primaryLight dark:bg-primaryDark">
			<section className="container-page grid min-h-svh items-center py-8 sm:py-12">
				<div className="mx-auto w-full max-w-3xl rounded-2xl border border-accentLight/12 bg-secondaryLight p-5 shadow-[0_18px_52px_rgba(23,23,23,0.08)] dark:border-accentDark/16 dark:bg-secondaryDark dark:shadow-[0_18px_52px_rgba(0,0,0,0.22)] sm:p-8">
					{profile ? <SetupRealtimeRefresh profileId={profile.id} /> : null}

					<div>
						<p className="eyebrow">Setup required</p>

						<h1 className="mt-3 font-serif text-4xl leading-none text-neutral-900 sm:text-5xl">
							Pair with your partner
						</h1>

						<p className="mx-auto mt-5 max-w-2xl leading-7 text-neutral-600">
							Share your pairing code with your partner. Only one person needs to enter the code, the other can accept the request here.
						</p>
						<p className="mt-3 text-sm text-neutral-500">
							Signed in as {user.email ?? user.id}
						</p>
					</div>

					{details.length ? (
						<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
							<p className="font-semibold">Setup status</p>
							<ul className="mt-2 list-disc space-y-1 pl-5">
								{details.map((detail) => (
									<li key={detail}>{detail}</li>
								))}
							</ul>
						</div>
					) : null}

					{profile?.pair_code ? (
						<div className="mt-4 rounded-2xl border border-accentLight/16 bg-hoverLight/70 p-5 text-center dark:border-accentDark/18 dark:bg-hoverDark/55">
							<span className="block text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Your pairing code
							</span>

							<span className="mt-3 block break-all font-mono text-3xl font-semibold tracking-[0.22em] text-neutral-900 sm:text-5xl">
								{profile.pair_code}
							</span>
						</div>
					) : null}

					{profile?.partner_id ? (
						<div className="mt-5 rounded-2xl border border-accentLight/14 bg-hoverLight/60 p-4 dark:border-accentDark/16 dark:bg-hoverDark/45">
							<p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Partner id
							</p>

							<code className="mt-2 block break-all text-sm text-neutral-700 dark:text-neutral-800">
								{profile.partner_id}
							</code>
						</div>
					) : null}

					{profile ? (
						<SetupPairingPanel
							initialRequests={pairingRequests}
							profileId={profile.id}
						/>
					) : (
						<p className="mt-6 text-center text-sm leading-6 text-neutral-600">
							Create your profile first. After that, your pairing code and the
							partner code field will appear.
						</p>
					)}

					{profile ? (
						<div className="mt-6 flex justify-center">
							<SignOutButton className="min-h-11 w-full text-primaryLight hover:bg-hoverDark sm:w-56" />
						</div>
					) : null}
				</div>
			</section>
		</main>
	);
}
