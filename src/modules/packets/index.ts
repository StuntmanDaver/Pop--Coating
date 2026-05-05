// Public API for the Packets module.
// docs/DESIGN.md §4.3 Module 4 (Packets). Generates printable QR-coded job
// packets used as the physical scan target on the shop floor.
//
// The PacketDocument React component and the heavy @react-pdf/renderer module
// are lazy-loaded inside generatePacketPdf() to keep cold-start lean for the
// rest of the app. Don't re-export PacketDocument from this index — it would
// pull react-pdf into the consumer's bundle.

export { generatePacketPdf } from './actions/generate-packet'
export type { GeneratePacketPdfInput, GeneratePacketPdfResult } from './actions/generate-packet'

export { regenerateQrSvg, regenerateQrPngDataUrl } from './queries/qr'
