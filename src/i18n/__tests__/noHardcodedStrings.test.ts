// @vitest-environment node
/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Guards the Prompt 1 accessibility/i18n baseline: every user-facing string
 * must come from the dictionary (`t.feature.field`), not a literal typed
 * straight into JSX. Walks the real TypeScript AST rather than grepping, so
 * it catches every shape a hardcoded string can take — raw JSX text,
 * `{'like this'}`, and the small set of attributes (`aria-label`, `alt`,
 * `title`, `placeholder`) that carry copy a screen reader or tooltip reads
 * aloud — while leaving every other prop (`className`, `variant`, `type`,
 * SVG `d`/`viewBox`, …) alone, since those are markup, not copy.
 */

const SRC_ROOT = join(currentDir, '..', '..')

const ATTRIBUTE_WATCHLIST = new Set(['aria-label', 'alt', 'title', 'placeholder'])

/** Two or more letters — filters out bare punctuation, symbols, and numbers. */
function hasLetters(text: string): boolean {
  return /\p{L}{2,}/u.test(text)
}

function collectTsxFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      collectTsxFiles(full, files)
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) {
      files.push(full)
    }
  }
  return files
}

/** True when `node` sits anywhere inside an `aria-hidden="true"` element — decorative content. */
function isInsideAriaHidden(node: ts.Node): boolean {
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isJsxElement(current)) {
      for (const attr of current.openingElement.attributes.properties) {
        if (
          ts.isJsxAttribute(attr) &&
          attr.name.getText() === 'aria-hidden' &&
          attr.initializer &&
          ts.isStringLiteral(attr.initializer) &&
          attr.initializer.text === 'true'
        ) {
          return true
        }
      }
    }
    current = current.parent
  }
  return false
}

function checkFile(path: string): string[] {
  const text = readFileSync(path, 'utf8')
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const violations: string[] = []
  const relative = path.slice(SRC_ROOT.length + 1).replace(/\\/g, '/')

  const report = (node: ts.Node, snippet: string) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    violations.push(`${relative}:${line + 1} — ${snippet}`)
  }

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const trimmed = node.text.trim()
      if (trimmed && hasLetters(trimmed) && !isInsideAriaHidden(node)) {
        report(node, `JSX text "${trimmed}"`)
      }
    } else if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isStringLiteral(node.expression) &&
      hasLetters(node.expression.text) &&
      !isInsideAriaHidden(node)
    ) {
      report(node, `JSX expression {'${node.expression.text}'}`)
    } else if (
      ts.isJsxAttribute(node) &&
      ATTRIBUTE_WATCHLIST.has(node.name.getText(sourceFile)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      hasLetters(node.initializer.text)
    ) {
      report(node, `${node.name.getText(sourceFile)}="${node.initializer.text}"`)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

describe('no hardcoded user-facing strings', () => {
  it('every JSX text node and aria-label/alt/title/placeholder comes from the i18n dictionary', () => {
    const files = collectTsxFiles(SRC_ROOT)
    const violations = files.flatMap(checkFile)
    expect(violations).toEqual([])
  })
})
