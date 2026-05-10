import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 503 })
  }

  const payload = await request.text()
  const signature = request.headers.get('svix-signature')
  const messageId = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')

  if (!isValidSvixSignature({ payload, signature, messageId, timestamp, webhookSecret })) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Resend bounce/complaint handling lands with notifications. For now this route
  // only authenticates the webhook source and acknowledges valid deliveries.
  return NextResponse.json({ ok: true })
}

function isValidSvixSignature({
  payload,
  signature,
  messageId,
  timestamp,
  webhookSecret,
}: {
  payload: string
  signature: string | null
  messageId: string | null
  timestamp: string | null
  webhookSecret: string
}) {
  if (!signature || !messageId || !timestamp || !webhookSecret.startsWith('whsec_')) {
    return false
  }

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)) {
    return false
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) {
    return false
  }

  const signedContent = `${messageId}.${timestamp}.${payload}`
  const secret = Buffer.from(webhookSecret.slice('whsec_'.length), 'base64')
  const expected = createHmac('sha256', secret).update(signedContent).digest()

  return signature
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => {
      const [version, value] = part.split(',', 2)
      if (version !== 'v1' || !value) return false

      const received = Buffer.from(value, 'base64')
      return received.length === expected.length && timingSafeEqual(received, expected)
    })
}
