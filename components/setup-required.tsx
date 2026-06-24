import Card from "@mui/material/Card";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface SetupRequiredProps {
  user: User;
  profile: Profile | null;
  details?: string[];
}

export function SetupRequired({ user, profile, details = [] }: SetupRequiredProps) {
  return (
    <main className="min-h-svh bg-[#f5f3ee] text-ink">
      <section className="container-page grid min-h-svh items-center py-12">
        <Card className="mx-auto w-full max-w-3xl border border-neutral-200 bg-[#fffaf0] p-6 sm:p-8">
          <p className="eyebrow">Setup required</p>
          <h1 className="mt-3 font-serif text-5xl leading-none">
            Profile link is missing
          </h1>
          <p className="mt-5 leading-7 text-neutral-600">
            Supabase Auth login is working, but the dashboard needs a row in
            `public.profiles` for both users and each row must point to the
            other user through `partner_id`.
          </p>

          <div className="mt-6 grid gap-3 bg-[#fffaf0] p-4 text-sm">
            <p>
              <span className="font-semibold">Current user id:</span>{" "}
              <code>{user.id}</code>
            </p>
            <p>
              <span className="font-semibold">Current email:</span>{" "}
              <code>{user.email ?? "No email"}</code>
            </p>
            <p>
              <span className="font-semibold">Profile row:</span>{" "}
              {profile ? "found, but partner_id is missing or unreadable" : "missing"}
            </p>
            {profile?.partner_id ? (
              <p>
                <span className="font-semibold">Partner id:</span>{" "}
                <code>{profile.partner_id}</code>
              </p>
            ) : null}
          </div>

          {details.length ? (
            <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Diagnostics</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <pre className="mt-6 overflow-auto bg-ink p-4 text-xs leading-6 text-white">
{`insert into public.profiles (id, email, display_name, country_code, currency)
values
  ('${user.id}', '${user.email ?? "your-email@example.com"}', 'Vietnam Partner', 'VN', 'VND'),
  ('PARTNER_AUTH_USER_UUID', 'partner@example.com', 'Singapore Partner', 'SG', 'SGD');

update public.profiles
set partner_id = 'PARTNER_AUTH_USER_UUID'
where id = '${user.id}';

update public.profiles
set partner_id = '${user.id}'
where id = 'PARTNER_AUTH_USER_UUID';`}
          </pre>
        </Card>
      </section>
    </main>
  );
}
