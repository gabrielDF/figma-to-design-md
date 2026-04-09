// parse-components.ts
// Reads Figma component sets and components, produces the component index
// section of the app-level DESIGN.md.

import type { FigmaComponent, FigmaComponentSet, FigmaPropertyDefinition } from './figma.js'

export interface ParsedComponent {
  name: string
  description: string
  variants: string[]
  states: string[]
  sizes: string[]
  booleanProps: string[]
  otherProps: string[]
  isSet: boolean
}

// ─── Property classifier ───────────────────────────────────────────────────

function classifyProperties(props: Record<string, FigmaPropertyDefinition>): {
  variants: string[]
  states: string[]
  sizes: string[]
  booleanProps: string[]
  otherProps: string[]
} {
  const variants: string[] = []
  const states: string[] = []
  const sizes: string[] = []
  const booleanProps: string[] = []
  const otherProps: string[] = []

  for (const [propName, def] of Object.entries(props)) {
    const lower = propName.toLowerCase()

    if (def.type === 'BOOLEAN') {
      booleanProps.push(propName)
      continue
    }

    if (def.type === 'VARIANT' && def.variantOptions) {
      if (lower === 'state' || lower === 'status') {
        states.push(...def.variantOptions)
        continue
      }
      if (lower === 'size') {
        sizes.push(...def.variantOptions)
        continue
      }
      if (lower === 'variant' || lower === 'type' || lower === 'style' || lower === 'kind') {
        variants.push(...def.variantOptions)
        continue
      }
      // Unclassified variant — treat as variant options
      variants.push(...def.variantOptions.map(v => `${propName}: ${v}`))
      continue
    }

    otherProps.push(`${propName} (${def.type.toLowerCase()})`)
  }

  return { variants, states, sizes, booleanProps, otherProps }
}

// ─── Component category classifier ────────────────────────────────────────

function classifyComponentCategory(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('button') || lower.includes('btn') || lower.includes('link') || lower.includes('icon-button')) return 'actions'
  if (lower.includes('input') || lower.includes('field') || lower.includes('search') || lower.includes('select') || lower.includes('checkbox') || lower.includes('radio') || lower.includes('toggle') || lower.includes('switch')) return 'inputs'
  if (lower.includes('card') || lower.includes('sheet') || lower.includes('modal') || lower.includes('dialog') || lower.includes('drawer')) return 'containers'
  if (lower.includes('toast') || lower.includes('alert') || lower.includes('banner') || lower.includes('snackbar') || lower.includes('notification') || lower.includes('empty')) return 'feedback'
  if (lower.includes('tab') || lower.includes('nav') || lower.includes('bar') || lower.includes('header') || lower.includes('breadcrumb')) return 'navigation'
  if (lower.includes('avatar') || lower.includes('badge') || lower.includes('chip') || lower.includes('tag') || lower.includes('label')) return 'display'
  return 'other'
}

// ─── Main parser ───────────────────────────────────────────────────────────

export function parseComponents(
  components: Record<string, FigmaComponent>,
  componentSets: Record<string, FigmaComponentSet>
): Record<string, ParsedComponent[]> {
  const result: Record<string, ParsedComponent[]> = {
    actions: [],
    inputs: [],
    containers: [],
    feedback: [],
    navigation: [],
    display: [],
    other: [],
  }

  const processedSetIds = new Set<string>()

  // Process component sets first (they contain variant info)
  for (const set of Object.values(componentSets)) {
    const category = classifyComponentCategory(set.name)
    const props = classifyProperties(set.componentPropertyDefinitions ?? {})

    result[category].push({
      name: set.name,
      description: set.description ?? '',
      variants: props.variants,
      states: props.states,
      sizes: props.sizes,
      booleanProps: props.booleanProps,
      otherProps: props.otherProps,
      isSet: true,
    })

    processedSetIds.add(set.key)
  }

  // Process standalone components (not part of a set)
  for (const comp of Object.values(components)) {
    if (comp.componentSetId) continue // already handled via set

    const category = classifyComponentCategory(comp.name)
    result[category].push({
      name: comp.name,
      description: comp.description ?? '',
      variants: [],
      states: [],
      sizes: [],
      booleanProps: [],
      otherProps: [],
      isSet: false,
    })
  }

  // Sort each category by name
  for (const cat of Object.keys(result)) {
    result[cat].sort((a, b) => a.name.localeCompare(b.name))
  }

  return result
}

// ─── Markdown renderer ─────────────────────────────────────────────────────

function renderComponent(comp: ParsedComponent): string {
  const lines: string[] = []

  lines.push(`**${comp.name}**`)
  lines.push('```')

  if (comp.variants.length > 0) {
    lines.push(`Variants   : ${comp.variants.join(' | ')}`)
  }
  if (comp.states.length > 0) {
    lines.push(`States     : ${comp.states.join(' | ')}`)
  }
  if (comp.sizes.length > 0) {
    lines.push(`Sizes      : ${comp.sizes.join(' | ')}`)
  }
  if (comp.booleanProps.length > 0) {
    lines.push(`Props      : ${comp.booleanProps.join(', ')}`)
  }

  lines.push('Rules')
  if (comp.description && comp.description.trim() !== '') {
    // Break description into lines for readability
    const descLines = comp.description.split(/[.!]\s+/).filter(Boolean)
    for (const line of descLines) {
      lines.push(`  - ${line.trim()}`)
    }
  } else {
    lines.push('  - [TODO — add description in Figma Component Description field]')
    lines.push('  - [TODO — document: what it is, when to use it, when NOT to use it]')
  }

  lines.push('Token map')
  lines.push('  - [TODO — map variants to token names once tokens are defined]')

  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

export function renderComponentSection(components: Record<string, ParsedComponent[]>): string {
  const sections: string[] = []

  sections.push('## 3. App-specific components\n')
  sections.push('> Generated from Figma component library.\n')
  sections.push('> Rules marked [TODO] require filling in the Figma Description field (Phase 3 of Designer Checklist).\n')

  const categoryLabels: Record<string, string> = {
    actions: 'Actions',
    inputs: 'Inputs',
    containers: 'Containers',
    feedback: 'Feedback',
    navigation: 'Navigation',
    display: 'Display',
    other: 'Other',
  }

  for (const [cat, comps] of Object.entries(components)) {
    if (comps.length === 0) continue

    sections.push(`\n### ${categoryLabels[cat] ?? cat}\n`)
    for (const comp of comps) {
      sections.push(renderComponent(comp))
    }
  }

  return sections.join('\n')
}
