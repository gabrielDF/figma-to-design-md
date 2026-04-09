# figma-to-design-md

Generate agent-ready `DESIGN.md` files from your Figma Variables and component library.

Stop writing your design system context file by hand. This tool reads your Figma file and auto-fills the token and component sections of your `DESIGN.md` — the file that makes Claude Code, Cursor, and other AI coding agents understand your design system.

---

## What it does

**Reads from Figma:**
- All Variables (colors, spacing, radius, typography) with their values, aliases, and descriptions
- All published components and component sets with their variants, states, and descriptions

**Generates:**
- Section 2 (tokens) — auto-filled with real values from Figma
- Section 3 (components) — auto-filled with names, variants, states, and descriptions from Figma
- Section 4 (patterns) — scaffolded with `[TODO]` — requires manual completion
- Section 5 (guardrails) — scaffolded with `[TODO]` — requires manual completion

**Also runs a lint check** that tells you exactly what to fix in Figma to improve output quality.

---

## Quick start

```bash
npx figma-to-design-md \
  --token=figd_your_token \
  --file=your_file_key \
  --app-name="Your App" \
  --output=./DESIGN.md
```

That's it. Open the generated `DESIGN.md`, fill in the `[TODO]` sections, commit it to your repo.

---

## Installation

### As a one-off command (recommended)
```bash
npx figma-to-design-md --token=xxx --file=yyy
```

### As a project dependency
```bash
npm install --save-dev figma-to-design-md
```

Then add to your `package.json`:
```json
{
  "scripts": {
    "design-md": "figma-to-design-md --token=$FIGMA_TOKEN --file=$FIGMA_FILE_KEY --app-name=\"Your App\""
  }
}
```

---

## Getting your Figma credentials

**Personal access token:**
1. Go to figma.com → Settings → Security
2. Click "Generate new token"
3. Give it **Read-only** access to: File content + Variables
4. Copy the token (starts with `figd_`)

**File key:**
Open your Figma file. The URL looks like:
```
https://figma.com/design/FILE_KEY/File-Name
```
Copy the `FILE_KEY` part.

---

## Options

| Option | Required | Default | Description |
|---|---|---|---|
| `--token` | ✓ | — | Figma personal access token |
| `--file` | ✓ | — | Figma file key |
| `--app-name` | | `"My App"` | App name in the DESIGN.md header |
| `--maintainer` | | `"Design team"` | Designer name listed as file owner |
| `--platform` | | `both` | `ios` \| `android` \| `both` |
| `--output` | | `./DESIGN.md` | Output path |
| `--lint-output` | | same dir | Path for the lint report |
| `--lint-only` | | `false` | Only run lint, skip generation |
| `--no-lint-report` | | `false` | Don't append lint report to DESIGN.md |
| `--figma-url` | | auto | Full Figma URL (for reference in the file) |

---

## Multi-app setup (recommended for design system teams)

For teams with multiple apps sharing a design system, use the two-file architecture:

```
/DESIGN.md                ← root — shared conventions, platform rules
/mailory/DESIGN.md        ← app-specific tokens, components, patterns
/seed/DESIGN.md
/whatcolors/DESIGN.md
```

Generate per app:
```bash
# Mailory
npx figma-to-design-md --token=xxx --file=MAILORY_FILE_KEY \
  --app-name="Mailory" --output=./mailory/DESIGN.md

# Seed
npx figma-to-design-md --token=xxx --file=SEED_FILE_KEY \
  --app-name="Seed" --output=./seed/DESIGN.md
```

The root `DESIGN.md` is written and maintained manually — it contains conventions that apply to all apps.

---

## The lint report

Every run produces a lint report that tells you what to fix in Figma.

**BLOCKING** — Without fixing these, the DESIGN.md will be incomplete or misleading:
- No `Primitives` / `Semantic` / `Component` collections
- Variable names with spaces or uppercase letters
- Components with generic auto-generated names (Frame 45, Button copy 2)
- Components with no description

**IMPORTANT** — Fix these to improve agent output quality:
- Semantic variables without descriptions
- Naming inconsistencies (underscores instead of hyphens)
- No dark mode in Semantic collection
- Duplicate variable names in different casing

**BONUS** — Fix these to reach full maturity:
- All variables described
- Complete relationship index

Run lint only (without generating):
```bash
npx figma-to-design-md --token=xxx --file=yyy --lint-only
```

---

## What gets auto-generated vs what you fill manually

| Section | Auto-generated | Manual |
|---|---|---|
| 1. App context | Partial (dates, file URL) | App description, platform overrides |
| 2. Tokens | ✓ From Figma Variables | Fix `[TODO]` where descriptions missing |
| 3. Components | ✓ From Figma library | Fix `[TODO]` where descriptions missing in Figma |
| 4. Patterns | Scaffold only | Fill from Designer Checklist Phase 4 |
| 5. Guardrails | Scaffold only | Fill from Designer Checklist Phase 4 |

**The honest rule:** a half-filled file is better than no file. Fill what you have, mark the rest `[TODO]`, and improve iteratively.

---

## Keeping your DESIGN.md up to date

The file is not auto-synced — you control when it updates. Re-run the command when:
- You've added new tokens in Figma
- You've added or updated component descriptions in Figma
- The design system has a new milestone

```bash
# Re-generate sections 2 and 3, keep sections 4 and 5 intact
npx figma-to-design-md --token=xxx --file=yyy --output=./mailory/DESIGN.md
```

Sections 4 and 5 are never overwritten — they're human-curated.

---

## The Designer Checklist

This tool works best when your Figma file follows the **AI-Ready Design System** naming conventions. The companion checklist tells you exactly what to do in Figma to make this tool produce high-quality output:

- 3-collection architecture (Primitives → Semantic → Component)
- `kebab-case` naming with `/` group separators
- Component descriptions documenting when to use and when NOT to use
- Composition rules and guardrails

→ [Designer Checklist — AI-Ready Design System](./designer-checklist-ai-design-system.md)

---

## Why sections 4 and 5 are always manual

Patterns and guardrails encode **design judgment** — they can't be inferred from Figma data alone. Figma knows that `Button` and `Dialog` exist. It doesn't know that a destructive Dialog must always be paired with a cancel button, or that you never nest two BottomSheets.

This judgment lives in the designer's head. The Designer Checklist helps you extract and document it in Figma first, so it can then be transferred into the DESIGN.md manually.

This is intentional. As Romina Kavcic puts it: *"The goal was never full autonomy. The goal is safe autonomy."*

---

## Contributing

Issues and PRs welcome. The most useful contributions:
- Support for additional Figma variable types (boolean, composite)
- Better component description parsing
- Support for Figma Tokens / Token Studio JSON export as an alternative input
- Integration with design token build pipelines (Style Dictionary, Theo)

---

## License

MIT
