# Design: Anthurium Archive

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: editorial
- Shape of the first page: Split Studio (the home); index and document pages share the system and differ only in shape
- Theme: Hedgerow (hedge colourway)
- Axes: dark/high-contrast-serif/chromatic-green · posture: drenched
- Hero postures: Ledge on `/` (the lineage canvas as the field, the head at its base); Banner on `/catalog` and `/specimens`; Settled on a catalogue record; Stage on a specimen record with a photograph; app screen on `/lineage`, `/dashboard`, `/auth`, `/collection`

## Tokens
`src/app/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(24% 0.052 158);  --color-paper-2: oklch(19.5% 0.045 158);  --color-paper-3: oklch(33.5% 0.051 171); /* the project's anchor green #163f33 */
  --color-ink: oklch(93% 0.022 88);  --color-ink-2: oklch(81% 0.035 150);  --color-muted: oklch(69% 0.045 150);  --color-rule: oklch(35% 0.05 158);
  --color-accent: oklch(87% 0.19 118);  --color-accent-2: oklch(92% 0.13 118);  --color-accent-deep: oklch(46% 0.12 128);  --color-accent-ink: oklch(22% 0.05 158);  --color-focus: oklch(92% 0.13 118);
  --font-display: "Prata", "Noto Serif KR", Georgia, serif;  --font-body: "Manrope", "Noto Sans KR", ui-sans-serif, system-ui, sans-serif;  --font-outlier: "IBM Plex Mono", ui-monospace, monospace;
  --radius-card: 0;  --radius-pill: 999px;  --radius-input: 0;  --rule-hair: 1px;  --shadow-card: none;
}
```
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `tokens.css`. Korean text sets `word-break: keep-all`; Latin runs in Prata and Manrope, Hangul falls to Noto Serif KR and Noto Sans KR, loaded from Google Fonts in `layout.tsx`.

## Controls
- Primary: chartreuse fill (`--color-accent`) with `--color-accent-ink` text · pill · 48px on public pages, 40px on app screens
- Secondary: 1.5px chartreuse outline, chartreuse text · same radius and height
- Inputs: square, 1px `--color-muted` border on `--color-paper-2`, the ring in `--color-focus` as an inset outline

## Surfaces
- Hairlines in `--color-rule` between rows, `--color-muted` where sections part, a 1.5px chartreuse rule heading an index; no shadow, no gradient, radius 0 on wells, photographs and inputs
- Photographs square, true colour (sat −10, con +8, exp −8), a 1px cream ring at 8%; a caption names the plant under the frame
- The lineage canvas draws cross edges solid chartreuse at 1.4px and selection edges dashed in `--color-muted`; nodes are `--color-paper-3` wells with a `--color-rule` stroke, the selected one stroked chartreuse

## Motion
- Character: still; state only over `--dur-micro` and `--dur-short`; no reveal; under reduced motion everything ends at once (`base.css`)

## House style (waived on the record in `globals.css`)
- 39b: the lineage toolbar keeps its 40px app controls with a 44px hit target, on `/lineage` and inside the home's hero
- 71: field guide rows head themselves (a plant's name beside its Latin name and one line)
- 77 and 79: a record page or an index banner has nothing to widen or grow into the fold; the record or the list is the page

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per Hallmark's `export-formats.md`.
