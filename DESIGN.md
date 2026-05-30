---
name: Technical Precision
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#ffb4ae'
  on-tertiary: '#68000a'
  tertiary-container: '#ff8a83'
  on-tertiary-container: '#860011'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
  timer-mono:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
  edge-margin: 1.25rem
  gutter: 1rem
icons:
  family: Material Symbols Outlined
  variation: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
---

## Brand & Style
The design system is engineered for high-stakes, split-second decision-making. The brand personality is authoritative, precise, and utilitarian, mimicking the professional aesthetic of high-end sports telemetry and officiating equipment.

The visual style is **Technical Modernism**. It blends a dark-mode foundation with elements of glassmorphism and brutalist precision. It prioritizes extreme legibility under stress while maintaining a "pro-tool" feel through micro-textures, subtle mesh gradients, and sharp, intentional borders. The goal is to move away from generic "flat" components toward a tactile, dashboard-inspired interface that feels as durable as a physical whistle or stopwatch.

## Colors
This design system utilizes a high-octane palette designed for high visibility in outdoor or bright stadium environments.

- **Primary (Action/Success):** A vibrant "Pitch Green" (`#4be277`) used for headings, brand mark, and affirmative states. The deeper `primary-container` (`#22c55e`) is reserved for the dominant primary action surface (Kick Off button, active nav pill).
- **Secondary (Home):** A deep "Stadium Blue" (`#0566d9` container) used as the default fill for the Home team identity circle.
- **Tertiary / Error (Away):** A "Signal Red" (`#93000a` `error-container`) used as the default fill for the Away team identity circle and for critical stop actions.
- **Neutral/Background:** A core of "Obsidian Blue" (`#0b1326`) provides the base, with tiered surface colors using increasing luminosity to show depth.

The background carries a subtle **green-tinted grid overlay** (`rgba(34, 197, 94, 0.05)`, 32px × 32px) — a "blueprint" texture that reinforces the engineering aesthetic without competing with content.

## Typography
The typography strategy is dual-layered: **Space Grotesk** provides a bold, athletic, and contemporary feel for headlines and labels, while **JetBrains Mono** is used for all numerical data and notes to ensure technical precision and fixed-width alignment (essential for timers).

All labels must use `label-caps` for a professional, "spec-sheet" appearance. Display sizes for scores and timers utilize tight letter spacing to maximize screen real estate on mobile devices.

## Iconography
Icons are drawn from the **Material Symbols Outlined** web font (filled variation, 400 weight, optical size 24). Standard icon set in use:
- `sports` — brand mark (whistle)
- `home` — home team identity
- `flag` — away team identity
- `timer` — primary nav (Setup / Match)
- `history` — match history
- `settings` — help / settings

This is a deliberate choice over generic icon sets (Lucide, Feather) — Material Symbols' filled variant pairs naturally with the bold Space Grotesk display type, and the optical-size axis keeps strokes consistent with the type hierarchy.

## Layout & Spacing
The layout follows a **Fixed Grid** model optimized for thumb-reachability. Given the high-intensity use case, all interactive targets maintain a minimum 48px hit area.

Setup-screen architecture is a four-zone vertical stack: `header` (40px top padding, brand + auth), `main` (centered, vertically justified, max-width `32rem`), `footer` (legal links + copyright), and a `fixed` bottom `nav` (80px tall, docked to the viewport bottom with safe-area inset). The 128px bottom padding on `main` reserves space for the fixed nav so content never sits beneath it.

Horizontal rhythm is maintained through an 8px base unit. Edge margins are 20px (`edge-margin`). Inter-component spacing uses the `stack-*` scale (4 / 8 / 16 / 24 px).

## Elevation & Depth
Hierarchy is established through **Tonal Layering** and **Inner Glows** rather than traditional drop shadows.

- **Base Layer:** Deepest neutral (`#0b1326`) with the green grid overlay.
- **Glass Surface Layer:** `rgba(23, 31, 51, 0.7)` background, `backdrop-filter: blur(12px)`, 1px `rgba(255,255,255,0.1)` border, and `inset 0 1px 0 rgba(255,255,255,0.05)` top highlight. This is the `.glass-panel` utility, used for team-setup cards, the bottom nav surface, and any "lifted" panel.
- **Inset Layer:** `rgba(6, 14, 32, 0.5)` background with a `rgba(75, 226, 119, 0.3)` bottom border — the `.inner-inset` treatment used for time-digit cells. The green bottom border acts as a "data underline" cueing that the value is editable telemetry.
- **Interactive Layer:** Primary-container green (`#22c55e`) color blocks with a `border-top: 1px solid rgba(255,255,255,0.2)` for a "top-light" tactile edge.
- **Active / Live State:** Elements use a `.pitch-glow` halo — `box-shadow: 0 0 16px rgba(75, 226, 119, 0.2)` (or `0 0 12px rgba(75, 226, 119, 0.3)` for tighter, smaller targets like the active nav pill). This is the consistent visual language for "this control is live and primary."

## Shapes
The design system uses **Soft** geometry (4px – 8px radius) to maintain a technical, rugged appearance without the friendliness of fully rounded pills.

- **Primary surfaces (cards, time cells, Kick Off):** `0.5rem` (`rounded-lg`)
- **Bottom nav top corners:** `0.5rem` (subtle lift from the viewport edge)
- **Team color identity circles & active nav pill:** `9999px` (true circular) — these are the only fully-round elements, reserved for identity / status surfaces, not for buttons in general

## Components

### Brand mark (header)
- `sports` material symbol (40px, primary green, 12px glow) paired with `REFCLOCK` in `headline-xl` (40px / 700 / `tracking-[0.1em]`), both in primary green.
- Sign-in/out lives in the same header row as plain text using `label-caps` styling in primary green — no border, no chip.

### Team Setup Card
- Glass-panel surface, `rounded-lg`, `padding: stack-md`.
- Left: 48×48 circular color identity (`bg-secondary-container` for Home / `bg-error-container` for Away) housing the team's material symbol icon (`home` / `flag`) in white, with `0 4px 12px rgba(0,0,0,0.4)` lift shadow.
- The whole circle is also the color picker — clicking it opens the native color input, which lives transparently overlaid on the swatch.
- Right: stacked column — `label-caps` eyebrow ("HOME TEAM" tinted secondary @ 60%, "AWAY TEAM" tinted tertiary @ 60%), then `headline-lg-mobile` (24px / 600) team-name input on a transparent background, then a 1px hairline underline (`rgba(61, 74, 61, 0.3)`).
- Hover: card border shifts to `primary @ 40%`, swatch scales to `1.05`.

### Time Display
- Two `.inner-inset` cells (96px wide, `stack-md` vertical padding, `rounded-lg`) flanking a `headline-xl` (40px) primary-container-green `:` separator.
- Each cell contains a `<input type="number">` styled as `timer-mono` (48px / 700 JetBrains Mono / `tabular-nums`) in primary green.
- Spinner controls are stripped (`-webkit-appearance: none`) — the cells should read as displays first, inputs second.

### Buttons

**Primary (Kick Off / dominant action):**
- Solid `primary-container` (`#22c55e`) with `on-primary-container` text (`#004b1e`).
- `headline-lg` (32px / 700 / uppercase / `tracking-[0.1em]`).
- `padding: stack-lg`, `rounded-lg`.
- `border-top: 1px solid rgba(255,255,255,0.2)` for tactile top-light.
- `.pitch-glow` shadow (16px green halo @ 20%).
- Hover: `filter: brightness(1.1)`. Active: `scale(0.98)`.

**Technical (glassmorphic secondary):**
- Background: `rgba(23, 31, 51, 0.7)`; `backdrop-filter: blur(12px)`; Border: 1px `rgba(255,255,255,0.1)`.

**Auth link (header):**
- No background, no border. `label-caps` in primary green. Hover dims to 80% opacity.

### Bottom Navigation
- Fixed to viewport bottom, 80px tall, with `padding-bottom: env(safe-area-inset-bottom)` for notch devices.
- Surface: `rgba(23, 31, 51, 0.9)` + 12px backdrop blur + top hairline border + top-left/right `0.5rem` radius — sits as a "rising panel" against the underlying content.
- Three slots, evenly distributed: active state, history, settings/help.
- **Inactive item:** material symbol (24px) in `on-surface-variant`. Hover → primary green.
- **Active item:** `bg-primary-container` rounded-full container around the icon, `on-primary-container` icon color, `0 0 12px rgba(75,226,119,0.3)` glow. No outer border ring — the glow alone signals state.

### Footer
- Three link items (Privacy / Delete account & data / Help) in `label-caps` separated by `stack-lg` gaps, followed by an `© YEAR REFCLOCK TELEMETRY` line in the same `label-caps` style (in `on-surface-variant`).
- The whole footer renders at `opacity: 0.6` — present but recessive, so it doesn't compete with the action surface above.
- `margin-bottom: 80px` to clear the fixed bottom nav.

### Team Zones (in-game)
- Full-bleed color containers receiving the team color from JS. A pseudo-element layers a vertical gradient on top (top white @ 8% → 40%, bottom black @ 25% from 60%) to give the flat color tactile depth.

### Event Chips
- Small, near-rectangular tags with 2px roundedness.
- `label-caps` for event titles (GOAL, CARD).
- Background: `rgba(0,0,0,0.35)` with a 2px team-color left border and a backdrop blur, so chips read against any team color underneath.

## Motion
- Transitions are short and tactile: 100–200ms for taps/hovers, 200ms for surface state changes (border colors, card scale).
- Active states use `scale(0.94)` to `scale(0.98)` depending on element size — small icons compress more than large buttons.
- The clock `.danger` state pulses at 0.8s (opacity 1 → 0.45 → 1) when time is critical.
- No continuous ambient animation. Motion only ever responds to data state (timer running, time critical) or user input.
