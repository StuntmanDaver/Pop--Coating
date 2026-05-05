import type { MetadataRoute } from "next";

const BASE_URL = "https://popsindustrial.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about-us`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about-us/history`, priority: 0.7, changeFrequency: "yearly" },
    { url: `${BASE_URL}/about-us/leadership`, priority: 0.7, changeFrequency: "yearly" },
    { url: `${BASE_URL}/industrial-coatings-services`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/industrial-coatings-services/wet-paint-coatings`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/industrial-coatings-services/powder-coating`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/industrial-coatings-services/abrasive-media-blasting`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/industrial-coatings-services/complex-coating`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/industrial-coatings-services/large-capacity-powder-coating`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/request-a-quote`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/request-a-quote/facilities-equipment`, priority: 0.8, changeFrequency: "yearly" },
    { url: `${BASE_URL}/request-a-quote/standards-specifications-certifications`, priority: 0.8, changeFrequency: "yearly" },
    { url: `${BASE_URL}/request-a-quote/terms-conditions`, priority: 0.8, changeFrequency: "yearly" },
    { url: `${BASE_URL}/contact`, priority: 0.7, changeFrequency: "yearly" },
    { url: `${BASE_URL}/check-in`, priority: 0.5, changeFrequency: "yearly" },
    { url: `${BASE_URL}/check-out`, priority: 0.5, changeFrequency: "yearly" },
    { url: `${BASE_URL}/guest-safety-rules`, priority: 0.5, changeFrequency: "yearly" },
  ];
}
