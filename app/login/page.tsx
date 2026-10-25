import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    reset?: string;
  }>;
};

function resetMessage(value: string | undefined) {
  if (value === "expired") {
    return "This reset link is invalid or has expired. Please request a new one.";
  }

  if (value === "invalid") {
    return "This reset link is missing required information. Please request a new one.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getAuthenticatedSession();
  if (auth) redirect("/");
  const params = await searchParams;

  return (
    <main className="min-h-svh glass-canvas">
      <section className="container-page grid min-h-svh items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary-ink">Just the two of us</p>
          <h1 className="mt-5 font-serif text-5xl leading-tight tracking-tight text-foreground sm:text-7xl lg:text-7xl">
            Our Space 𑣲⋆
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 sm:text-lg text-muted-foreground">
            A private place for both of us to share our thoughts, memories, and
            moments together.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground" aria-label="Your shared space">
            {['Little letters', 'Favorite places', 'Everyday moments'].map((label) => <span key={label} className="glass-surface rounded-full px-4 py-2">{label}</span>)}
          </div>
        </div>
        <LoginForm message={resetMessage(params?.reset)} />
      </section>
    </main>
  );
}
