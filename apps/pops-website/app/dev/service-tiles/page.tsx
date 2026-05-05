import { ServiceTile } from "../../../components/marketing/service-tile";

export const metadata = {
  title: "ServiceTile preview (dev)",
};

const SERVICES = [
  {
    number: "01",
    name: "Wet Paint Coatings",
    lede: "Industrial liquid coatings for steel, aluminum, and complex assemblies. Specialty primers and topcoats applied in temperature-controlled booths.",
    image: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg",
    href: "/industrial-coatings-services/wet-paint-coatings",
    alt: "Industrial painter applying wet paint coating to steel fabrication at Pop's Lakeland facility",
  },
  {
    number: "02",
    name: "Complex Coating",
    lede: "Multi-stage finishes — blast, prime, intermediate, topcoat — coordinated through a single shop and a single owner. No outside subcontractors.",
    image: "/images/industrial-complex-coatings-1.jpg",
    href: "/industrial-coatings-services/complex-coating",
    alt: "Complex multi-stage coating workflow at Pop's Industrial Coatings",
  },
  {
    number: "03",
    name: "Abrasive Media Blasting",
    lede: "SSPC-SP surface preparation in-house. Garnet, aluminum oxide, and steel grit available for SP-5 white-metal through SP-7 brush blast.",
    image: "/images/abrasive-media-blasting.jpg",
    href: "/industrial-coatings-services/abrasive-media-blasting",
    alt: "Abrasive media blasting cabinet preparing steel for industrial coating",
  },
  {
    number: "04",
    name: "Powder Coating",
    lede: "Electrostatic powder application with full-cure ovens. Durable, chip-resistant finishes for parts up to 25 ft long and 8 ft tall.",
    image: "/images/industrial-powder-coating-lakeland-fl-IMG_3687.jpg",
    href: "/industrial-coatings-services/powder-coating",
    alt: "Powder-coated industrial parts cooling on rack after oven cure at Pop's Lakeland facility",
  },
  {
    number: "05",
    name: "Large Capacity Powder Coating",
    lede: "Central Florida's largest powder oven — line capacity for utility poles, bridge components, and aerospace fixtures.",
    image: "/images/large-capacity-powder-coating.jpg",
    href: "/industrial-coatings-services/large-capacity-powder-coating",
    alt: "Large-capacity powder coating oven loaded with utility-pole steel components",
  },
];

export default function ServiceTilePreviewPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 space-y-12">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-pops-yellow-500">
          ServiceTile — variants &amp; states
        </h1>
        <p className="text-ink-300 text-sm">
          Internal preview for US-016. Hover any tile to see the shadow-3 lift
          and the 1.03 image scale (200ms ease-out). Tab through to confirm the
          focus ring on the inner Link.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">5-up service grid</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SERVICES.map((s) => (
            <ServiceTile key={s.number} {...s} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">2-up — tablet density</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {SERVICES.slice(0, 2).map((s) => (
            <ServiceTile key={s.number} {...s} />
          ))}
        </div>
      </section>
    </main>
  );
}
