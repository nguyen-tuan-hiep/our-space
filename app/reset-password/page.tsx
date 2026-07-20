import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getAuthenticatedSession } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const auth = await getAuthenticatedSession();
  if (!auth) redirect("/login");

  return (
    <main className="min-h-svh bg-primaryLight dark:bg-primaryDark">
      <section className="container-page grid min-h-svh content-start gap-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:content-center sm:py-10">
        <div className="mx-auto grid w-full max-w-xl gap-5">
          <div>
            <p className="eyebrow">Our Space 𑣲⋆</p>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              Enter a new password for your account.
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}
