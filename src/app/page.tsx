import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <Header user={session?.user} />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand">
              Product fundraising, simplified
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Launch your fundraiser in under 10 minutes
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Create a campaign, add your products, share a link, and start
              collecting orders. Built for schools, sports clubs, and community
              groups.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={
                  session?.user
                    ? "/dashboard/campaigns/new"
                    : "/login?callbackUrl=/dashboard/campaigns/new"
                }
                className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-8 text-base font-semibold text-white shadow-sm hover:bg-brand-dark"
              >
                Start a fundraiser
              </Link>
              <Link
                href={session?.user ? "/dashboard" : "/login?callbackUrl=/dashboard"}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                {session?.user ? "View dashboard" : "Sign in"}
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-gray-100 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
              Three steps. That&apos;s it.
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Build your campaign",
                  desc: "Add your organisation, products, and optional fundraising goal. Upload photos in seconds.",
                },
                {
                  step: "2",
                  title: "Share your link",
                  desc: "Publish and send one link to parents, supporters, and your community.",
                },
                {
                  step: "3",
                  title: "Collect orders",
                  desc: "Buyers order from a mobile-friendly store. Payments can be added later.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="text-gray-600">
              Doughnut drives · Chocolate boxes · Merchandise · Cookie stalls
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Jotform simplicity meets a focused fundraising store.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
