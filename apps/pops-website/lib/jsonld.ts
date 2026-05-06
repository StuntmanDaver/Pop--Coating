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
