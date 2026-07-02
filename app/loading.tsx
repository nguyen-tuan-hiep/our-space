export default function Loading() {
  return (
    <main className="min-h-svh bg-bg">
      <section className="container-page grid min-h-svh place-items-center py-10">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-paper text-3xl">
            𑣲⋆
          </div>
          <p className="eyebrow mt-7">Our Space</p>
          <h1 className="mt-3 font-serif text-4xl leading-none text-neutral-900">
            Opening our space
          </h1>
          <div className="mx-auto mt-8 h-1.5 w-44 overflow-hidden rounded-full bg-white/60">
            <div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
          </div>
        </div>
      </section>
    </main>
  );
}
