/**
 * Cloudflare Turnstile 验证服务
 */

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || ''
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
  success: boolean
  'error-codes'?: string[]
  validation?: string
  expire?: string
}

/**
 * 验证 Turnstile token
 */
export async function verifyTurnstileToken(token: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn('Turnstile secret key not configured, skipping verification')
    return { success: true }
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      }),
    })

    const result: TurnstileVerifyResult = await response.json()

    if (result.success) {
      return { success: true }
    } else {
      const errorCodes = result['error-codes'] || []
      console.error('Turnstile verification failed:', errorCodes)
      return {
        success: false,
        error: errorCodes.length > 0 ? errorCodes.join(', ') : 'Verification failed',
      }
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return {
      success: false,
      error: 'Verification service unavailable',
    }
  }
}
