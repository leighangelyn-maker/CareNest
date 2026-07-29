# Running CareNest on Expo Go

## Prerequisites

- **Node.js 18+** — check with `node --version`
- **npm** (comes with Node) or yarn
- **Expo Go** app installed on your phone — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Backend running** on port 8080 (see backend start commands below)

---

## Option 1 — Physical device (Expo Go)

Your phone and your computer **must be on the same WiFi network**.

### Step 1 — Find your computer's local IP

Open Command Prompt and run:
```
ipconfig
```
Look for **IPv4 Address** under your active network adapter. It looks like `192.168.x.x` or `10.x.x.x`.

### Step 2 — Set the API base URL

Open `frontend/app.json` and update `extra.apiBaseUrl`:
```json
"extra": {
  "apiBaseUrl": "http://192.168.1.42:8080"
}
```
Replace `192.168.1.42` with your actual IP from Step 1.

### Step 3 — Start the backend (Windows)

```cmd
cd carenest_backend
mvnw.cmd spring-boot:run
```

### Step 4 — Start the Expo dev server

```cmd
cd frontend
npx expo start
```

### Step 5 — Open on your phone

- **Android**: Open Expo Go → scan the QR code shown in the terminal
- **iOS**: Open the Camera app → scan the QR code → tap the Expo Go banner

---

## Option 2 — Android Emulator

Leave `apiBaseUrl` as `""` in `app.json` — the app automatically uses `http://10.0.2.2:8080` which routes to your machine from the Android emulator.

```cmd
cd frontend
npx expo start --android
```

Make sure the backend is running first (Step 3 above).

---

## Option 3 — iOS Simulator (macOS only)

Leave `apiBaseUrl` as `""` in `app.json` — the app automatically uses `http://localhost:8080`.

```bash
cd frontend
npx expo start --ios
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Network Error" or requests timeout | Wrong IP in `apiBaseUrl`, or phone not on same WiFi as PC |
| "CORS error" in logs | Update Spring Security CORS config to allow your phone's origin |
| App stuck on splash screen | Run `npx expo start --clear` to clear Metro bundler cache |
| "Unable to resolve module" | Run `cd frontend && npm install` then restart Expo |
| Backend won't start | Check Java 17+ installed: `java --version` |
| QR code not scanning | Try pressing `w` in the Expo terminal to open web, or use tunnel mode: `npx expo start --tunnel` |

---

## Quick reference

```cmd
# Start backend (Windows)
cd carenest_backend && mvnw.cmd spring-boot:run

# Start frontend
cd frontend && npx expo start

# Clear cache if needed
cd frontend && npx expo start --clear
```
