# 📱 Golden Bloom CRM - Flutter Mobile Application

Official Android Mobile Application for Golden Bloom Lead Management CRM (`goldenbloom.ae`).
Features real-time WhatsApp-style lock-screen push notifications, sound alerts, and 1-tap direct lead opening even when the phone is locked or the app is completely closed.

---

## 🌟 Key Features

1. **WhatsApp-Style Lock Screen Notifications (FCM):**
   - High-priority push notifications wake up Android devices.
   - Plays loud sound chime and vibrates on new leads or assignments.
   - Operates via Google Play Services / Firebase Cloud Messaging even when the app has been terminated by the user.

2. **1-Tap Direct Lead Opening (Deep Linking):**
   - When a notification is tapped, the app automatically loads `https://crm.goldenbloom.ae/?lead_id={id}`.
   - Pops up the exact Lead Details modal instantly on mobile.

3. **In-App Mobile Calling & WhatsApp:**
   - Tapping phone numbers opens native mobile dialer.
   - Tapping WhatsApp button opens WhatsApp directly with pre-formatted lead details.

4. **Bi-Directional Token Synchronization:**
   - Automatically detects user login, saves device token, and registers it with `api.goldenbloom.ae/api/fcm/token`.

---

## 🚀 How to Build the APK

### Method 1: 1-Click Free Cloud Build (GitHub Actions)
1. Go to the GitHub repository: **Actions &rarr; Build Android APK &rarr; Run workflow**.
2. GitHub compiles the release APK in ~3 minutes in the cloud.
3. Download `app-release.apk` directly from the workflow artifacts.

### Method 2: Local Build via Flutter CLI
```bash
cd mobile_app
flutter pub get
flutter build apk --release --no-tree-shake-icons
```
Output APK location:
`mobile_app/build/app/outputs/flutter-apk/app-release.apk`

---

## 🔑 Firebase Cloud Messaging (FCM) Setup

1. Create a free project on [Firebase Console](https://console.firebase.google.com).
2. Add an Android app with package name: `ae.goldenbloom.crm`.
3. Download `google-services.json` and place it in `mobile_app/android/app/google-services.json`.
4. Copy the **FCM Server Key** (or Cloud Messaging API Key) from Firebase Project Settings &rarr; Cloud Messaging.
5. In CRM Portal &rarr; Settings &rarr; Paste your Server Key into `FCM Server Key` (or set `FCM_SERVER_KEY` in Laravel `.env`).

---

## 📥 Direct APK Download on CRM Portal

The compiled APK is placed at `frontend/public/downloads/goldenbloom-crm.apk` and served directly on `https://crm.goldenbloom.ae/downloads/goldenbloom-crm.apk`.
Users can tap the **"Mobile App (.APK)"** button on the CRM header or sidebar to download and install.
