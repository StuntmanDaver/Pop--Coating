export type SignInInput = { email: string; password: string }
export type SignInResult = { success: true } | { error: string }

export type MagicLinkInput = { email: string }
export type MagicLinkResult = { success: true } | { error: string }
