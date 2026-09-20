# AC-228 — Voice command accessibility test record
Status: manual testing pending. Do not replace with invented pass results.
Environment: browser ___; OS ___; screen reader ___; date ___; commit ___.
Use real VoiceOver/NVDA, not only AccessHub's TTS simulator.
1. Tab to persistent Voice commands; expand; labeled microphone and command input.
2. Start mic: permission allow, permission deny, silence and unavailable device.
3. Say Open Cart; actual cart contents appear and destination heading gains focus.
4. Say Find Ramps; list/markers obey ramp filter and count is announced.
5. Say Call Seller on home: no call; product without phone: helpful unavailable message.
6. For a test product with a consenting test seller's phone: request call, then Cancel.
7. Confirm Call with no pending call / after 30 seconds / after changing product: no call.
8. Do not dial a real seller merely to gather evidence. Review the generated tel link using a mock.
9. Unknown or negated command must leave navigation unchanged.
10. Repeat a command; response announced again. No raw transcript in analytics.
11. Keyboard-only typed commands work without microphone support.
12. Expand/collapse, 200% zoom, narrow viewport, high contrast, route changes.
13. Android browser supporting vibration: observe success/error patterns.
14. Mac/iOS or browser without vibration: visual and spoken feedback still available; mark vibration not supported.
15. English/Sinhala/Tamil sample recognition: record actual transcripts and accuracy.
For each row: expected ___ actual ___ pass/fail/unsupported ___ screenshot/recording ___.

