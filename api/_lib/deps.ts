import { createClient } from '@supabase/supabase-js'
import { createHttpCroma, createMockCroma, DEFAULT_CROMA_BASE_URL } from './croma.js'
import type { CromaClient } from './croma.js'
import { createSupabaseDb } from './db.js'
import type { Db } from './db.js'

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export interface AuthenticatedUser {
  id: string
  email: string | null
}

export interface Deps {
  db: Db
  croma: CromaClient
  /** Resolves a Supabase access token to its user, or `null` when it is invalid or expired. */
  verifyToken: (token: string) => Promise<AuthenticatedUser | null>
  now: () => Date
  config: {
    /** One user cannot take more than this many of the organization's scarce Croma connections. */
    maxConnectionsPerUser: number
    /** Failed bank sign-ins allowed per user per hour — protects the user's real account from lockout. */
    maxRejectedPerHour: number
    /** Salt for hashing client IPs into the audit log. When unset, no IP hash is stored. */
    auditIpSalt: string | null
  }
}

function requireEnv(env: NodeJS.ProcessEnv, ...names: string[]): string {
  for (const name of names) {
    const value = env[name]
    if (value) return value
  }
  throw new ConfigError(`Missing environment variable ${names[0]}`)
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function createDeps(env: NodeJS.ProcessEnv = process.env): Deps {
  const supabaseUrl = requireEnv(env, 'SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceKey = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let croma: CromaClient
  if (env.CROMA_MODE === 'mock') {
    // Fake bank data must never reach real users.
    if (env.VERCEL_ENV === 'production') {
      throw new ConfigError('CROMA_MODE=mock is not allowed in production')
    }
    croma = createMockCroma()
  } else {
    croma = createHttpCroma(requireEnv(env, 'CROMA_API_KEY'), env.CROMA_BASE_URL || DEFAULT_CROMA_BASE_URL)
  }

  return {
    db: createSupabaseDb(supabase),
    croma,
    async verifyToken(token) {
      const { data, error } = await supabase.auth.getUser(token)
      if (error || !data.user) return null
      return { id: data.user.id, email: data.user.email ?? null }
    },
    now: () => new Date(),
    config: {
      maxConnectionsPerUser: positiveInt(env.BANK_MAX_CONNECTIONS_PER_USER, 1),
      maxRejectedPerHour: positiveInt(env.BANK_MAX_REJECTED_PER_HOUR, 5),
      auditIpSalt: env.BANK_AUDIT_IP_SALT || null,
    },
  }
}

let cached: Deps | undefined

/** One set of clients per warm function instance. */
export function getDeps(): Deps {
  cached ??= createDeps()
  return cached
}
