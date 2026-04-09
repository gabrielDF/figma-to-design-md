// figma.ts
// Figma REST API client
// Docs: https://www.figma.com/developers/api

export interface FigmaVariable {
  id: string
  name: string
  key: string
  variableCollectionId: string
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
  valuesByMode: Record<string, FigmaVariableValue>
  description: string
  hiddenFromPublishing: boolean
  scopes: string[]
}

export interface FigmaVariableCollection {
  id: string
  name: string
  key: string
  modes: Array<{ modeId: string; name: string }>
  defaultModeId: string
  variableIds: string[]
}

export interface FigmaVariableValue {
  type?: 'VARIABLE_ALIAS'
  id?: string
  r?: number
  g?: number
  b?: number
  a?: number
  value?: number | string | boolean
}

export interface FigmaComponent {
  key: string
  name: string
  description: string
  componentSetId?: string
}

export interface FigmaComponentSet {
  key: string
  name: string
  description: string
  componentPropertyDefinitions?: Record<string, FigmaPropertyDefinition>
}

export interface FigmaPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT'
  defaultValue: string | boolean
  variantOptions?: string[]
}

export interface FigmaFileResponse {
  components: Record<string, FigmaComponent>
  componentSets: Record<string, FigmaComponentSet>
}

export interface FigmaVariablesResponse {
  variables: Record<string, FigmaVariable>
  variableCollections: Record<string, FigmaVariableCollection>
}

// ─── API Client ────────────────────────────────────────────────────────────

export class FigmaClient {
  private baseUrl = 'https://api.figma.com/v1'
  private headers: Record<string, string>

  constructor(token: string) {
    this.headers = {
      'X-Figma-Token': token,
      'Content-Type': 'application/json',
    }
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    const res = await fetch(`${this.baseUrl}/files/${fileKey}?depth=1`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Figma API error ${res.status}: ${await res.text()}`)
    const data = await res.json() as any
    return {
      components: data.components ?? {},
      componentSets: data.componentSets ?? {},
    }
  }

  async getLocalVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    const res = await fetch(`${this.baseUrl}/files/${fileKey}/variables/local`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Figma Variables API error ${res.status}: ${await res.text()}`)
    const data = await res.json() as any
    return {
      variables: data.meta?.variables ?? {},
      variableCollections: data.meta?.variableCollections ?? {},
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export function rgbToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`
  if (a < 1) return `${hex}${toHex(a)}`
  return hex
}

export function resolveVariableValue(
  variable: FigmaVariable,
  modeId: string,
  allVariables: Record<string, FigmaVariable>
): string {
  const raw = variable.valuesByMode[modeId]
  if (!raw) return '[no value]'

  // Alias — resolve recursively
  if (raw.type === 'VARIABLE_ALIAS' && raw.id) {
    const target = allVariables[raw.id]
    if (target) {
      const targetModeId = Object.keys(target.valuesByMode)[0]
      return `→ alias: ${target.name}`
    }
    return `→ alias: [unresolved]`
  }

  // Color
  if (variable.resolvedType === 'COLOR') {
    if (raw.r !== undefined && raw.g !== undefined && raw.b !== undefined) {
      return rgbToHex(raw.r, raw.g, raw.b, raw.a)
    }
  }

  // Number / Float
  if (variable.resolvedType === 'FLOAT') {
    return `${raw.value}px`
  }

  // String / Boolean
  return String(raw.value ?? '[empty]')
}
