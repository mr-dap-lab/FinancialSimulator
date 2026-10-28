import type { Dictionary } from '../../i18n/es'
import { BankApiError } from './bankApi'

/** Turns any thrown value into the sentence the user reads. Never shows server text. */
export function bankErrorMessage(error: unknown, t: Dictionary): string {
  const errors = t.bank.errors
  if (!(error instanceof BankApiError)) return errors.generic

  switch (error.code) {
    case 'service_busy':
      return errors.service_busy(error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : null)
    case 'connection_rejected':
    case 'connection_exists':
    case 'connection_limit_user':
    case 'capacity_reached':
    case 'too_many_attempts':
    case 'consent_outdated':
    case 'consent_required':
    case 'audit_unavailable':
    case 'unauthorized':
    case 'not_configured':
    case 'provider_unavailable':
      return errors[error.code]
    default:
      return errors.generic
  }
}
