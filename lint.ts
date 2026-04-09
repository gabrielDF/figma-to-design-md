// lint.ts
// Checks variable and component naming against the DESIGN.md conventions.
// Produces a structured report — not errors, actionable feedback.

import type { FigmaVariable, FigmaVariableCollection, FigmaComponent, FigmaComponentSet } from './figma.js'

export interface LintIssue {
  severity: 'BLOCKING' | 'IMPORTANT' | 'BONUS'
  type: 'naming' | 'missing-description' | 'missing-collection' | 'primitive-in-component' | 'duplicate' | 'dark-mode'
  item: string
  message: string
  fix: string
}

export interface LintReport {
  issues: LintIssue[]
  score: {
    blocking: number
    important: number
    bonus: number
    total: number
  }
  collectionNames: {
    found: string[]
    hasPrimitives: boolean
    hasSemantic: boolean
    hasComponent: boolean
  }
}

// ─── Naming Rules ──────────────────────────────────────────────────────────

const KEBAB_SLASH_REGEX = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)+$/
const HAS_UPPERCASE = /[A-Z]/
const HAS_SPACE = / /
const HAS_UNDERSCORE = /_/
const AUTO_NUMBER = /(?:Frame|Group|Rectangle|Ellipse|Component|Vector)\s*\d+/i
const COPY_SUFFIX = /\s+copy\s*\d*$/i

function checkVariableName(name: string): LintIssue | null {
  if (HAS_SPACE.test(name)) {
    return {
      severity: 'BLOCKING',
      type: 'naming',
      item: name,
      message: `Variable "${name}" contains spaces`,
      fix: `Rename to "${name.replace(/ /g, '-').toLowerCase()}"`,
    }
  }
  if (HAS_UPPERCASE.test(name)) {
    return {
      severity: 'BLOCKING',
      type: 'naming',
      item: name,
      message: `Variable "${name}" contains uppercase letters`,
      fix: `Rename to "${name.toLowerCase()}"`,
    }
  }
  if (HAS_UNDERSCORE.test(name)) {
    return {
      severity: 'IMPORTANT',
      type: 'naming',
      item: name,
      message: `Variable "${name}" uses underscores instead of hyphens`,
      fix: `Rename to "${name.replace(/_/g, '-')}"`,
    }
  }
  if (!name.includes('/')) {
    return {
      severity: 'IMPORTANT',
      type: 'naming',
      item: name,
      message: `Variable "${name}" has no group hierarchy (no "/" separator)`,
      fix: `Add group prefix, e.g. "color/${name}" or "spacing/${name}"`,
    }
  }
  return null
}

function checkComponentName(name: string): LintIssue | null {
  if (AUTO_NUMBER.test(name)) {
    return {
      severity: 'BLOCKING',
      type: 'naming',
      item: name,
      message: `Component "${name}" has a generic auto-generated name`,
      fix: `Rename to a descriptive PascalCase name, e.g. "Button" or "EmailRow"`,
    }
  }
  if (COPY_SUFFIX.test(name)) {
    return {
      severity: 'BLOCKING',
      type: 'naming',
      item: name,
      message: `Component "${name}" appears to be an unnamed copy`,
      fix: `Rename to a descriptive PascalCase name`,
    }
  }
  // PascalCase check: first char should be uppercase
  if (name[0] !== name[0].toUpperCase()) {
    return {
      severity: 'IMPORTANT',
      type: 'naming',
      item: name,
      message: `Component "${name}" doesn't start with uppercase (not PascalCase)`,
      fix: `Rename to "${name[0].toUpperCase()}${name.slice(1)}"`,
    }
  }
  return null
}

// ─── Collection checks ─────────────────────────────────────────────────────

function checkCollections(collections: Record<string, FigmaVariableCollection>): {
  issues: LintIssue[]
  hasPrimitives: boolean
  hasSemantic: boolean
  hasComponent: boolean
  found: string[]
} {
  const names = Object.values(collections).map(c => c.name.toLowerCase())
  const found = Object.values(collections).map(c => c.name)
  const issues: LintIssue[] = []

  const hasPrimitives = names.some(n => n.includes('primitive') || n.includes('base') || n.includes('foundation'))
  const hasSemantic = names.some(n => n.includes('semantic') || n.includes('alias') || n.includes('token'))
  const hasComponent = names.some(n => n.includes('component') || n.includes('comp'))

  if (!hasPrimitives) {
    issues.push({
      severity: 'BLOCKING',
      type: 'missing-collection',
      item: 'Collections',
      message: `No "Primitives" collection found. Found: [${found.join(', ')}]`,
      fix: 'Create a collection named "Primitives" for raw values (hex colors, raw px)',
    })
  }
  if (!hasSemantic) {
    issues.push({
      severity: 'BLOCKING',
      type: 'missing-collection',
      item: 'Collections',
      message: `No "Semantic" collection found. Found: [${found.join(', ')}]`,
      fix: 'Create a collection named "Semantic" with aliases to Primitives',
    })
  }
  if (!hasComponent) {
    issues.push({
      severity: 'IMPORTANT',
      type: 'missing-collection',
      item: 'Collections',
      message: `No "Component" collection found. Found: [${found.join(', ')}]`,
      fix: 'Create a collection named "Component" with aliases to Semantic tokens',
    })
  }

  return { issues, hasPrimitives, hasSemantic, hasComponent, found }
}

// ─── Dark mode check ───────────────────────────────────────────────────────

function checkDarkMode(collections: Record<string, FigmaVariableCollection>): LintIssue[] {
  const issues: LintIssue[] = []
  for (const col of Object.values(collections)) {
    const modeNames = col.modes.map(m => m.name.toLowerCase())
    const hasLight = modeNames.some(m => m.includes('light') || m === 'default' || m === 'value')
    const hasDark = modeNames.some(m => m.includes('dark'))
    if (hasLight && !hasDark && col.name.toLowerCase().includes('semantic')) {
      issues.push({
        severity: 'IMPORTANT',
        type: 'dark-mode',
        item: col.name,
        message: `Collection "${col.name}" has no dark mode`,
        fix: 'Add a "dark" mode and map semantic tokens to dark values',
      })
    }
  }
  return issues
}

// ─── Main lint function ────────────────────────────────────────────────────

export function lint(
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>,
  components: Record<string, FigmaComponent>,
  componentSets: Record<string, FigmaComponentSet>
): LintReport {
  const issues: LintIssue[] = []

  // Collection structure
  const colCheck = checkCollections(collections)
  issues.push(...colCheck.issues)
  issues.push(...checkDarkMode(collections))

  // Variable naming + descriptions
  const seenNames = new Map<string, string>()
  for (const variable of Object.values(variables)) {
    const nameIssue = checkVariableName(variable.name)
    if (nameIssue) issues.push(nameIssue)

    // Duplicate detection (case-insensitive)
    const lower = variable.name.toLowerCase()
    if (seenNames.has(lower) && seenNames.get(lower) !== variable.name) {
      issues.push({
        severity: 'IMPORTANT',
        type: 'duplicate',
        item: variable.name,
        message: `Duplicate variable names with different casing: "${variable.name}" and "${seenNames.get(lower)}"`,
        fix: 'Keep one, delete the other. Ensure consistent casing.',
      })
    }
    seenNames.set(lower, variable.name)

    // Missing descriptions on semantic-looking tokens
    if (variable.name.includes('/bg/') || variable.name.includes('/text/') || variable.name.includes('/border/')) {
      if (!variable.description || variable.description.trim() === '') {
        issues.push({
          severity: 'IMPORTANT',
          type: 'missing-description',
          item: variable.name,
          message: `Semantic variable "${variable.name}" has no description`,
          fix: 'Add a description in Figma: what it is, when to use it, what to pair it with',
        })
      }
    }
  }

  // Component naming + descriptions
  for (const comp of Object.values(components)) {
    const nameIssue = checkComponentName(comp.name)
    if (nameIssue) issues.push(nameIssue)

    if (!comp.description || comp.description.trim() === '') {
      issues.push({
        severity: 'BLOCKING',
        type: 'missing-description',
        item: comp.name,
        message: `Component "${comp.name}" has no description`,
        fix: 'Add a description in Figma: what it is, when to use it, when NOT to use it',
      })
    }
  }

  for (const set of Object.values(componentSets)) {
    if (!set.description || set.description.trim() === '') {
      issues.push({
        severity: 'BLOCKING',
        type: 'missing-description',
        item: set.name,
        message: `Component set "${set.name}" has no description`,
        fix: 'Add a description on the component set in Figma',
      })
    }
  }

  const score = {
    blocking: issues.filter(i => i.severity === 'BLOCKING').length,
    important: issues.filter(i => i.severity === 'IMPORTANT').length,
    bonus: issues.filter(i => i.severity === 'BONUS').length,
    total: issues.length,
  }

  return {
    issues,
    score,
    collectionNames: {
      found: colCheck.found,
      hasPrimitives: colCheck.hasPrimitives,
      hasSemantic: colCheck.hasSemantic,
      hasComponent: colCheck.hasComponent,
    },
  }
}

export function formatLintReport(report: LintReport): string {
  const lines: string[] = []
  const { score } = report

  lines.push('## Lint report')
  lines.push('')

  if (score.total === 0) {
    lines.push('✓ No issues found. Your Figma file is well-structured.')
    return lines.join('\n')
  }

  lines.push(`Found ${score.total} issue(s): ${score.blocking} blocking, ${score.important} important, ${score.bonus} bonus`)
  lines.push('')

  const blocking = report.issues.filter(i => i.severity === 'BLOCKING')
  const important = report.issues.filter(i => i.severity === 'IMPORTANT')
  const bonus = report.issues.filter(i => i.severity === 'BONUS')

  if (blocking.length > 0) {
    lines.push('### [BLOCKING] — Fix before DESIGN.md is useful')
    for (const issue of blocking) {
      lines.push(`- **${issue.item}**: ${issue.message}`)
      lines.push(`  → Fix: ${issue.fix}`)
    }
    lines.push('')
  }

  if (important.length > 0) {
    lines.push('### [IMPORTANT] — Fix to improve agent output quality')
    for (const issue of important) {
      lines.push(`- **${issue.item}**: ${issue.message}`)
      lines.push(`  → Fix: ${issue.fix}`)
    }
    lines.push('')
  }

  if (bonus.length > 0) {
    lines.push('### [BONUS] — Fix to reach full maturity')
    for (const issue of bonus) {
      lines.push(`- **${issue.item}**: ${issue.message}`)
      lines.push(`  → Fix: ${issue.fix}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
