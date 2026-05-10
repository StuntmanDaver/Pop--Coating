type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

export type RecaptchaResult = {
  success: boolean;
  score: number;
};

export async function verifyRecaptcha(token: string): Promise<RecaptchaResult> {
  // In dev without a secret key, allow all submissions through
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      return { success: true, score: 1.0 };
    }
    throw new Error("RECAPTCHA_SECRET_KEY environment variable is not set");
  }

  // Empty token in dev (script not loaded) — also pass through
  if (!token) {
    return { success: true, score: 1.0 };
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
    },
  );

  if (!response.ok) {
    throw new Error(`reCAPTCHA verification request failed: ${response.status}`);
  }

  const data = (await response.json()) as RecaptchaVerifyResponse;

  return {
    success: data.success === true && (data.score ?? 0) >= 0.5,
    score: data.score ?? 0,
  };
}
