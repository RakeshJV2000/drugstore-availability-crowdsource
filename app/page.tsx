export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900" />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Monitor medicine availability near you
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
              medmonitor crowdsources real‑time pharmacy stock. Search by drug or store,
              see what’s in stock, and contribute reports with an anonymous handle.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <a href="/app" className="inline-flex items-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white">
                Take me to the app
              </a>
              <a href="#features" className="inline-flex items-center rounded-md border px-5 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t dark:border-neutral-800">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Search, map & miles</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Search by drug or store. Pick a location via address, map click, or "Use my location". Results show distance in miles with time‑since‑update.</p>
          </div>
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Crowdsourced reports</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Signed‑in users submit availability with a simple form. We compute status + confidence using recent reports.</p>
          </div>
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Store view by status</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">See per‑store lists of IN_STOCK, LOW, OUT, UNKNOWN with counts and updated times. Hide stores with no data.</p>
          </div>
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Auth0 sign‑in</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Secure sign‑in. Each user gets a unique anonymous handle, shown in the navbar and admin views.</p>
          </div>
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Admin tools</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Tabbed dashboard for Users, Drugs, and Flags. Delete users/drugs, view stats, and triage flags with an admin token.</p>
          </div>
          <div className="rounded-lg border p-5 dark:border-neutral-800">
            <h3 className="font-semibold">Seed data</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Optional seed adds 50 drugs and 50 pharmacies across NYC & Jersey City so you can explore immediately.</p>
          </div>
        </div>
      </section>

      <section className="border-t dark:border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex flex-col items-center justify-between gap-4 rounded-lg border p-6 text-center dark:border-neutral-800 sm:flex-row sm:text-left">
            <div>
              <h3 className="text-lg font-semibold">Ready to check availability?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Jump into the app to search nearby stores and contribute a report.</p>
            </div>
            <a href="/app" className="inline-flex items-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white">
              Take me to the app
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

