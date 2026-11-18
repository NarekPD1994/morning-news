# Morning Brief app

The iPhone and Android app for Narek's Morning Brief. One codebase (Expo / React Native, TypeScript) builds both.

It reads the same daily feed as the website (`https://narekpd1994.github.io/morning-news/feed.json`). It only opens with a personal invite link from Narek's Profile → Share → People. Each person's answers, saves, reads and picture stay on their phone.

## Screens

- **Welcome**: invite lock, then four questions (name, folders, reading style, anything else). Sets a daily 8:20 reminder.
- **Today**: the day's headline, folders, category tabs and stories.
- **Story**: summary, why Narek picked it, link to the article, save and read.
- **Saved**, **Archive** (by week, with search), **Profile** (picture, answers, reminder, leave).

## Run it locally

```bash
npm install
npx expo start          # scan the QR code with a development build
npm run typecheck
```

## Store builds (invite-only)

Builds run in Expo's cloud (EAS). No Mac is needed, except once for the first iPhone signing setup.

- iPhone: TestFlight, with testers added by email in App Store Connect.
- Android: Google Play **internal testing**, with testers added by email in Play Console.

See `../.github/workflows/app-build.yml`. It needs the repository secret `EXPO_TOKEN`.

Identifiers: `io.github.narekpd1994.morningbrief` (both platforms).
