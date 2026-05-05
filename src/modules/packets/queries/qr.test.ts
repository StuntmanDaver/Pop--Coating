import { describe, it, expect } from 'vitest'
import { regenerateQrSvg, regenerateQrPngDataUrl } from './qr'

const SAMPLE_TOKEN = 'abc123def456ghij'

describe('regenerateQrSvg', () => {
  it('returns an SVG string for a valid token', async () => {
    const svg = await regenerateQrSvg(SAMPLE_TOKEN)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('rejects empty token', async () => {
    await expect(regenerateQrSvg('')).rejects.toThrow('packetToken required')
  })

  it('rejects non-string', async () => {
    await expect(regenerateQrSvg(undefined as unknown as string)).rejects.toThrow(
      'packetToken required'
    )
  })
})

describe('regenerateQrPngDataUrl', () => {
  it('returns a data URL with PNG mime', async () => {
    const dataUrl = await regenerateQrPngDataUrl(SAMPLE_TOKEN)
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    // Body must be non-trivial — sanity bound, not a strict size assertion.
    expect(dataUrl.length).toBeGreaterThan(200)
  })

  it('rejects empty token', async () => {
    await expect(regenerateQrPngDataUrl('')).rejects.toThrow('packetToken required')
  })
})
