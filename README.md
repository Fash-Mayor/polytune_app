<img src="assets/PolyTuneLogo.png" width="100" />

# PolyTune

PolyTune is a native Android application built with React Native and Expo that provides **real-time, synced, and translated lyrics** for whatever is currently playing on your device. 

Instead of waiting for official translations, PolyTune intercepts your media session, pulls the raw lyrics, and streams Romanized and translated lyrics directly to your screen using AI.

![PolyTune Showcase](link-to-your-gif-or-image-here.gif)

## ✨ Features
* **Universal Sync:** Works with Spotify, YouTube Music, or any app broadcasting a media session.
* **Real-Time AI Translation:** Streams translations on the fly.
* **Romanization:** Perfect for singing along to K-Pop, Anime intros, or international tracks.
* **Native Performance:** Uses custom Kotlin modules to intercept system broadcasts without draining your battery.

---

## 📥 Download the Beta (Android Only)

PolyTune is currently in open beta. Since it is not on the Play Store yet, you can download the raw APK directly.

### Installation Instructions:
1. Go to the [Releases page](https://github.com/Fash-Mayor/PolyTune/releases) and download the `latest` file.
2. Open the downloaded file on your Android device.
3. Your phone may show a warning: **"For your security, your phone is not allowed to install unknown apps from this source."**
4. Tap **Settings** on that prompt, and toggle on **"Allow from this source"**.
5. Tap **Install** and open the app!

*Note: PolyTune requires notification access to read your current media playback. It does not collect or store your personal data. More on that in app*

---

## 🐛 Feedback & Bug Reports
You can report bugs in the app. Use **Sync Issue** to report a sync or translation issue, and use the **Feedback Page Form** to report any bugs.

## 🛠️ Built With
* React Native & Expo
* Supabase (PostgreSQL & Edge Functions)
* NativeWind (Tailwind CSS)
* Kotlin
