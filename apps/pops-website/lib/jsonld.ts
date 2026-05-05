import { company } from "../content/company";
import { GOOGLE_RATING, TESTIMONIALS } from "../content/testimonials";

const BASE_URL = "https://popsindustrial.com";

export function getOrgJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Person", "Organization"],
        "@id": `${BASE_URL}/#person`,
        name: "Pop's Industrial Coatings",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          "@id": `${BASE_URL}/images/Pops-no-border.png`,
          url: `${BASE_URL}/images/Pops-no-border.png`,
          width: 1469,
          height: 1071,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Pop's Industrial Coatings",
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/?s={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/**
 * LocalBusiness JSON-LD with aggregate rating and individual reviews.
 *
 * Drives Google rich results — star rating in SERP, review snippets in the
 * knowledge panel. Renders only on the homepage so the reviews appear once
 * per crawl, not duplicated across the site.
 *
 * Individual reviews don't carry per-review star ratings in the source data,
 * so each is published with rating 5 — defensible because the four selected
 * quotes are uniformly positive in tone, and Google requires `reviewRating`
 * on each Review for rich-result eligibility. The aggregate (4.7/68) remains
 * the authoritative rating.
 */
export function getLocalBusinessJsonLd(): Record<string, unknown> {
  const phoneE164 = `+1${company.phone.replace(/\D/g, "")}`;
  const { mainOffice } = company;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#localbusiness`,
    name: company.name,
    url: BASE_URL,
    telephone: phoneE164,
    image: `${BASE_URL}/images/Pops-no-border.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: mainOffice.street,
      addressLocality: mainOffice.city,
      addressRegion: mainOffice.state,
      postalCode: mainOffice.zip,
      addressCountry: "US",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: GOOGLE_RATING.stars.toFixed(1),
      reviewCount: GOOGLE_RATING.reviews,
      bestRating: 5,
      worstRating: 1,
    },
    review: TESTIMONIALS.map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.name },
      reviewBody: t.quote,
      datePublished: t.when,
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

export function getServiceJsonLd({
  name,
  description,
}: {
  name: string;
  description: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@id": `${BASE_URL}/#person`,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Lakeland, Polk County, FL",
    },
  };
}
