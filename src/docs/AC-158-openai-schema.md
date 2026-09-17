# Structured OpenAI integration
Uses POST /v1/responses and text.format with json_schema, strict:true.
Every property is required; absent entities are null; additionalProperties:false.
Validate again locally; rejected/refused/incomplete/timeout responses use AC-161 fallback.
Official source: https://developers.openai.com/api/docs/guides/structured-outputs
The model is configured server-side through OPENAI_MODEL, with no hard-coded paid default.
Provider responses have not been tested with paid credentials. Mock tests do not prove live model accuracy.

