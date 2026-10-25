# Our Space UI system

Source: nextlevelbuilder/ui-ux-pro-max-skill; reviewed 2026-10-16. Supersedes the prior flat-minimalism direction (same date) — this is a deliberate, user-authorized pivot to glassmorphism.

## Direction
A private journal for two people. Modern **glassmorphism**, kept minimal and restrained — not skeuomorphic, not decorative-heavy. Flat Apple-style opacity is retired for content cards; the existing frosted treatment (previously reserved for navigation/overlays) now extends to top-level content cards too, using the project's own existing glass tokens — do not invent a parallel token set. The search engine's generic landing-page/IoT-dashboard pattern (Real-Time/Operations Landing, dark-tech-green accent) is unsuitable for this authenticated dashboard and is explicitly rejected; retain the existing app navigation/layout as the repository-specific source of truth. Use the system sans-serif stack for all typography, including Vietnamese; titles use 600 weight and tighter tracking. **Monochrome update (2026-10-16): the blue brand accent is retired.** The accent is ink — #1D1D1F fills with white text in light mode, #F5F5F7 fills with #1D1D1F text in dark mode — with light, dark and system appearance modes — do not impose the auto-generated dark-tech palette, accent color, or any other suggested palette/font. There is no accent/theme picker, and saved legacy accent preferences are ignored.

Reference recipe (from the skill's `glassmorphism` style entry, `--domain style`): frosted glass, translucent white rgba(255,255,255,0.1–0.3), backdrop blur 10–20px, subtle 1px light border, layered depth; accessibility risk flagged as **conditional** — contrast, keyboard, visible focus and reduced-motion must all be explicitly verified, not assumed. This project's existing glass implementation already sits inside that recipe's range; extend it rather than replacing it.

## Color roles
- Canvas: #F2F2F4 light / #050506 dark, with soft greyscale light pools (`.glass-canvas`) so blur has something to refract. No hue anywhere in the chrome.
- Tonal states (`surface-hover`, `surface-selected`, `primary-subtle`, `primary-border`, `accent`) are translucent ink (`color-mix` of foreground), so they tint whatever glass layer they sit on.
- Selected pills on glass bars use `.glass-selected`; nested chips use `.glass-chip` (solid tint, no blur).
- Quiet surface (now glass, see below): was #FAFAFC light / #161617 dark opaque — becomes a translucent variant of the same hue at 60–72% alpha light / 42–50% alpha dark.
- Elevated surface (dialogs/sheets, already glass): #FFFFFF light / #1C1C1E dark base, same alpha family as `.glass-dialog`.
- Primary text: #1D1D1F light / #F5F5F7 dark — unchanged; text color never depends on the blur behind it.
- Secondary text: starts at #515154 light / #C7C7CC dark; adjusted for contrast.
- Border: use `--glass-border` (contrast-tuned per theme) for any glass surface; use #D2D2D7 light / #424245 dark for flat (non-glass) surfaces; input boundaries independently meet 3:1.

Use `primary` for button fills and `primary-ink` for colored text/icons. The palette generator adjusts primary, muted, secondary and accent text across all supported neutral surfaces, for the monochrome ink accent. Normal text and button labels must meet 4.5:1, including composited controls over both neutral canvases **and over the new translucent card background's worst-case backdrop**. Do not reduce informational text opacity or reuse a dark button fill as text in dark mode.

## Glass elevation levels
Reuse the existing tokens/classes exactly — do not create a second blur/alpha system:

| Level | Surface | Class | Treatment |
|---|---|---|---|
| L0 | Canvas | — | Opaque, no blur. |
| L1 | Content card (**new**) | `.app-card` / `.soft-panel` / `.material-section` | Was opaque; now blur(10–14px) saturate(110–120%), translucent `--glass-surface`, `--glass-border`, `--glass-shadow`. |
| L2 | Navigation / sidebar | `.glass-navigation` | Unchanged: blur(24px) saturate(145%). |
| L3 | Dialog / Sheet | `.glass-dialog` | Unchanged: blur(24px) saturate(135%). |
| L4 | Hero / quote overlay | `.glass-photo-surface` | Unchanged: blur(20px) saturate(120%). |
| — | Scrims | `.glass-scrim` | Unchanged: blur(10px) saturate(90%). |
| — | Form fields | `.glass-input` / `.glass-field` | Stay near-opaque — inputs do not go translucent. |

Motion timing unchanged: `--motion-enter` / `--motion-exit` / `--motion-ease`.

## Layout and components
Desktop: sidebar | shared welcome + period control / quiet quote / section heading + action / content grid.
Mobile: shared photo / quiet quote / section heading + period control / content / fixed navigation. Reading opens a sheet; desktop opens a centered dialog.

One outer content layer, now glass: no nested decorative glass panels inside an already-glass card (**anti-pattern carried forward unchanged** — a stat row or icon chip inside `.app-card` stays solid `bg-surface`/`bg-muted`, never a second blur layer). The existing `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` fallback block must keep mapping every glass class — including the newly-glass `.app-card`/`.soft-panel`/`.material-section` — back to opaque `--theme-surface-elevated`; this fallback is mandatory, not optional. Use 24px cards, 12px controls, 24px dialogs; consistent 4/8px spacing. Form labels stay above fields, controls are at least 44px tall, mobile input text is 16px. The dialog owns its single close control, even when its title is visually hidden.

Notes show at most three preview lines and read in a separate dialog. Unread notes the user received (`read_at` null, set via the `mark_note_read` RPC) render as a CSS envelope card of the same size — a deliberate, decorative exception for new letters; opening one plays a short seal/flap/letter intro in the reader (skippable, removed under reduced motion). User emoji avatars and user-authored content remain; structural icons use Lucide. Read and edit dialogs use the same 360ms entrance / 220ms exit with opacity, translate and scale. Animate scrim opacity, tint and blur together. Keep detail content mounted during exit with `useDialogPresence`; defer initially-open dialog mounting by one effect so the first entrance also animates. Reduced motion suppresses spatial movement and is independent of the blur change — `prefers-reduced-motion` behavior is unaffected by this pivot.

## Anti-patterns to avoid
- Glass-on-glass stacking (max one visible blur layer per screen region).
- Glass on text, form fields, or buttons — these stay on solid/opaque fills for legibility and touch accuracy.
- Any backdrop-filter without the `@supports` opaque fallback.
- Decorative gradients beyond the glass highlight already defined in `--glass-highlight`.
- The skill's generic landing-page accent palette, pattern, or dark-tech color scheme.

## Verification
Run `npm run test:contrast`, `npm run typecheck`, `npm run lint`, `npm run build`. Inspect light/dark layouts at 375, 768 and desktop widths. Confirm one movie close button, Escape, focus return, no horizontal overflow, visible labels and 3-line note previews. Additionally: force-disable `backdrop-filter` (DevTools) and confirm every glass surface still renders as a legible, opaque card; confirm no card is nested inside another glass surface. Synthetic layout fixtures must not ship.
