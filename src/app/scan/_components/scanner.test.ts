import { describe, expect, it } from 'vitest'
import { extractPacketToken } from './scanner'

describe('extractPacketToken', () => {
  it('extracts packet query param from scanner URLs', () => {
    expect(extractPacketToken('https://app.popsindustrial.com/scan?packet=abc123def456ghij')).toBe(
      'abc123def456ghij'
    )
  })

  it('leaves bare manual tokens unchanged', () => {
    expect(extractPacketToken('abc123def456ghij')).toBe('abc123def456ghij')
  })
})
