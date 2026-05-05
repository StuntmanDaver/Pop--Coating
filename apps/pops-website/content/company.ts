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
    info: "info@popsindustrial.com",
    invoices: "invoices@popsindustrial.com",
  },
  hours: "Monday–Friday 8am–4pm. Saturday & Sunday closed.",
  tagline: "Four generations of expertise in industrial coatings",
  taglineSecondary: "Your partners for success",
  services: [
    "Wet Paint Coatings",
    "Complex Coating",
    "Abrasive Media Blasting",
    "Powder Coating",
    "Large Capacity Powder Coating",
  ],
} as const;

export type Company = typeof company;
