# Maddie Journey — Phase 9 Contextual Employee Reader QA

**Release:** v3.6 · **Status:** 113 automated smoke tests passed; rendered-device and screen-reader verification outstanding.

**Non-negotiable:** 51 fictional employee records, eight divisions, 13 read-only routes. No accounts, input/edit forms, approval actions or live connected HR sources.

## Core workflow acceptance

| Source → employee preview | Expected behavior |
| --- | --- |
| People Directory search + sort | Opens only matching employees, retains query/sort and active detail while using Previous/Next; closing restores the result list |
| Division Summary/Board/List | Browses only that division's employees; View division enters its employee List with the selected record highlighted |
| Dashboard attention queue | Opening a category signal shows its recorded reason, and Previous/Next remains within the displayed category, honoring collapsed/Show all view |
| Journey / Kit / KPI / Review | Opening a detail preserves the selected tab and shows fictional source boundaries; no status is upgraded to externally verified |
| 201 Files — Missing | Reader shows current employee's exact recorded missing document names, only browses the 12 visible people until Show all expands the list |
| 201 Files — Not checked / Complete / All | Browse only currently displayed people and keep explicit N/A, missing, unchecked and complete distinctions |
| Three-month Calendar | A dated event opens with its specific sample date/title. Previous/Next cannot silently jump to people from unrelated dates |
| Return via Back | Same route, same filters, same visible list; original action receives keyboard focus, and prior page/horizontal region scroll positions are restored |
| Close / Escape / backdrop | Same closing contract as Back, no fixture mutation and no unauthorized write operation |
| Employee tablist | Nine labelled tabs use tablist/tab/tabpanel, aria-selected, active tab keyboard focus and Left/Right arrow navigation |

## Evidence requirements

Each tab carries a readable source note. KPI weights are computed from fictional scores, not official reports. Attendance verification means a demo flag only; pending entries stay separate. 201 Files status is synthetic and does not confirm an official document exists. Calendar milestones can be calculated examples and are not booked meetings. Reviews do not have a verified audit trail or action buttons. Source providers remain disconnected.

## Manual accessibility and responsive checks

Inspect at 320×568, 375×667, 390×844, 768×1024, 1024×768, 1440×900 and 1920×1080; both appearance themes; Compact and Comfortable modes; 200% zoom and mobile landscape. Confirm source label, record cue, Back/View division, and Previous/Next stay visible without overlap or unintentional page-width scroll.

Keyboard: Tab to an employee action; Enter to open; use Left/Right arrows on tablist; use Previous/Next; press Escape; check focus returns to exactly the triggering action. Repeat with a long document name, with Calendar date selection, within a horizontally scrolled table and with the dashboard's filtered attention list. Verify no focus drops behind the modal.

Screen readers: validate that Back to source has a meaningful accessible name, tabs announce their selected state, the tabpanel is labelled by its active tab, provenance is readable, and record cue updates are not excessively repeated during Previous/Next.

Record any rendering, zoom, focus or accessibility defects by browser, device, severity and remediation commit. Automated source checks cannot establish that these rendered behaviors have passed.
