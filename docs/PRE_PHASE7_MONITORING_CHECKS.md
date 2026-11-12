# Pre-Phase-7 QA — 201 Files Checklist and Calendar

**Release:** v3.3.1 · **Scope:** Additive read-only monitoring features.  
**Status:** Automated structural and behavioral checks run; physical-device and screen-reader visual acceptance remain to be completed.

## 201 Files Checklist

| Check | Acceptance |
| --- | --- |
| Employee coverage | Exactly 51 fictional employees across eight divisions; no 49-person screenshot counts imported |
| Requirement catalog | Nine clearly named example document types; no official Drive or tracker claim |
| Person status | Missing takes priority over Not checked; otherwise Complete; categories sum to 51 |
| Document counts | Complete + Missing + Not checked + N/A equals 51 per document |
| Applicable denominator | Document card uses 51 minus N/A when displaying completed/applicable records |
| Named gaps | Every missing person shows their specific Missing documents, not generic tasks |
| Scope controls | Filters and Show all only affect presentation, never source state |
| Employee reader | 201 Files detail tab shows all nine statuses with no upload or edit controls |
| Quality checks | Invalid or missing per-employee status data fails adapter validation |
| Source integrity | Fixture and copied snapshot remain unchanged after all UI interactions |

## Three-month Calendar

| Check | Acceptance |
| --- | --- |
| Initial range | Three consecutive months starting in current Asia/Manila month |
| Month navigation | Previous/Next moves by exactly three months; Today restores current month |
| Day layout | Correct weekday alignment and days per month, including Feb 28/29 as applicable |
| Event provenance | Computed 3rd/5th-month and 6th-month dates, birthdays, anniversaries, and explicit sample promotions |
| Event filtering | Category filters preserve source event counts, do not mutate records |
| Event preview | Day selection and employee preview links open the existing read-only employee dialog |
| Unverified sources | No PIP/LIP schedule, official calendar sync, file verification or actual booked meetings implied |
| Phone responsiveness | Three months stack at phone widths without losing weekday/date cells |
| Accessibility | Keyboard-operable event-day buttons, labelled date counts, visible focus and minimum 44px touch height on narrow phones |

## Cross-device visual matrix

- 320×568: single calendar month per row, responsive 201 document cards, scrollable name/document table.
- 375×667 and 390×844: touch targets and calendar overflow; confirm no page-level sideways scroll.
- 768×1024: two-column calendar, two-column 201 document grid, accessible month navigation.
- 1024×768: two-column calendar, no clipped date or employee labels.
- 1440×900 and 1920×1080: three-month calendar side by side, consistent dashboard spacing, one font and one accent.
- Light/dark, reduced motion, 200% zoom, keyboard-only, and screen-reader checks.

**Important:** These are not official trackers. Source records remain fictional and disconnected. Screenshot references were used for information architecture only, not as authoritative employee data.
