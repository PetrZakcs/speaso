# E2E tests (Maestro)

Flows run against the app in **Expo Go on the iOS simulator**.

```bash
# one-time setup
brew install openjdk@17
brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro
export JAVA_HOME=/opt/homebrew/opt/openjdk@17   # add to your shell profile

# each run
npx expo start --port 8081        # terminal 1, keep running
npm run e2e                       # terminal 2 (simulator must be booted)
```

| Flow | Covers |
| --- | --- |
| `01-onboarding` | fresh install → 4 onboarding steps → home recommendation |
| `02-exercise-rating` | exercise steps → finish → rating with note → streak, panic, journal in Progress |
| `03-situation` | free situation end-to-end (prep, phrases with recorder, challenge); Premium situation → paywall |
| `04-tools-and-limit` | reading practice + recorder, metronome, 5 free sessions → 6th opens the limit paywall |

Notes
- Texts are Czech — the simulator language must be Czech (`cs-CZ`).
- `subflows/open-app.yaml` dismisses Expo Go's own first-run notification prompt and developer-menu intro.
- In Maestro, `label:` only names a step in the log; use `text:` (matches accessibility labels too).
