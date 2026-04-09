# Designer Checklist — AI-Ready Design System
## Build your design system so agents can actually use it

> Reference convention: **Figma Native Variables**, **3-collection architecture** (Primitives → Semantic → Component), mobile-first iOS/Android.

---

## How to use this guide

Each phase is independent and deliverable on its own. An app can be at phase 2 for colors and phase 1 for typography — that's fine. The goal isn't perfection upfront, it's measurable progress.

Each item has a priority indicator:
- `[BLOCKING]` — without this, an agent generates inconsistent code
- `[IMPORTANT]` — significantly improves output quality
- `[BONUS]` — optimizes speed and precision

---

## Phase 1 — Foundation
### Well-structured variable collections

The foundation of everything. If this phase is rushed, the following phases have no value for an agent.

### 1.1 Collection architecture

Create exactly 3 collections in Figma Variables, in this order:

```
Collection 1 : Primitives
Collection 2 : Semantic
Collection 3 : Component
```

**Absolute rule**: Figma components never consume Primitives directly. Always via Semantic or Component.

- [ ] `[BLOCKING]` `Primitives` collection created
- [ ] `[BLOCKING]` `Semantic` collection created with aliases pointing to Primitives
- [ ] `[IMPORTANT]` `Component` collection created with aliases pointing to Semantic

### 1.2 Naming convention — universal rules

Format: `group/subgroup/role` in strict `kebab-case`, all lowercase.

```
✅  color/bg/brand-primary
✅  color/text/neutral-secondary
✅  spacing/layout/section-gap
✅  radius/component/button

❌  Color / BG / BrandPrimary       (mixed case)
❌  colorBgBrandPrimary             (camelCase)
❌  color-bg-brand-primary          (hyphens instead of slashes)
❌  bg brand primary                (spaces)
```

- [ ] `[BLOCKING]` Zero spaces in all variable names
- [ ] `[BLOCKING]` Zero uppercase letters in all variable names
- [ ] `[BLOCKING]` Group separator = `/`, word separator = `-`
- [ ] `[IMPORTANT]` No naming duplicates (same name in different casing)

### 1.3 Primitives collection — naming

Primitives are raw values. They carry no intent, only a value.

**Format**: `type/family/scale`

```
Colors
  color/brand/50
  color/brand/100
  color/brand/200
  ...
  color/brand/900
  color/neutral/50 → color/neutral/900
  color/accent-purple/50 → color/accent-purple/900
  color/error/50 → color/error/900
  color/warning/50 → color/warning/900
  color/success/50 → color/success/900

Typography
  font-family/display         (e.g. DM Serif Display)
  font-family/body            (e.g. DM Sans)
  font-size/2xs               (10px)
  font-size/xs                (12px)
  font-size/sm                (14px)
  font-size/md                (16px)
  font-size/lg                (18px)
  font-size/xl                (20px)
  font-size/2xl               (24px)
  font-size/3xl               (32px)
  font-size/4xl               (36px)
  font-weight/regular         (400)
  font-weight/medium          (500)
  font-weight/semibold        (600)
  font-weight/bold            (700)
  line-height/tight           (1.2)
  line-height/normal          (1.4)
  line-height/relaxed         (1.6)

Spacing
  spacing/0                   (0px)
  spacing/1                   (4px)
  spacing/2                   (8px)
  spacing/3                   (12px)
  spacing/4                   (16px)
  spacing/5                   (20px)
  spacing/6                   (24px)
  spacing/8                   (32px)
  spacing/10                  (40px)
  spacing/12                  (48px)
  spacing/16                  (64px)

Radius
  radius/none                 (0px)
  radius/sm                   (4px)
  radius/md                   (8px)
  radius/lg                   (12px)
  radius/xl                   (16px)
  radius/2xl                  (20px)
  radius/full                 (9999px)
```

- [ ] `[BLOCKING]` All colors used in the app exist as primitives
- [ ] `[BLOCKING]` Complete scale per family (no gaps in the palette)
- [ ] `[IMPORTANT]` Font-family defined as a variable (not hardcoded)
- [ ] `[IMPORTANT]` All spacing values are multiples of 4px

### 1.4 Semantic collection — naming

Semantics carry **intent**. An agent reads the name and understands when to use it, without reading the value.

**Format**: `type/context/role` or `type/state/role`

```
Background colors
  color/bg/brand-primary        → alias: color/brand/900
  color/bg/brand-secondary      → alias: color/brand/50
  color/bg/neutral-primary      → alias: color/neutral/0 (white)
  color/bg/neutral-secondary    → alias: color/neutral/50
  color/bg/neutral-tertiary     → alias: color/neutral/100
  color/bg/danger               → alias: color/error/500
  color/bg/warning              → alias: color/warning/500
  color/bg/success              → alias: color/success/500

Text colors
  color/text/neutral-primary    → alias: color/neutral/900
  color/text/neutral-secondary  → alias: color/neutral/600
  color/text/neutral-tertiary   → alias: color/neutral/400
  color/text/neutral-disabled   → alias: color/neutral/300
  color/text/on-brand           → alias: color/brand/50
  color/text/on-danger          → alias: color/error/50
  color/text/link               → alias: color/accent-purple/600

Borders
  color/border/default          → alias: color/neutral/200
  color/border/subtle           → alias: color/neutral/100
  color/border/strong           → alias: color/neutral/400
  color/border/danger           → alias: color/error/400

Semantic spacing
  spacing/component/padding-xs  → alias: spacing/2
  spacing/component/padding-sm  → alias: spacing/3
  spacing/component/padding-md  → alias: spacing/4
  spacing/component/padding-lg  → alias: spacing/6
  spacing/layout/section-gap    → alias: spacing/8
  spacing/layout/page-margin    → alias: spacing/4

Semantic radius
  radius/component/button       → alias: radius/full
  radius/component/card         → alias: radius/xl
  radius/component/input        → alias: radius/lg
  radius/component/badge        → alias: radius/full
  radius/component/sheet        → alias: radius/2xl
```

- [ ] `[BLOCKING]` No direct hex or px values in Semantic (aliases only)
- [ ] `[BLOCKING]` All component colors go through Semantic
- [ ] `[IMPORTANT]` Cover all states: default, hover, active, disabled, danger
- [ ] `[IMPORTANT]` Clear separation of bg / text / border in names

### 1.5 Dark mode

If the app supports dark mode:

- [ ] `[BLOCKING]` Create a `light` and a `dark` mode in the Semantic collection
- [ ] `[BLOCKING]` Each Semantic variable has a value per mode (not light only)
- [ ] `[IMPORTANT]` Primitives never change between modes — only Semantics do

---

## Phase 2 — Machine-readable components
### What an agent can read and reuse without ambiguity

### 2.1 Component naming

**Format**: `ComponentName` in PascalCase. Internal layers in `kebab-case`.

```
✅  Button
✅  InputField
✅  EmailRow
✅  ToastNotification
✅  BottomSheet

❌  button copy 2
❌  Button_new
❌  BTN - Primary
❌  Frame 1261153387
```

- [ ] `[BLOCKING]` Zero components with a generic name (Frame, Group, Rectangle...)
- [ ] `[BLOCKING]` Zero Figma auto-numbers in published names (Frame 45, Copy 2)
- [ ] `[IMPORTANT]` Consistent PascalCase naming across all published components

### 2.2 Component properties

For each component, explicitly define its properties in Figma's Component Properties panel.

**Property naming conventions:**

```
Boolean states
  is-disabled     (not: disabled, Disabled, isDisabled)
  is-loading      (not: loading, Loading)
  has-icon        (not: icon, showIcon, Icon)
  has-suffix      (not: suffix, showSuffix)

State variants
  state           values: default | hover | pressed | focused | disabled
  size            values: xs | sm | md | lg | xl
  variant         values: primary | secondary | tertiary | ghost | destructive | danger

Content
  label           (primary text)
  description     (secondary text)
  placeholder     (for inputs)
```

- [ ] `[BLOCKING]` Every component has at least the `state` property with its values
- [ ] `[BLOCKING]` Boolean properties start with `is-` or `has-`
- [ ] `[IMPORTANT]` Consistent variant values across components (same word for the same concept)
- [ ] `[IMPORTANT]` No property named with a number (Property 1, Property 2)

### 2.3 States covered

For each interactive component, cover **at minimum** these states:

```
Basic component       : default, disabled
Interactive component : default, hover, pressed, focused, disabled
Input component       : default, focused, filled, error, disabled
Status component      : default, success, warning, danger
```

- [ ] `[BLOCKING]` `disabled` state exists for all interactive components
- [ ] `[IMPORTANT]` `error` state exists for all form components
- [ ] `[IMPORTANT]` hover/pressed states exist (even approximate) for all touch targets

### 2.4 Systematic auto-layout

- [ ] `[BLOCKING]` All published components use auto-layout (no fixed positioning)
- [ ] `[BLOCKING]` Internal spacing goes through Spacing variables
- [ ] `[IMPORTANT]` Constraints (Hug / Fill / Fixed) explicitly set on each component

### 2.5 Mobile-specific requirements

- [ ] `[BLOCKING]` All touch targets ≥ 44×44pt (iOS/Android standard)
- [ ] `[IMPORTANT]` No hover state as primary interaction (mobile = touch, not hover)
- [ ] `[IMPORTANT]` Safe areas documented for navigation components (bottom bar, status bar)

---

## Phase 3 — Intent documentation
### The layer 95% of design systems don't have

This is where the difference between an agent that "generates" and an agent that "understands" happens.

### 3.1 Component descriptions

In Figma, master component panel → Description field.

**Description template:**
```
[What it is] — [When to use it] — [When NOT to use it] — [Composition rule if applicable]
```

**Concrete examples:**

```
Button / primary
"Primary action for a screen. One primary button per view maximum.
Do not use for destructive actions — use variant:destructive instead.
Always includes an explicit label, never icon-only."

Button / destructive
"Irreversible actions only (deletion, sign out).
Always paired with a secondary cancel button in the same view.
Never use as the primary CTA on an acquisition screen."

InputField / default
"Simple text input. Use variant:error with an explicit error message
below the field — never red without a message.
Placeholder does not replace the label — both must be present."

ToastNotification / success
"Confirmation of a completed action. Duration: 3s auto-dismiss.
Do not use for content the user needs to read entirely
— use BottomSheet in that case."

EmailRow / default
"Email row in the main list. Sender name in text/neutral-primary,
subject in text/neutral-secondary, snippet in text/neutral-tertiary.
Unread state uses font-weight/semibold on sender name and subject only."
```

- [ ] `[BLOCKING]` Every interactive component has a non-empty description
- [ ] `[BLOCKING]` The description mentions at least one non-usage case
- [ ] `[IMPORTANT]` Components in the same family have consistent descriptions
- [ ] `[IMPORTANT]` Composition rules (always paired with X) are explicit

### 3.2 Semantic token documentation

In the Semantic collection, use the Description field of each variable to document intent.

```
color/bg/danger
  → "Background for elements signaling an error or destructive action.
     Always paired with color/text/on-danger.
     Never use for warnings — use color/bg/warning."

color/text/neutral-tertiary
  → "Low-importance text: timestamps, metadata, placeholders.
     Minimum WCAG AA contrast (4.5:1) on neutral-primary background only.
     Avoid on colored backgrounds."

spacing/layout/section-gap
  → "Vertical space between sections on the same page.
     Do not use inside a component."
```

- [ ] `[IMPORTANT]` Critical Semantic variables (status colors, text-on-X) documented
- [ ] `[IMPORTANT]` Mandatory pairings are explicit (bg/danger → text/on-danger)
- [ ] `[BONUS]` All Semantic variables have a description

### 3.3 Context annotations

For recurring patterns, annotate directly in Figma using sticky notes or documentation frames visible in the file (not in exports).

Document at minimum:
- Composing patterns (e.g. Dialog + Alert + 2 Buttons)
- Common edge cases
- Design decisions that may seem counter-intuitive

- [ ] `[IMPORTANT]` Each composition pattern documented in the Figma file
- [ ] `[BONUS]` Dedicated "Patterns" page in the Figma file

---

## Phase 4 — Composition rules
### The rules that prevent your system from degrading

### 4.1 Relationship index

Document which components are systematically combined together.

```
Dialog
  → always with : [Button/primary] + [Button/secondary]
  → optional    : [Alert/warning] for destructive actions
  → never with  : [Button/destructive] without [Button/secondary]

Form
  → always with : [Button/primary] at the bottom
  → each [InputField] with its [Label] above
  → [InputField/error] always with [ErrorMessage] below

BottomSheet
  → always with : drag handle at the top
  → if actions  : [Button] in a fixed footer, not scrolling with content
  → never nested inside another BottomSheet
```

- [ ] `[IMPORTANT]` The 10 most-used components have their relationship index documented
- [ ] `[IMPORTANT]` Composition prohibitions are listed (never X with Y)
- [ ] `[BONUS]` Complete index for all components

### 4.2 Explicit guardrails

The absolute rules that even a senior agent must not break.

```
ALWAYS
  - Use a Semantic variable (never a Primitive) inside a component
  - Cover the disabled state on all interactive components
  - Minimum 44×44pt for all touch targets
  - One Button/primary per view

NEVER
  - Hardcode a hex value inside a component
  - Use color/bg/danger for warnings (→ color/bg/warning)
  - Place color/text/neutral-tertiary text on a colored background
  - Nest two BottomSheets
  - Use Button/destructive without a cancel button in the same view
```

- [ ] `[IMPORTANT]` ALWAYS/NEVER list written and accessible in the Figma file
- [ ] `[IMPORTANT]` These guardrails will be carried verbatim into DESIGN.md
- [ ] `[BONUS]` Guardrails organized both by component AND by global rule

### 4.3 Drift management

Design systems degrade naturally over time. Put in place:

- [ ] `[IMPORTANT]` Convention: every new component goes through a naming review before publishing
- [ ] `[IMPORTANT]` Duplicate variables audited at each milestone
- [ ] `[BONUS]` Regular audit with a validation plugin (Figma Tokens, Token Flow, Variables Audit)

---

## Summary by priority

### Do first (BLOCKING)
1. Create the 3 Figma Variable collections (Primitives / Semantic / Component)
2. Apply strict `kebab-case` naming, `group/subgroup/role` format
3. No primitive values directly inside components
4. Non-empty descriptions on all interactive components
5. Touch targets ≥ 44×44pt

### Do next (IMPORTANT)
6. Document the intent of critical Semantic tokens
7. List composition rules for the 10 main components
8. Write the ALWAYS/NEVER guardrails
9. Dark mode with per-mode values in Semantic

### To reach full maturity (BONUS)
10. Complete relationship index for all components
11. Patterns page in Figma
12. Regular drift audit with a plugin

---

> Once Phase 1 and 2 are complete, DESIGN.md can be generated.
> Once Phase 3 and 4 are complete, DESIGN.md reaches full maturity.

---

## Reference resources

### Official Figma documentation

**The mandatory starting point**
- [Guide to variables in Figma](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma) — The complete official documentation on Variables: types, modes, scopes, API. Read this before touching anything.

**The official design system course (with Variables)**
- [Intro to design systems — Update 1: Tokens, variables, and styles](https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles) — Figma's official course on tokens. Covers the primitive / semantic / component distinction, illustrated with Habitz (a fictional app).

**The companion Figma file for the course**
- [Habitz design system (with variables)](https://www.figma.com/community/file/1298672675597243186/habitz-design-system-with-variables) — The complete file from the official course. The concrete reference to see the 3-collection architecture in action.

**The hands-on starter file**
- [Get started with variables](https://www.figma.com/community/file/1253086684245880517/get-started-with-variables) — Official Figma playground to experiment with variables without risking your own file.

**The multi-brand / multi-product architecture guide**
- [Guide: Variable mapping and design system structure](https://www.figma.com/community/file/1262724388830684966/guide-variable-mapping-and-design-system-structure) — Official Figma guide for structuring collections across 4 scenarios: single brand, multi-brand with shared primitives, multi-brand with different primitives, multi-product. Essential for a multi-app architecture.

---

### Advanced resources

**Variables + Code Connect (Figma → codebase)**
- [Schema 2025: Design Systems For A New Era](https://www.figma.com/blog/schema-2025-design-systems-recap/) — Figma's 2025 design systems conference recap. Covers: Extended collections (multi-brand), native W3C DTCG import/export, Check designs AI linter (suggests the correct variables), and Code Connect to link design tokens to real code.

**Into Design Systems conference — token workflow**
- [Design Tokens Workflow in Figma — A practical guide](https://intodesignsystems.medium.com/design-tokens-workflow-in-figma-a-practical-guide-1efd508250ad) — Conference writeup on the Design Token Starter Canvas: 5 pillars to validate before creating tokens. The key principle: "Don't build tokens just because someone said you should — start with clear goals."

**Agentic design systems (the context behind this guide)**
- [Why your design system is the most important asset in the AI era](https://learn.thedesignsystem.guide/p/why-your-design-system-is-the-most) — Romina Kavcic's article establishing the 3 layers (Index, Metadata, Reasoning) and explaining why semantic tokens + component descriptions are the real asset in an AI context.
- [The Self-Healing Design System](https://learn.thedesignsystem.guide/p/the-self-healing-design-system) — The follow-up: MCP architecture + knowledge graph + self-correcting loop for teams ready to go to the next level.

---

### Reference Figma files to duplicate

These are well-built public design systems using Variables. Useful for seeing the convention in practice before applying it.

| File | Why study it |
|---|---|
| [Habitz (official Figma)](https://www.figma.com/community/file/1298672675597243186/habitz-design-system-with-variables) | Official reference architecture, course included |
| [Get started with variables (official Figma)](https://www.figma.com/community/file/1253086684245880517/get-started-with-variables) | Playground to test without risking your own file |
| [Variable mapping guide (official Figma)](https://www.figma.com/community/file/1262724388830684966/guide-variable-mapping-and-design-system-structure) | Multi-brand / multi-product structure |

---

### Keep in mind

> "Don't build everything upfront. Just enough to test with your design and dev setup — and iterate."
> — Philipp Jeroma, Into Design Systems 2025

> "The asset is not just the code. The asset is the understanding."
> — Romina Kavcic, IDS 2026
