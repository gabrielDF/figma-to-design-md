// parse-variables.ts
// Reads Figma variable collections and produces structured token data
// for the DESIGN.md token sections.

import type { FigmaVariable, FigmaVariableCollection } from './figma.js'
import { resolveVariableValue } from './figma.js'

export interface TokenEntry {
  name: string
  value: string
  aliasOf?: string
  description: string
  modes: Record<string, string> // modeName → value
}

export interface ParsedTokens {
  colors: {
    background: TokenEntry[]
    text: TokenEntry[]
    border: TokenEntry[]
    accent: TokenEntry[]
    status: TokenEntry[]
    other: TokenEntry[]
  }
  spacing: {
    component: TokenEntry[]
    layout: TokenEntry[]
    other: TokenEntry[]
  }
  radius: TokenEntry[]
  typography: {
    families: TokenEntry[]
    sizes: TokenEntry[]
    weights: TokenEntry[]
    lineHeights: TokenEntry[]
    composites: TokenEntry[]
  }
  other: TokenEntry[]
  collections: {
    primitives: string[]
    semantic: string[]
    component: string[]
    unknown: string[]
  }
}

// ─── Collection classifier ─────────────────────────────────────────────────

function classifyCollection(name: string): 'primitives' | 'semantic' | 'component' | 'unknown' {
  const lower = name.toLowerCase()
  if (lower.includes('primitive') || lower.includes('base') || lower.includes('foundation')) return 'primitives'
  if (lower.includes('semantic') || lower.includes('alias') || lower.includes('token')) return 'semantic'
  if (lower.includes('component') || lower.includes('comp')) return 'component'
  return 'unknown'
}

// ─── Token classifier ─────────────────────────────────────────────────────

function classifyToken(name: string, type: string): string {
  const lower = name.toLowerCase()

  if (type === 'COLOR') {
    if (lower.includes('/bg/') || lower.includes('background/')) return 'color-bg'
    if (lower.includes('/text/')) return 'color-text'
    if (lower.includes('/border/')) return 'color-border'
    if (lower.includes('danger') || lower.includes('warning') || lower.includes('success') || lower.includes('error')) return 'color-status'
    if (lower.includes('accent') || lower.includes('brand')) return 'color-accent'
    return 'color-other'
  }

  if (type === 'FLOAT') {
    if (lower.includes('spacing') || lower.includes('padding') || lower.includes('gap') || lower.includes('margin')) {
      if (lower.includes('component') || lower.includes('padding')) return 'spacing-component'
      if (lower.includes('layout') || lower.includes('gap') || lower.includes('margin')) return 'spacing-layout'
      return 'spacing-other'
    }
    if (lower.includes('radius') || lower.includes('corner') || lower.includes('rounded')) return 'radius'
    if (lower.includes('font-size') || lower.includes('size/')) return 'typography-size'
    if (lower.includes('font-weight') || lower.includes('weight/')) return 'typography-weight'
    if (lower.includes('line-height') || lower.includes('lineheight')) return 'typography-lineheight'
    return 'other'
  }

  if (type === 'STRING') {
    if (lower.includes('font-family') || lower.includes('family/')) return 'typography-family'
    if (lower.includes('font') || lower.includes('display') || lower.includes('heading') ||
        lower.includes('label') || lower.includes('body') || lower.includes('caption')) return 'typography-composite'
    return 'other'
  }

  return 'other'
}

// ─── Main parser ───────────────────────────────────────────────────────────

export function parseVariables(
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>
): ParsedTokens {
  const result: ParsedTokens = {
    colors: { background: [], text: [], border: [], accent: [], status: [], other: [] },
    spacing: { component: [], layout: [], other: [] },
    radius: [],
    typography: { families: [], sizes: [], weights: [], lineHeights: [], composites: [] },
    other: [],
    collections: { primitives: [], semantic: [], component: [], unknown: [] },
  }

  // Classify collections
  for (const col of Object.values(collections)) {
    const type = classifyCollection(col.name)
    result.collections[type].push(col.name)
  }

  // Build collection map: variableId → collectionName
  const varToCollection = new Map<string, string>()
  for (const col of Object.values(collections)) {
    for (const varId of col.variableIds) {
      varToCollection.set(varId, col.name)
    }
  }

  // Parse each variable
  for (const variable of Object.values(variables)) {
    if (variable.hiddenFromPublishing) continue

    const colName = varToCollection.get(variable.id) ?? ''
    const colType = classifyCollection(colName)

    // Skip raw primitives from the token sections (they're reference only)
    // Include them only if there's no semantic layer
    if (colType === 'primitives' && result.collections.semantic.length > 0) continue

    const collection = Object.values(collections).find(c => c.variableIds.includes(variable.id))
    const defaultModeId = collection?.defaultModeId ?? Object.keys(variable.valuesByMode)[0]

    // Resolve value in default mode
    const value = resolveVariableValue(variable, defaultModeId, variables)

    // Resolve all modes
    const modes: Record<string, string> = {}
    if (collection) {
      for (const mode of collection.modes) {
        modes[mode.name] = resolveVariableValue(variable, mode.modeId, variables)
      }
    }

    // Check if alias
    const rawValue = variable.valuesByMode[defaultModeId]
    const aliasOf = rawValue?.type === 'VARIABLE_ALIAS' && rawValue.id
      ? variables[rawValue.id]?.name
      : undefined

    const entry: TokenEntry = {
      name: variable.name,
      value,
      aliasOf,
      description: variable.description ?? '',
      modes,
    }

    const category = classifyToken(variable.name, variable.resolvedType)

    switch (category) {
      case 'color-bg': result.colors.background.push(entry); break
      case 'color-text': result.colors.text.push(entry); break
      case 'color-border': result.colors.border.push(entry); break
      case 'color-status': result.colors.status.push(entry); break
      case 'color-accent': result.colors.accent.push(entry); break
      case 'color-other': result.colors.other.push(entry); break
      case 'spacing-component': result.spacing.component.push(entry); break
      case 'spacing-layout': result.spacing.layout.push(entry); break
      case 'spacing-other': result.spacing.other.push(entry); break
      case 'radius': result.radius.push(entry); break
      case 'typography-family': result.typography.families.push(entry); break
      case 'typography-size': result.typography.sizes.push(entry); break
      case 'typography-weight': result.typography.weights.push(entry); break
      case 'typography-lineheight': result.typography.lineHeights.push(entry); break
      case 'typography-composite': result.typography.composites.push(entry); break
      default: result.other.push(entry)
    }
  }

  // Sort each group alphabetically
  const sortEntries = (arr: TokenEntry[]) => arr.sort((a, b) => a.name.localeCompare(b.name))
  sortEntries(result.colors.background)
  sortEntries(result.colors.text)
  sortEntries(result.colors.border)
  sortEntries(result.colors.status)
  sortEntries(result.colors.accent)
  sortEntries(result.spacing.component)
  sortEntries(result.spacing.layout)
  sortEntries(result.radius)
  sortEntries(result.typography.families)
  sortEntries(result.typography.sizes)

  return result
}

// ─── Markdown renderer ─────────────────────────────────────────────────────

function renderTokenTable(entries: TokenEntry[], showModes: boolean = false): string {
  if (entries.length === 0) return '  [TODO — no tokens found in this category]\n'

  const lines: string[] = []
  const hasModes = showModes && entries.some(e => Object.keys(e.modes).length > 1)

  for (const entry of entries) {
    const desc = entry.description || '[TODO — add description in Figma]'
    const alias = entry.aliasOf ? `→ ${entry.aliasOf}` : ''
    const valueDisplay = alias || entry.value

    if (hasModes && Object.keys(entry.modes).length > 1) {
      const modeStr = Object.entries(entry.modes)
        .map(([mode, val]) => `${mode}: ${val}`)
        .join(' | ')
      lines.push(`  ${entry.name.padEnd(45)} ${modeStr}`)
      lines.push(`    // ${desc}`)
    } else {
      lines.push(`  ${entry.name.padEnd(45)} ${valueDisplay.padEnd(20)} ${desc}`)
    }
  }

  return lines.join('\n') + '\n'
}

export function renderTokenSection(tokens: ParsedTokens): string {
  const sections: string[] = []

  sections.push('## 2. App-specific tokens\n')
  sections.push('> Generated from Figma Variables. Values copied from Figma export.\n')
  sections.push('> [TODO] sections require adding tokens in Figma first.\n')

  // Colors
  sections.push('\n### 2.1 Color tokens\n')

  if (tokens.colors.background.length > 0) {
    sections.push('```')
    sections.push('Background')
    sections.push(renderTokenTable(tokens.colors.background, true))
    sections.push('```\n')
  }

  if (tokens.colors.text.length > 0) {
    sections.push('```')
    sections.push('Text')
    sections.push(renderTokenTable(tokens.colors.text, true))
    sections.push('```\n')
  }

  if (tokens.colors.border.length > 0) {
    sections.push('```')
    sections.push('Border')
    sections.push(renderTokenTable(tokens.colors.border, true))
    sections.push('```\n')
  }

  if (tokens.colors.status.length > 0) {
    sections.push('```')
    sections.push('Status')
    sections.push(renderTokenTable(tokens.colors.status, true))
    sections.push('```\n')
  }

  if (tokens.colors.accent.length > 0) {
    sections.push('```')
    sections.push('Accent')
    sections.push(renderTokenTable(tokens.colors.accent, true))
    sections.push('```\n')
  }

  // Typography
  if (tokens.typography.families.length > 0 || tokens.typography.composites.length > 0) {
    sections.push('\n### 2.2 Typography tokens\n')
    sections.push('```')
    sections.push('Font families')
    sections.push(renderTokenTable(tokens.typography.families))
    if (tokens.typography.composites.length > 0) {
      sections.push('\nScale')
      sections.push(renderTokenTable(tokens.typography.composites))
    }
    sections.push('```\n')
  }

  // Spacing
  if (tokens.spacing.component.length > 0 || tokens.spacing.layout.length > 0) {
    sections.push('\n### 2.3 Spacing tokens\n')
    sections.push('```')
    if (tokens.spacing.component.length > 0) {
      sections.push('Component internal')
      sections.push(renderTokenTable(tokens.spacing.component))
    }
    if (tokens.spacing.layout.length > 0) {
      sections.push('\nLayout')
      sections.push(renderTokenTable(tokens.spacing.layout))
    }
    sections.push('```\n')
  }

  // Radius
  if (tokens.radius.length > 0) {
    sections.push('\n### 2.4 Radius tokens\n')
    sections.push('```')
    sections.push(renderTokenTable(tokens.radius))
    sections.push('```\n')
  }

  return sections.join('\n')
}
