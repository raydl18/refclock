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
    fontWeight: '600'
    lineHeight: 36px
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
---

## Brand & Style
The design system is engineered for high-stakes, split-second decision-making. The brand personality is authoritative, precise, and utilitarian, mimicking the professional aesthetic of high-end sports telemetry and officiating equipment. 

The visual style is **Technical Modernism**. It blends a dark-mode foundation with elements of glassmorphism and brutalist precision. It prioritizes extreme legibility under stress while maintaining a "pro-tool" feel through micro-textures, subtle mesh gradients, and sharp, intentional borders. The goal is to move away from generic "flat" components toward a tactile, dashboard-inspired interface that feels as durable as a physical whistle or stopwatch.

## Colors
This design system utilizes a high-octane palette designed for high visibility in outdoor or bright stadium environments. 

- **Primary (Action/Success):** A vibrant "Pitch Green" used for start actions and affirmative states.
- **Secondary (Home):** A deep "Stadium Blue" refined with a slight violet undertone to prevent screen bleed.
- **Tertiary (Away/Warning):** A "Signal Red" used for opposing team tracking and critical stop actions.
- **Neutral/Background:** A core of "Obsidian Blue" (#0F172A) provides the base, with tiered surface colors using increasing luminosity to show depth.

Gradients should be used sparingly but effectively: a subtle 10% radial overlay on large color blocks adds a "lens" effect, making the interface feel like a premium glass panel.

## Typography
The typography strategy is dual-layered: **Space Grotesk** provides a bold, athletic, and contemporary feel for headlines and labels, while **JetBrains Mono** is used for all numerical data and notes to ensure technical precision and fixed-width alignment (essential for timers).

All labels must use `label-caps` for a professional, "spec-sheet" appearance. Display sizes for scores and timers utilize tight letter spacing to maximize screen real estate on mobile devices.

## Layout & Spacing
The layout follows a **Fixed Grid** model optimized for thumb-reachability. Given the high-intensity use case, all interactive targets maintain a minimum 48px hit area.

The "Referee Column" (center) acts as the anchor, with a 4-column span on mobile, while the Team Zones (Home/Away) utilize the outer columns. Horizontal rhythm is maintained through an 8px base unit. Margins are kept tight (20px) to allow the primary data—the clock and score—to dominate the viewport.

## Elevation & Depth
Hierarchy is established through **Tonal Layering** and **Inner Glows** rather than traditional drop shadows.

- **Base Layer:** Deepest neutral (#0F172A).
- **Surface Layer:** 1px solid border (#FFFFFF, 10% opacity) with a subtle background blur (8px).
- **Interactive Layer:** High-contrast color blocks with a "top-light" effect—a 1px inner stroke on the top edge at 20% opacity to simulate a physical edge catching light.
- **Active State:** Elements use a "Glow" effect, utilizing a 0px blur, 4px spread shadow of the element's primary color at 30% opacity to indicate the "Live" state.

## Shapes
The design system uses **Soft** geometry (4px - 8px radius) to maintain a technical, rugged appearance without the friendliness of fully rounded pills. 

Buttons and input fields use the base `0.25rem` radius. Large score containers or "Team Zones" use `rounded-lg` (0.5rem) to create a distinct container feel that separates the teams from the central technical clock area.

## Components
- **Buttons (Primary):** Solid "Pitch Green" with black `Space Grotesk` caps. Use a 1px inner-top border for a tactile feel.
- **Buttons (Technical):** Glassmorphic style. Background: Neutral 20% opacity; Backdrop Blur: 12px; Border: 1px solid Neutral 30%.
- **Team Zones:** Full-bleed color containers. Use a vertical linear gradient (Color 100% to Color 80%) to add subtle depth.
- **Input Fields:** Inset appearance. Darker background than the surface, 1px bottom-border highlight in Primary Green when focused. Use `JetBrains Mono` for typed text.
- **Event Chips:** Small, rectangular tags with 2px roundedness. Use `label-caps` for event titles (GOAL, CARD).
- **The Whistle (Action Trigger):** A floating action button (FAB) style for the "Kick Off/End" action, using a heavy border and high-contrast typography to ensure it is the most prominent element on screen.