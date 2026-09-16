# AC-154 — Multilingual Speech Recognition Test Samples

## Purpose

These samples are used to manually test AccessHub multilingual voice recognition for English, Sinhala and Tamil.

The application supports:

- English — `en-LK`
- Sinhala — `si-LK`
- Tamil — `ta-LK`

---

## English Samples

### EN-01

Expected phrase:

Find accessible places in Colombo

Locale:

en-LK

### EN-02

Expected phrase:

Show wheelchair accessible places near me

Locale:

en-LK

### EN-03

Expected phrase:

Find accessible jobs

Locale:

en-LK

### EN-04

Expected phrase:

Open the marketplace

Locale:

en-LK

### EN-05

Expected phrase:

Show accessible services in Colombo

Locale:

en-LK

---

## Sinhala Samples

### SI-01

Expected phrase:

කොළඹ ප්‍රවේශ පහසුකම් ඇති ස්ථාන සොයන්න

Locale:

si-LK

### SI-02

Expected phrase:

මට ළඟම ඇති ස්ථාන පෙන්වන්න

Locale:

si-LK

### SI-03

Expected phrase:

රෝද පුටු ප්‍රවේශය ඇති ස්ථාන සොයන්න

Locale:

si-LK

### SI-04

Expected phrase:

රැකියා පෙන්වන්න

Locale:

si-LK

### SI-05

Expected phrase:

වෙළඳපොළ විවෘත කරන්න

Locale:

si-LK

---

## Tamil Samples

### TA-01

Expected phrase:

கொழும்பில் அணுகக்கூடிய இடங்களைக் கண்டுபிடி

Locale:

ta-LK

### TA-02

Expected phrase:

எனக்கு அருகிலுள்ள இடங்களைக் காட்டு

Locale:

ta-LK

### TA-03

Expected phrase:

சக்கர நாற்காலி வசதியுள்ள இடங்களைக் காட்டு

Locale:

ta-LK

### TA-04

Expected phrase:

வேலைகளைக் காட்டு

Locale:

ta-LK

### TA-05

Expected phrase:

சந்தையைத் திற

Locale:

ta-LK

---

## Manual Testing Procedure

1. Start the Vite application using `npm run dev`.
2. Open the AI Assistant.
3. Select the required language.
4. Press the microphone button.
5. Read the matching test phrase.
6. Stop recording if required.
7. Compare the displayed transcript with the expected phrase.
8. Record the actual transcript during AC-155 testing.

## Notes

Test results must not be invented.

Actual microphone recognition results must be recorded during AC-155.