# AC-201 — Missing verification behaviour

Expected result when verification is absent or unavailable:

- The place-details panel stays open and all published accessibility information remains usable.
- It says “Verification unavailable”; it never converts missing data into a zero rating or verified badge.
- It advises the visitor to contact the venue before travelling.
- Malformed Community Hub payloads are rejected and the server falls back to the directory summary.
- Malformed client API responses are rejected instead of rendering misleading verification data.
