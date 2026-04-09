#!/usr/bin/env node
// index.ts
// CLI entry point for figma-to-design-md
//
// Usage:
//   npx figma-to-design-md --token=xxx --file=yyy
//   npx figma-to-design-md --token=xxx --file=yyy --app-name="Mailory" --output=./mailory/DESIGN.md
//   npx figma-to-design-md --token=xxx --file=yyy --lint-only

import { Command } from 'commander'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { FigmaClient } from './figma.js'
import { parseVariables } from './parse-variables.js'
import { parseComponents } from './parse-components.js'
import { lint } from './lint.js'
import { generateDesignMd, generateLintMd } from './generate.js'

const program = new Command()

program
  .name('figma-to-design-md')
  .description('Generate an agent-ready DESIGN.md from your Figma Variables and component library')
  .version('1.0.0')

program
  .requiredOption('--token <token>', 'Figma personal access token (Settings → Personal access tokens)')
  .requiredOption('--file <fileKey>', 'Figma file key (from URL: figma.com/design/FILE_KEY/...)')
  .option('--app-name <name>', 'App name to use in the DESIGN.md header', 'My App')
  .option('--maintainer <name>', 'Designer name to list as file owner', 'Design team')
  .option('--platform <platform>', 'Target platform: ios | android | both', 'both')
  .option('--output <path>', 'Output path for the DESIGN.md file', './DESIGN.md')
  .option('--lint-output <path>', 'Output path for the lint report (default: same dir as output)')
  .option('--lint-only', 'Only run the lint check — do not generate DESIGN.md', false)
  .option('--no-lint-report', 'Do not append the lint report to the DESIGN.md', false)
  .option('--figma-url <url>', 'Full Figma file URL (used as reference in the generated file)')

program.addHelpText('after', `
Examples:
  $ npx figma-to-design-md --token=figd_xxx --file=JI8hfIvn1kBLVGLNrSKGbv
  $ npx figma-to-design-md --token=figd_xxx --file=JI8hfIvn1kBLVGLNrSKGbv --app-name="Mailory" --output=./mailory/DESIGN.md
  $ npx figma-to-design-md --token=figd_xxx --file=JI8hfIvn1kBLVGLNrSKGbv --lint-only

How to get your Figma token:
  1. Go to figma.com → Settings → Security
  2. Click "Generate new token"
  3. Give it "Read-only" access to File content and Variables

How to get your file key:
  Open your Figma file. The URL looks like:
  https://figma.com/design/FILE_KEY/File-Name
  Copy the FILE_KEY part.

What gets generated:
  Sections 2 (tokens) and 3 (components) are auto-filled from Figma.
  Sections 4 (patterns) and 5 (guardrails) are scaffolded with [TODO].
  These require manual completion — they encode design judgment, not data.

What the lint report tells you:
  BLOCKING  — Issues that prevent the DESIGN.md from being useful to agents
  IMPORTANT — Issues that reduce output quality
  BONUS     — Issues that limit full maturity
`)

program.parse()

const opts = program.opts()

// ─── Validate platform option ──────────────────────────────────────────────

const validPlatforms = ['ios', 'android', 'both']
if (!validPlatforms.includes(opts.platform)) {
  console.error(`Error: --platform must be one of: ${validPlatforms.join(', ')}`)
  process.exit(1)
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const client = new FigmaClient(opts.token)

  console.log(`\n figma-to-design-md`)
  console.log(` ─────────────────────────────────`)
  console.log(` File key  : ${opts.file}`)
  console.log(` App name  : ${opts.appName}`)
  console.log(` Platform  : ${opts.platform}`)
  console.log(` Output    : ${opts.output}`)
  console.log('')

  // ── Fetch from Figma ──

  console.log('Fetching variables from Figma...')
  let variablesData
  try {
    variablesData = await client.getLocalVariables(opts.file)
  } catch (err: any) {
    console.error(`\nError fetching variables: ${err.message}`)
    console.error('Make sure your token has "Variables (Read only)" access.')
    process.exit(1)
  }

  console.log(`  → Found ${Object.keys(variablesData.variables).length} variables in ${Object.keys(variablesData.variableCollections).length} collections`)

  console.log('Fetching components from Figma...')
  let fileData
  try {
    fileData = await client.getFile(opts.file)
  } catch (err: any) {
    console.error(`\nError fetching components: ${err.message}`)
    process.exit(1)
  }

  const componentCount = Object.keys(fileData.components).length
  const setCount = Object.keys(fileData.componentSets).length
  console.log(`  → Found ${componentCount} components in ${setCount} component sets`)

  // ── Lint ──

  console.log('\nRunning lint checks...')
  const lintReport = lint(
    variablesData.variables,
    variablesData.variableCollections,
    fileData.components,
    fileData.componentSets
  )

  const { blocking, important, bonus } = lintReport.score
  if (blocking > 0) {
    console.log(`  ⚠  ${blocking} BLOCKING issue(s) — DESIGN.md will have gaps until fixed`)
  }
  if (important > 0) {
    console.log(`  →  ${important} IMPORTANT issue(s) — fix to improve output quality`)
  }
  if (bonus > 0) {
    console.log(`  ·  ${bonus} BONUS issue(s) — fix to reach full maturity`)
  }
  if (lintReport.score.total === 0) {
    console.log('  ✓  No issues found')
  }

  // ── Lint only mode ──

  if (opts.lintOnly) {
    const lintOutputPath = opts.lintOutput ?? opts.output.replace(/DESIGN\.md$/, 'LINT.md')
    const lintContent = generateLintMd(lintReport, opts.appName)
    mkdirSync(dirname(lintOutputPath), { recursive: true })
    writeFileSync(lintOutputPath, lintContent, 'utf-8')
    console.log(`\n✓ Lint report written to: ${lintOutputPath}`)
    if (blocking > 0) {
      console.log(`\nFix ${blocking} BLOCKING issue(s) in Figma, then re-run to generate DESIGN.md.`)
    }
    return
  }

  // ── Parse ──

  console.log('\nParsing tokens...')
  const tokens = parseVariables(variablesData.variables, variablesData.variableCollections)

  console.log('\nParsing components...')
  const components = parseComponents(fileData.components, fileData.componentSets)

  // ── Generate ──

  console.log('\nGenerating DESIGN.md...')
  const figmaUrl = opts.figmaUrl ?? `https://figma.com/design/${opts.file}`
  const content = generateDesignMd(tokens, components, lintReport, {
    appName: opts.appName,
    figmaFileUrl: figmaUrl,
    maintainer: opts.maintainer,
    platform: opts.platform as 'ios' | 'android' | 'both',
    includeLintReport: opts.lintReport !== false,
  })

  mkdirSync(dirname(opts.output), { recursive: true })
  writeFileSync(opts.output, content, 'utf-8')

  // ── Summary ──

  console.log(`\n✓ DESIGN.md written to: ${opts.output}`)
  console.log('')
  console.log('What was auto-filled:')
  console.log(`  Section 2 — Tokens: ${Object.values(tokens.colors).flat().length + tokens.spacing.component.length + tokens.spacing.layout.length + tokens.radius.length} tokens generated`)
  console.log(`  Section 3 — Components: ${Object.values(components).flat().length} components indexed`)
  console.log('')
  console.log('What needs manual completion:')
  console.log('  Section 4 — Patterns: requires Phase 4 of the Designer Checklist')
  console.log('  Section 5 — Guardrails: requires Phase 4 of the Designer Checklist')
  console.log('  [TODO] items in Section 3: requires filling Figma component descriptions (Phase 3)')

  if (blocking > 0) {
    console.log('')
    console.log(`Fix ${blocking} BLOCKING issue(s) in Figma and re-run to improve output.`)
    console.log(`See the Lint report at the bottom of ${opts.output}`)
  }

  console.log('')
}

main().catch(err => {
  console.error('\nUnexpected error:', err.message)
  process.exit(1)
})
