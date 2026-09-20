# AC-190 — Browser and database evidence (pending real execution)
Run node --test tests/AC-190.test.mjs and npm run build.
Record browser, date, commit and observed result for:
1. Select ramp: only matching list entries and markers remain.
2. Add parking: ALL conditions must match.
3. Add Braille: zero results, no stale selected-place details.
4. Clear filters: controls remain usable and results return.
5. Search by address, apply filters, use My location; distance order remains stable.
6. Toggle filters quickly; older network response must not replace new results.
7. Keyboard Tab/Space; visible focus; VoiceOver announces result count.
8. Without Google key, local filters and list remain usable.
9. Apply migration to a test database; confirm anon SELECT returns only published rows and anon writes fail.
Automated JS tests do not prove browser, screen-reader or deployed SQL behaviour.
Actual results / screenshots / commit: PENDING.

