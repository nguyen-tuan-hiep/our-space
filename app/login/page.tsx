import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedSession } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthenticatedSession();
  if (auth) redirect("/");

  return (
    <main className="min-h-svh bg-paper">
      <section className="container-page grid min-h-svh items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="eyebrow">Private couple hub</p>
          <h1 className="mt-5 font-serif text-6xl leading-[0.9] sm:text-8xl lg:text-8xl">
            Our Space 𑣲⋆
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600">
            A private place for both of us to share our thoughts, memories, and
            moments together.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
