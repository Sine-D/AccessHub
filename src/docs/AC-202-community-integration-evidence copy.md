# AC-202 — Community verification integration evidence

Automated evidence:

- Matching contract-v1 payload is accepted.
- A mismatched place ID and out-of-range rating are rejected.
- A successful Community Hub response is mapped into the place-details summary.
- Network errors and malformed responses preserve the directory fallback.
- Missing information is announced as unavailable, not verified.

Run: `node --test tests/AC-202.test.mjs`

Manual evidence to attach to Jira before moving AC-202 to Done:

- Screenshot of a place showing rating, badge and last-verified date.
- Screenshot of a place with verification unavailable.
- Network log or teammate-confirmed staging response using the shared place ID.
- Tester name, browser, date and result.
