# AC-156 — Search contract
Supported domains: places, products and jobs. Extract keywords, category, town/area,
minimum/maximum LKR price and accessibility feature IDs. Missing fields stay null.
Unknown, contradictory or incomplete queries request clarification.
No generated query may execute SQL or application actions.
Example: “Find wheelchair-accessible cafés near Kandy” =>
places, café, Kandy, wheelchair_ramp; price unspecified.
Feature requirements use ALL semantics. Unknown venue features do not count as present.
Place names/features are not guarantees of accessibility; evidence must come from place records.
No audio, profile, precise GPS coordinates or conversation history is submitted for interpretation.

