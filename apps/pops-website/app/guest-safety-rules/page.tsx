import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { Hero } from "../../components/marketing/hero";

export const metadata: Metadata = {
  title: "Guest Safety Rules - Pop's Industrial Coatings",
  description: "Guest safety acknowledgment and check-in agreement for Pop's Industrial Coatings facility.",
};

export default function GuestSafetyRulesPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="VISITING US"
          heading="Guest Safety Rules"
          lede="Please read these rules carefully before entering our facility."
          primaryCta={{ label: "Check In", href: "/check-in" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="mx-auto max-w-[720px] space-y-8 font-text text-sm leading-relaxed text-ink-200">

              <section>
                <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-ink-100">
                  Guest Safety Acknowledgment &amp; Check-In Agreement
                </h2>

                <p className="mb-4 font-semibold uppercase tracking-wide text-pops-yellow-400">
                  Important Safety Notice
                </p>

                <p className="mb-4">
                  You are entering an active industrial coating facility, including all parking and storage areas (the
                  &ldquo;Facility&rdquo;). This &ldquo;Facility&rdquo; includes, but is not limited to:
                </p>

                <ul className="mb-4 list-disc space-y-1 pl-6">
                  <li>Forklifts and heavy equipment</li>
                  <li>Moving vehicles and overhead loads</li>
                  <li>Steel, piping, structural components and material</li>
                  <li>Industrial coatings, solvents, blasting media and airborne particulates</li>
                  <li>Uneven surfaces and noise hazards</li>
                </ul>

                <p>
                  For your safety, strict adherence to the &ldquo;Facility&rdquo; rules is required at all times.
                </p>
              </section>

              <section>
                <p className="mb-4 font-semibold uppercase tracking-wide text-pops-yellow-400">
                  Required Guest Safety Rules
                </p>

                <p className="mb-4">
                  All guests, visitors, vendors and non-employees must comply with the following:
                </p>

                <ul className="space-y-4 pl-6">
                  <li>
                    <span className="font-semibold text-ink-100">Check In Required</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>
                        All guests must check in at shipping &amp; receiving or the front office before entering the
                        facility.
                      </li>
                      <li>
                        You must remain with your designated Pop&apos;s Industrial Coatings escort at all times unless
                        expressly authorized otherwise.
                      </li>
                    </ul>
                  </li>

                  <li>
                    <span className="font-semibold text-ink-100">Personal Protective Equipment (PPE)</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Closed toe shoes are required at all times.</li>
                      <li>
                        Additional PPE (hard hat, safety glasses, hearing protection, high-visibility vest, respirator,
                        etc.) must be worn if instructed.
                      </li>
                      <li>Failure to wear required PPE may result in removal from the facility.</li>
                    </ul>
                  </li>

                  <li>
                    <span className="font-semibold text-ink-100">Restricted Areas</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>
                        Do not enter production, blasting, coating or yard areas unless explicitly permitted.
                      </li>
                      <li>Never cross barriers, safety tape or warning signage.</li>
                    </ul>
                  </li>

                  <li>
                    <span className="font-semibold text-ink-100">Equipment &amp; Vehicle Awareness</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Always remain alert for forklifts, cranes, trucks and moving equipment.</li>
                      <li>Do not walk under suspended loads or approach operating machinery.</li>
                    </ul>
                  </li>

                  <li>
                    <span className="font-semibold text-ink-100">Conduct &amp; Compliance</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Horseplay, distractions or unsafe behavior are not permitted.</li>
                      <li>Follow all verbal and posted safety instructions immediately.</li>
                    </ul>
                  </li>

                  <li>
                    <span className="font-semibold text-ink-100">Injuries &amp; Incidents</span>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>
                        Report all injuries, near misses or unsafe conditions immediately to a Pop&apos;s Industrial
                        Coatings representative.
                      </li>
                      <li>Do not attempt to render aid beyond your training.</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <p className="mb-4 font-semibold uppercase tracking-wide text-pops-yellow-400">
                  Assumption of Risk
                </p>

                <p className="mb-4">
                  By checking in or electronically acknowledging this notice, you confirm that:
                </p>

                <ul className="list-disc space-y-3 pl-6">
                  <li>You understand you are entering an industrial work environment with inherent risks.</li>
                  <li>
                    You agree to comply with all safety rules, instructions and PPE requirements.
                  </li>
                  <li>
                    You voluntarily assume all risk of injury, death, illness or damage to your person or property
                    arising out of or relating to your presence at the &ldquo;Facility&rdquo; whether such risk are
                    known or unknown, foreseeable or unforeseeable and whether occurring during normal operations or
                    otherwise, except to the extent caused by the gross negligence or willful misconduct of the owner.
                    This assumption of risk is intended to be as broad and inclusive as permitted under Florida law.
                  </li>
                  <li>
                    You agree that failure to follow safety requirements may result in immediate removal from the
                    facility.
                  </li>
                </ul>
              </section>

              <section>
                <p className="mb-4 font-semibold uppercase tracking-wide text-pops-yellow-400">
                  Authorization to Enter
                </p>
                <p>
                  By checking in, I acknowledge that I have read, understand and agree to comply with all safety
                  requirements while at the &ldquo;Facility&rdquo;.
                </p>
              </section>

              <div className="border-t border-ink-600 pt-8">
                <Link
                  href="/check-in"
                  className="inline-block rounded-sm bg-pops-yellow-500 px-6 py-3 font-text text-sm font-semibold text-black transition-colors hover:bg-pops-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Proceed to Check In
                </Link>
              </div>

            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
