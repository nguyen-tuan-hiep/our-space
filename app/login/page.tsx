import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAppSession } from "@/lib/auth";

export default async function LoginPage() {
  const appSession = await getAppSession();
  if (appSession) redirect("/dashboard");

  return (
    <main className="min-h-svh bg-paper text-ink">
      <section className="container-page grid min-h-svh items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="eyebrow">Private couple hub</p>
          <h1 className="mt-5 font-serif text-6xl leading-[0.9] sm:text-8xl lg:text-9xl">
            Our Space 𑣲⋆
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600">
            Shared notes, private ledgers, and a quiet dashboard for two lives
            in Vietnam and Singapore.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
