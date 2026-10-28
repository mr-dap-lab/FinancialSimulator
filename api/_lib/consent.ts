import { createHash } from 'node:crypto'
import type { BankLocale, ConsentDocument } from '../../src/lib/bankTypes.js'

/**
 * The legal text a user accepts before connecting a bank account.
 *
 * It lives HERE, on the server, rather than in the UI dictionaries: the server
 * is the one that hashes it and records the hash in the audit log, so it must
 * be the one that owns the exact words. The browser fetches and displays
 * whatever this returns.
 *
 * Bump `CONSENT_VERSION` whenever any wording changes — an old version is
 * rejected on submit, which forces the user to re-read the new text.
 *
 * DRAFT: this wording has not been reviewed by counsel. It must be before this
 * ships to real users (see docs/BANK_CONNECTION_DESIGN.md §6).
 */
export const CONSENT_VERSION = '2026-10-28.1'

export const CONSENT_ITEM_IDS = ['ownership', 'responsibility', 'thirdParty', 'dataProcessing'] as const

const TEXT: Record<BankLocale, Record<(typeof CONSENT_ITEM_IDS)[number], string>> = {
  es: {
    ownership:
      'Soy el titular de esta cuenta de Bancolombia o cuento con la autorización del titular para usarla.',
    responsibility:
      'Entiendo que conectar mi cuenta y compartir mis credenciales es una decisión y una responsabilidad exclusivamente mías. El Simulador Financiero es una herramienta educativa y de planeación personal: no es un asesor financiero y no garantiza resultados.',
    thirdParty:
      'Entiendo que mi usuario y contraseña de la Sucursal Virtual se enviarán a Croma, un proveedor externo, únicamente para consultar mis cuentas y saldos en modo de solo lectura, y que me corresponde revisar si las condiciones de mi banco permiten compartir esas credenciales.',
    dataProcessing:
      'Autorizo el tratamiento de mis datos financieros para mostrarlos en esta aplicación (Ley 1581 de 2012). Puedo desconectar mi cuenta y revocar esta autorización en cualquier momento.',
  },
  en: {
    ownership:
      "I am the holder of this Bancolombia account, or I have the holder's authorization to use it.",
    responsibility:
      'I understand that connecting my account and sharing my credentials is solely my own decision and responsibility. The Financial Simulator is an educational and personal-planning tool: it is not a financial advisor and does not guarantee results.',
    thirdParty:
      "I understand that my Sucursal Virtual username and password will be sent to Croma, a third-party provider, only to read my accounts and balances in read-only mode, and that it is up to me to check whether my bank's terms allow sharing those credentials.",
    dataProcessing:
      'I authorize the processing of my financial data so it can be shown in this application (Colombian Law 1581 of 2012). I can disconnect my account and revoke this authorization at any time.',
  },
}

export function isLocale(value: unknown): value is BankLocale {
  return value === 'es' || value === 'en'
}

export function getConsent(locale: BankLocale): ConsentDocument {
  const items = CONSENT_ITEM_IDS.map((id) => ({ id, text: TEXT[locale][id] }))
  const canonical = [CONSENT_VERSION, locale, ...items.map((item) => `${item.id}: ${item.text}`)].join('\n')
  return {
    version: CONSENT_VERSION,
    locale,
    items,
    hash: createHash('sha256').update(canonical, 'utf8').digest('hex'),
  }
}
