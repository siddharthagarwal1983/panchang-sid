# Panchang — mobile app for Indians in the US

A mobile-first, installable web app that shows today's panchang for your US city, upcoming Hindu festivals and vrats, and reminders — all computed on the device, no login, no API keys.

## Screens

```text
┌─ Today ──────────┐  ┌─ Calendar ───────┐  ┌─ Reminders ──────┐
│ City ▾  Date ▾   │  │ Month grid with  │  │ Toggles:         │
│ Tithi / Paksha   │  │ tithi + festival │  │ Ekadashi         │
│ Nakshatra        │  │ dots             │  │ Purnima/Amavasya │
│ Yoga · Karana    │  │ Tap day → detail │  │ Sankashti        │
│ Vaara · Masa     │  │ Festival list    │  │ Festivals        │
│ Sunrise/Sunset   │  │ below            │  │ Time-of-day pick │
│ Moonrise/set     │  └──────────────────┘  └──────────────────┘
│ Rahu/Yama/Gulika │
│ Abhijit muhurta  │   Bottom tab bar across all three
└──────────────────┘
```

- **Today**: primary screen at `/`. Big tithi card, then nakshatra/yoga/karana, sun & moon timings, and inauspicious/auspicious time windows shown as a timeline strip. Date stepper to move back/forward a day.
- **Calendar** (`/calendar`): month view with tithi numbers and festival markers; tapping a date opens that day's full panchang.
- **Reminders** (`/reminders`): choose which recurring observances you care about and what time of day to be alerted; the app lists the next occurrences and, if you grant permission, fires a browser notification while the app is open or installed.
- **Settings** (`/settings`): US city selection, 12/24-hour time, festival tradition preference (North Indian purnimanta vs South Indian amanta month naming), light/dark.

## Data and calculations

Everything is computed locally with `astronomy-engine` (pure JS, no keys, works offline):

- Sun/moon longitudes → tithi, nakshatra, yoga, karana, plus the exact end-time of each (the part people actually need for vrats).
- Sunrise/sunset/moonrise/moonset from the city's latitude/longitude.
- Rahu kalam, Yamaganda, Gulika kalam, Abhijit muhurta derived from the sunrise-to-sunset span and weekday.
- Vikram Samvat year, lunar month (amanta and purnimanta), paksha, ritu.
- Festival rules encoded as tithi+month conditions (Diwali, Holi, Navratri, Janmashtami, Ganesh Chaturthi, Raksha Bandhan, Mahashivratri, Ram Navami, Ekadashis, Purnima/Amavasya, Sankashti/Vinayaka Chaturthi, Karva Chauth, Makar Sankranti, Pongal, Ugadi/Gudi Padwa) and resolved against the computed calendar, so festival dates land on the correct *US* day rather than the India date.

## Locations

A bundled list of ~40 US metros with large Indian communities (Bay Area, NYC/NJ, Dallas, Houston, Chicago, Atlanta, Seattle, Boston, Phoenix, Charlotte, Raleigh, Detroit, Philadelphia, etc.), each with coordinates and IANA timezone. Searchable picker in a bottom sheet. Selection persists on the device.

## Storage

Local device storage only — city, reminder toggles, and display preferences. No backend, no accounts.

## Design direction

Not generic dashboard UI. A warm, print-inspired look: deep indigo night background with saffron/marigold accents and a brass-gold hairline system, a serif display face for tithi/nakshatra names paired with a clean sans for numerals and times, subtle moon-phase artwork keyed to the current tithi. Card corners and dividers echo temple-almanac panchangam sheets. Tokens are defined in `src/styles.css`; no hardcoded colors in components.

## Technical notes

- TanStack Start routes: `index.tsx` (Today), `calendar.tsx`, `reminders.tsx`, `settings.tsx`, with a bottom tab bar in `__root.tsx`. Each route gets its own SEO head metadata.
- Panchang math lives in pure, testable modules under `src/lib/panchang/` (`astro.ts`, `tithi.ts`, `muhurta.ts`, `festivals.ts`), decoupled from React.
- All time math is timezone-aware via the city's IANA zone so a US user never sees India-shifted dates.
- Installable via a web manifest and app icons so it can be added to the iOS/Android home screen and open full-screen. Offline caching is not included unless you want it later.
- Reminders use the browser Notification API scheduled while the app is running; true background push would need a backend and accounts, which this version intentionally skips.

## Accuracy caveat

Computed panchang can differ by a few minutes from published almanacs (Drik vs Vakya traditions, ayanamsa choice). I'll use the Lahiri ayanamsa and Drik-style calculations, which match most widely used panchangs, and note the reference in Settings.
