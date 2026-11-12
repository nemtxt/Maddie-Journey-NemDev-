# Maddie Journey — Icon System

**Release:** v3.4.2  
**Implementation:** `icons.js` loaded before `monitoring.js` and `app.js`.  
**Visual contract:** One Inter font, neutral-first black/white surfaces, restrained pastel category tints and pink interactive emphasis.

## Source of truth

`window.MJ_ICONS.svg(name)` returns static, self-contained inline SVG markup. There are 39 named icons covering navigation, people, documents, status, calendar, filters and directional controls. Their shared baseline is a `24×24` viewBox, 1.8px stroke, round line caps and joins, transparent fill and `currentColor`. Each icon has `class="ui-icon"`, `aria-hidden="true"` and `focusable="false"`.

No emoji, symbol font, external image host, third-party icon CDN, dynamic SVG from fixture content or external fetch is needed. Unknown icon keys resolve to the static circle-help icon; if the entire local icon script is missing, its callers return no markup rather than blocking the app.

## Usage standards

- **Action buttons:** Always provide adjacent visible text or an explanatory `aria-label`; never rely on a pictogram to reveal behavior.
- **Navigation:** Reuse icons from the single vocabulary. The five primary sidebar entries use grid, users, list, chart and database. Active/current state must also be visible by typography, background and `aria-current`.
- **Statuses:** A check, clock, alert-circle or minus can assist a label, but explicit words (Complete, Not checked, Missing, N/A) remain mandatory.
- **Calendar:** Event type and date navigation retain text, with icons only for affordance. Fictional provenance remains visible.
- **Controls:** Close, Previous/Next, dropdown and drilldown controls share the same outlined icon weight and sizing. Avoid Unicode pictograms in HTML strings and CSS `content`.
- **Styling:** `mono.css` is the authoritative icon styling source. Default `.ui-icon` is 1.15rem; scoped contexts render ~13–20px. Focus styling belongs to the owning interactive element, not the SVG.

## Acceptance

Review at 320px, 375px, 768px, 1024px and 1440px; both appearances; 200% zoom; keyboard-only; reduced motion; screen readers and Windows forced-colors. Check no icon overlaps text, no emoji fallback occurs, no button loses its accessible name, and data rows remain readable. Verify that the app works when `icons.js` is blocked. Source-level smoke tests cannot replace rendered-device QA.

No data, authentication, editing or remote integration is introduced by the icon system.
