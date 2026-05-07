/** General inquiries and every website form delivery (quote, contact, careers, visitor check-in/out). */
const INFO_EMAIL = "info@popsindustrial.com" as const;

export const company = {
  name: "Pop's Industrial Coatings",
  founded: 1972,
  generations: 4,
  mainOffice: {
    street: "3805 Drane Field Road",
    city: "Lakeland",
    state: "FL",
    zip: "33811",
  },
  shippingReceiving: {
    street: "3515 Airport Road",
    city: "Lakeland",
    state: "FL",
    // TODO(open-question §12.1): live-site footer says 33813; contact page says 33811.
    // Locked to 33811 until client confirms. See docs/prd/POPS-WEBSITE-REBUILD.md §7 + §12.1.
    zip: "33811",
  },
  phone: "863.644.7473",
  fax: "863.644.5926",
  emails: {
    info: INFO_EMAIL,
    invoices: "invoices@popsindustrial.com",
    /** Resend `to` address for all web forms — same inbox as `info`. */
    formSubmissions: INFO_EMAIL,
  },
  hours: {
    weekdays: "Monday–Friday 8am–4pm",
    weekendClosed: "Saturday & Sunday closed",
  },
  tagline: "Four generations of expertise in industrial coatings",
  taglineSecondary: "Your partners for success",
  services: [
    "Wet Paint Coatings",
    "Complex Coating",
    "Abrasive Media Blasting",
    "Powder Coating",
    "Large Capacity Coatings",
  ],
} as const;

export type Company = typeof company;
