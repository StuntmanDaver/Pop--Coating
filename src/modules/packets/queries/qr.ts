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

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? 'http://app.localhost:3000'

export function getPacketScanUrl(packetToken: string): string {
  if (typeof packetToken !== 'string' || packetToken.length === 0) {
    throw new Error('packetToken required')
  }

  const url = new URL('/scan', APP_HOST)
  url.searchParams.set('packet', packetToken)
  return url.toString()
}

/**
 * Render a packet token to an inline-displayable SVG string.
 *
 * The QR encodes the authenticated scanner URL with the full packet token;
 * manual fallback uses the last-8-char prefix displayed below the code.
 */
export async function regenerateQrSvg(packetToken: string): Promise<string> {
  return QRCode.toString(getPacketScanUrl(packetToken), { ...QR_OPTIONS, type: 'svg' })
}

/**
 * Render a packet token to a base64 PNG data URL — used by @react-pdf/renderer
 * which can embed PNG via <Image src="data:..."/> but not SVG natively.
 */
export async function regenerateQrPngDataUrl(packetToken: string): Promise<string> {
  return QRCode.toDataURL(getPacketScanUrl(packetToken), QR_OPTIONS)
}
