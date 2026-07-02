import type { User } from "@supabase/supabase-js";
import { PairingForm } from "@/components/pairing-form";
import { PairingRequests } from "@/components/pairing-requests";
import { SignOutButton } from "@/components/sign-out-button";
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
	const hasPairingRequests = pairingRequests.length > 0;

	return (
		<main className="min-h-svh bg-bg">
			<section className="container-page grid min-h-svh items-center py-8 sm:py-12">
				<div className="mx-auto w-full max-w-3xl rounded-lg border border-neutral-200 bg-paper p-5 sm:p-8">
					{profile ? <SetupRealtimeRefresh profileId={profile.id} /> : null}

					<div>
						<p className="eyebrow">Setup required</p>

						<h1 className="mt-3 font-serif text-4xl leading-none text-neutral-900 sm:text-5xl">
							Pair with your partner
						</h1>

						<p className="mx-auto mt-5 max-w-2xl leading-7 text-neutral-600">
							Share your pairing code with your partner. Only one person needs to enter the code, the other can accept the request here.
						</p>
					</div>

					{profile?.pair_code ? (
						<div className="mt-4 rounded-3xl border border-neutral-200 bg-white/40 p-5 text-center">
							<span className="block text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Your pairing code
							</span>

							<span className="mt-3 block break-all font-mono text-3xl font-semibold tracking-[0.22em] text-neutral-900 sm:text-5xl">
								{profile.pair_code}
							</span>
						</div>
					) : null}

					{profile?.partner_id ? (
						<div className="mt-5 rounded-2xl border border-neutral-200 bg-white/40 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Partner id
							</p>

							<code className="mt-2 block break-all text-sm text-neutral-700">
								{profile.partner_id}
							</code>
						</div>
					) : null}

					{profile ? (
						<div className="mt-4 space-y-4">
							{hasPairingRequests ? (
								<div className="rounded-3xl border border-neutral-200 bg-white/40 p-4 sm:p-5">
									<PairingRequests
										profileId={profile.id}
										requests={pairingRequests}
									/>
								</div>
							) : null}

							<div className="rounded-3xl border border-neutral-200 bg-white/40 p-4 sm:p-5">
								<p className="mb-4 text-sm font-medium text-neutral-700">
									Enter your partner's pairing code
								</p>

								<PairingForm />
							</div>
						</div>
					) : (
						<p className="mt-6 text-center text-sm leading-6 text-neutral-600">
							Create your profile first. After that, your pairing code and the
							partner code field will appear.
						</p>
					)}

					{profile ? (
						<div className="mt-6 flex justify-center">
							<SignOutButton className="min-h-12 w-full text-white hover:bg-neutral-700 sm:w-56" />
						</div>
					) : null}
				</div>
			</section>
		</main>
	);
}
