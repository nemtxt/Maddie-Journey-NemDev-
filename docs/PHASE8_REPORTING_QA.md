# Maddie Journey — Phase 8 Report Density & Table QA

**Release:** v3.5  
**Status:** 104 automated smoke tests passed. Rendered browser, physical-device, and assistive-technology acceptance remain outstanding.  
**Data boundary:** 51 fictional employees, eight sample divisions, 13 read-only monitoring sections. No editor, login or connected provider.

## Operational checks

| Workflow | Required result |
| --- | --- |
| Dashboard → Compact rows | Toggles `aria-pressed` to true and uses compact row-spacing only; all overview numbers remain unchanged |
| Switch route / refresh | Compact preference survives route changes and reloads through local storage |
| Second toggle | Comfortable spacing is restored; `aria-pressed` becomes false |
| Phone viewport | Minimum 44px touch controls remain, even when Compact is selected; tables can be scrolled horizontally by keyboard |
| Landing | Continues to fit one viewport, without the density toggle or additional scroll |
| Directory | Table caption describes visible and selected fictional people; headings have column scopes; 51 rows remain available with no query |
| Directory percentages | Journey percentage matches completed/possible tasks; Kit percentage matches completed/possible requirements; KPI percentage is weighted demo score |
| Directory empty query | No matches is identified as a filter result, not as an absence of provider data |
| Journey | First-incomplete-stage grouping, 8 stage buckets, task denominator and stage count still reconcile; table caption describes selected people |
| Attendance | Verified and pending events remain separate; no attendance entries does not imply perfect attendance; period counts match fictional entries |
| KPI | Raw, weight, contribution and weighted-total figures reconcile; numeric columns are visually aligned |
| Reviews | 4 configured review-step statuses, dates and sample notes stay unchanged; missing dates remain Not recorded |
| 201 Files | Missing/Not checked/Complete groups total 51; per-document N/A is excluded from applicable denominators; shown/filtered counts are distinct |
| Calendar | Existing 3-month date views and category legends are unaffected by the table density preference |
| Source status | Not connected and fictional-sample claims remain explicit, never upgraded to verified or synced |

## Visual acceptance grid

Test both Comfortable and Compact, with 320×568, 375×667, 390×844, 768×1024, 1024×768, 1440×900 and 1920×1080 viewports. Review the light/dark pastel palette, 200% browser zoom, mobile landscape, long document names, numeric alignment, truncated content, and focus outlines. Confirm scrolling is limited to the workspace or the intended data region, never an unintended page-width overflow.

Keyboard-only test: use Tab to reach the Compact rows toggle, activate with Space/Enter, navigate to Directory/Journey/201 Files, and move to any horizontally scrollable table using its region focus. Test the employee preview dialogs and restore focus. With reduced motion, screen content must remain immediate and readable.

Screen-reader test: confirm the button exposes its stable name and pressed state, data tables expose header/row relationships and captions, and "No attendance entries" is not announced as "perfect attendance." Do not infer the result from markup inspection alone.

**Important:** No actual device screenshot, timing metric, frame-rate benchmark, zoom test or live provider integration has been performed or claimed in this phase. Record browser/device, viewport, result and any defect with its remediation commit during manual acceptance.
