# AC-184 — Place Search and Keyboard Testing

Tester: Barana Subasinghe

Date:

Browser:

Operating System:

---

## Functional Search Tests

| Test | Action | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| S01 | Search Colombo Fort | Autocomplete suggestions appear | | |
| S02 | Select suggestion | Map moves to selected location | | |
| S03 | Search Kandy | Map moves and accessible places are sorted by distance | | |
| S04 | Select My Location | Browser requests location permission | | |
| S05 | Allow location | Map moves to current location | | |
| S06 | Deny location | Accessible error message appears | | |
| S07 | Submit empty search | Validation message appears | | |
| S08 | Enter one character | Validation message appears | | |

---

## Keyboard Tests

| Test | Action | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| K01 | Press Tab | Search field receives focus | | |
| K02 | Type location | Suggestions appear | | |
| K03 | Press Arrow Down | Next suggestion is selected | | |
| K04 | Press Arrow Up | Previous suggestion is selected | | |
| K05 | Press Enter | Selected suggestion opens | | |
| K06 | Press Escape | Active suggestion selection closes/resets | | |
| K07 | Tab to My Location | Button receives visible focus | | |
| K08 | Activate button with keyboard | Location detection starts | | |

---

## Accessibility Checks

- Search input has a visible label.
- Search form uses `role="search"`.
- Suggestions use `role="listbox"`.
- Suggestions use `role="option"`.
- Active option is exposed using `aria-activedescendant`.
- Loading information uses `role="status"`.
- Errors use `role="alert"`.
- Current-location button has an accessible name.
- Keyboard-only interaction is supported.

---

## Result

Complete this section after actual testing.

Passed:

Failed:

Issues found:

Fixes applied:

Final result: