# AC-169 — Voice results keyboard and screen-reader evidence

Status: manual evidence pending. Record real results; do not mark unperformed checks as passed.

Environment: browser ___; OS ___; screen reader ___; date ___; commit ___.

1. Open the AI assistant by keyboard and select the voice tab.
2. Type a product query, activate Use transcript, and confirm focus moves to the Search results heading.
3. Confirm interpreted filters and result count are announced once.
4. Tab through each result in visual order. Every Open details control must have a visible focus indicator.
5. Submit a query with no results. Confirm the no-result heading and suggestion are available to the screen reader.
6. Submit a place/location query. Confirm focus moves to the Places Directory and the filter is retained.
7. Start a slow request, then close/change the query. Confirm stale results are not announced.
8. Repeat at 200% zoom and a 320 CSS-pixel viewport without horizontal page scrolling.

Evidence links/screenshots: ___
