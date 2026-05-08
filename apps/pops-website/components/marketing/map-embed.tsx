export function MapEmbed() {
  return (
    <div className="overflow-hidden rounded-sm border border-ink-700 shadow-2">
      <iframe
        src="https://www.google.com/maps/embed?origin=mfe&pb=!1m4!2m1!1s3515+Airport+Road+Lakeland,+FL+33811!5e0!6i10"
        title="Map showing Pop's Industrial Coatings shipping & receiving entrance"
        aria-label="3515 Airport Road Lakeland, FL 33811"
        width="100%"
        height="300"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
