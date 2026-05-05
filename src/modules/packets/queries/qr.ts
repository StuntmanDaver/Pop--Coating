import 'server-only'
import QRCode from 'qrcode'

// Source: docs/DESIGN.md §4.3 Module 4 (Packets) — qrcode package, SVG output,
// error correction level H (30%) so the code remains scannable on grease-stained
// paper and at oblique angles on the shop floor.

const QR_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 1,
  width: 280,
}

/**
 * Render a packet token to an inline-displayable SVG string.
 *
 * The QR encodes the FULL token; manual fallback uses the last-8-char prefix
 * displayed below the code (per DESIGN.md). Module 5's lookupJobByPacketToken
 * accepts either form, scoped to the caller's tenant.
 */
export async function regenerateQrSvg(packetToken: string): Promise<string> {
  if (typeof packetToken !== 'string' || packetToken.length === 0) {
    throw new Error('packetToken required')
  }
  return QRCode.toString(packetToken, { ...QR_OPTIONS, type: 'svg' })
}

/**
 * Render a packet token to a base64 PNG data URL — used by @react-pdf/renderer
 * which can embed PNG via <Image src="data:..."/> but not SVG natively.
 */
export async function regenerateQrPngDataUrl(packetToken: string): Promise<string> {
  if (typeof packetToken !== 'string' || packetToken.length === 0) {
    throw new Error('packetToken required')
  }
  return QRCode.toDataURL(packetToken, QR_OPTIONS)
}
