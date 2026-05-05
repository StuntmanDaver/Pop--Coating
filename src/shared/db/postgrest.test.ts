import { describe, it, expect } from 'vitest'
import { escapeForOr } from './postgrest'

describe('escapeForOr', () => {
  it('passes through plain text untouched', () => {
    expect(escapeForOr('Acme Corp')).toBe('Acme Corp')
    expect(escapeForOr('bumper-coat 123')).toBe('bumper-coat 123')
  })

  it('percent-encodes commas (top-level filter delimiter)', () => {
    expect(escapeForOr('foo,bar')).toBe('foo%2Cbar')
  })

  it('percent-encodes parens (group delimiters)', () => {
    expect(escapeForOr('a(b)c')).toBe('a%28b%29c')
  })

  it('percent-encodes colons (operator delimiter for embedded filters)', () => {
    expect(escapeForOr('foo:bar')).toBe('foo%3Abar')
  })

  it('blocks the canonical injection: extra filter clause via comma', () => {
    // Without escaping, this would inject `role.eq.admin` as an OR clause.
    const evil = 'anything,role.eq.admin'
    expect(escapeForOr(evil)).toBe('anything%2Crole.eq.admin')
  })

  it('leaves dots untouched (legitimate in ilike patterns and field names)', () => {
    // PostgREST treats dot as a structural delimiter in some contexts but
    // dots inside the % wildcards of an ilike value are fine; over-escaping
    // would break legitimate searches like "v1.2.3".
    expect(escapeForOr('v1.2.3')).toBe('v1.2.3')
  })
})
