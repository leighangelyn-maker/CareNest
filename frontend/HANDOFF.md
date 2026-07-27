# CareNest React Native — Handoff Brief

## What this is
A full React Native + TypeScript port of the CareNest web prototype (React + Vite + Tailwind).
The entire Family flow is implemented: Welcome → Role → Register/Login → Home (search + filter) → Worker Profile → Book → Pay → Confirm → Bookings → Booking Detail → Review → Messages → Account.

## Stack
| Layer | Choice |
|---|---|
| Runtime | Expo SDK 51 (managed workflow) |
| Language | TypeScript (strict) |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| State | React Context (`BookingContext`) |
| Fonts | `@expo-google-fonts/inter` + `@expo-google-fonts/space-mono` |
| Icons | `react-native-svg` (inline, no icon library dependency) |
| Styling | `StyleSheet.create` only — no Tailwind, no styled-components |

## File map
```
App.tsx                          ← Root: font loading, navigation container, providers
src/
  theme.ts                       ← Design tokens (maps 1:1 to CSS vars in the web prototype)
  types.ts                       ← Worker, Booking, RootStackParamList, MainTabParamList
  data.ts                        ← WORKERS array, INITIAL_BOOKINGS, CATS
  BookingContext.tsx             ← Global booking state (cancel, markReviewed)
  components/
    atoms.tsx                    ← All shared UI atoms (Btn, Avatar, Verified, Row, etc.)
  screens/
    WelcomeScreen.tsx
    RoleScreen.tsx
    WorkerNoteScreen.tsx
    RegisterScreen.tsx
    LoginScreen.tsx
    HomeScreen.tsx               ← Category filter + FlatList of workers
    ProfileScreen.tsx            ← Worker hero, stats strip, skills, reviews
    BookScreen.tsx               ← One-time / recurring toggle + booking form
    PayScreen.tsx                ← Payment method selection + order summary
    ConfirmScreen.tsx            ← Booking confirmation ticket
    BookingsScreen.tsx           ← Tab screen: upcoming + past bookings
    BookingDetailScreen.tsx      ← Detail view with cancel / message actions
    ReviewScreen.tsx             ← Star rating + text review
    MessagesScreen.tsx           ← Chat view (linked to a booking ref)
    MessagesTabPlaceholder.tsx   ← Tab bar Messages tab (inbox stub)
    AccountScreen.tsx            ← Account settings + logout
  navigation/
    MainTabs.tsx                 ← Bottom tab navigator (Search, Bookings, Messages, Account)
```

## How to run
```bash
cd carenest-rn
npm install        # or: pnpm install / yarn
npx expo start     # scan QR with Expo Go on iOS/Android
```

## Known gaps / things to finish
1. **Date / time pickers** — `BookScreen` uses plain `TextInput` for date + time. Swap in `@react-native-community/datetimepicker` or `expo-date-picker` for native pickers.
2. **Picker / Select** — Duration field uses a `View` stub. Replace with `@react-native-picker/picker`.
3. **Safe area insets** — Screens use `SafeAreaProvider` at root. Add `<SafeAreaView>` or `useSafeAreaInsets()` inside header/footer sections on screens where notch/home indicator clashes.
4. **Font fallback** — If Expo Google Fonts fails offline, `fontFamily` will fall back to system. Consider bundling fonts locally via `expo-font` asset loading.
5. **Worker app flow** — `WorkerNoteScreen` is a placeholder per the original prototype. Build out the worker registration stack as a separate navigator when ready.
6. **Auth / backend** — All data is local mock state. Wire `RegisterScreen`, `LoginScreen` to your API, and replace `INITIAL_BOOKINGS` with a real fetch.
7. **Fraunces font** — The web prototype uses Fraunces (serif) for headings. It isn't in `@expo-google-fonts`. Either add it via custom font loading (`expo-font` + OTF file), or keep Inter Bold (current default).
8. **Push notifications** — Booking confirmations and worker messages should trigger push notifications via `expo-notifications`.
9. **Payment integration** — The Pay screen is UI only. Integrate Paystack React Native SDK or MTN Mobile Money API.
10. **Review flow** — `ReviewScreen` hardcodes "Kojo Mensah". Pass the correct worker name via route params from `BookingsScreen`.

## Design token reference
All colours live in `src/theme.ts` as `Colors.*`. They map directly to the CSS variables in the original `index.css`:
- `Colors.navy` = `--navy` (#0B1F3A)
- `Colors.gold` = `--gold` (#C9A227)
- `Colors.goldLight` = `--gold-light` (#E8CD6B)
- `Colors.paper` = `--paper` (#FFFDF8)
- etc.

To change the brand palette, edit `theme.ts` — it cascades everywhere.
