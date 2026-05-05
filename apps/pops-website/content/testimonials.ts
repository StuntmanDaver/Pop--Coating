/**
 * Customer testimonials and aggregate rating.
 *
 * Sourced from Pops's verified Google reviews. Quotes lightly trimmed for
 * length; meaning preserved.
 *
 * Refresh aggregate rating quarterly from the Google Business Profile (or
 * wire to the Business Profile API later).
 *
 * Last verified: 2026-05-04.
 */

export type Testimonial = {
  /** Pull-quote shown in display type. Trimmed where the original was long. */
  quote: string;
  /** Reviewer's name as it appears on Google. */
  name: string;
  /** Honest descriptor — never invent a title or company. */
  context: string;
  /** Approximate review year for trust signaling and JSON-LD datePublished. */
  when: string;
};

export const GOOGLE_RATING = { stars: 4.7, reviews: 68 } as const;

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The best large scale paint and powder coater around. Exceptional customer service and communication.",
    name: "David Wallace",
    context: "Verified Google Review · Local Guide",
    when: "2026",
  },
  {
    quote:
      "I have done business with most of the paint shops in this area. Attention to detail best describes this company. You really get what you pay for.",
    name: "Captain Ralph",
    context: "Verified Google Review · Local Guide",
    when: "2017",
  },
  {
    quote:
      "The people here are first class friendly. They told me that since the panel was aluminum, glass bead blasting would be best. The panel came out great.",
    name: "Tunis Cooper",
    context: "Verified Google Review · Local Guide",
    when: "2025",
  },
  {
    quote:
      "Great people to work with. Quality job. I would recommend for any large commercial work.",
    name: "Lucas Pemberton",
    context: "Verified Google Review · Local Guide",
    when: "2025",
  },
];
