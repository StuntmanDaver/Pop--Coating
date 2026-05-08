import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { POST } from './route'

const ORIGINAL_SECRET = process.env.RESEND_WEBHOOK_SECRET
const SECRET = `whsec_${Buffer.from('test-webhook-secret').toString('base64')}`

afterEach(() => {
  process.env.RESEND_WEBHOOK_SECRET = ORIGINAL_SECRET
})

describe('POST /api/webhooks', () => {
  it('rejects webhook requests when the signing secret is missing', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET

    const response = await POST(new Request('http://localhost/api/webhooks', { method: 'POST' }))

    expect(response.status).toBe(503)
  })

  it('rejects missing signatures', async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET

    const response = await POST(
      new Request('http://localhost/api/webhooks', {
        method: 'POST',
        body: '{"type":"email.delivered"}',
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects stale signatures', async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET
    const payload = '{"type":"email.delivered"}'
    const timestamp = String(Math.floor(Date.now() / 1000) - 601)
    const messageId = 'msg_test_123'

    const response = await POST(
      new Request('http://localhost/api/webhooks', {
        method: 'POST',
        body: payload,
        headers: svixHeaders({ payload, timestamp, messageId }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('acknowledges valid Resend/Svix webhook signatures', async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET
    const payload = '{"type":"email.delivered","data":{"email_id":"email_123"}}'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const messageId = 'msg_test_123'

    const response = await POST(
      new Request('http://localhost/api/webhooks', {
        method: 'POST',
        body: payload,
        headers: svixHeaders({ payload, timestamp, messageId }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})

function svixHeaders({
  payload,
  timestamp,
  messageId,
}: {
  payload: string
  timestamp: string
  messageId: string
}) {
  const signedContent = `${messageId}.${timestamp}.${payload}`
  const secret = Buffer.from(SECRET.slice('whsec_'.length), 'base64')
  const signature = createHmac('sha256', secret).update(signedContent).digest('base64')

  return {
    'svix-id': messageId,
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${signature}`,
  }
}
