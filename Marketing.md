## Faceless "Visual Hook" Short-Form (TikTok / Reels / Shorts): 
* Music translation is an incredibly visual product. You don't need to speak. Put on a trending K-pop, J-pop, or Latin track. Screen-record your phone. Show Spotify playing the song, then immediately switch to LyricsMine generating the translation in real-time. Use a simple text overlay: "Tired of not knowing what they're singing? 🎧". It takes 10 minutes to make, costs nothing, and the algorithm pushes software that solves an immediate visual problem.
Language learning through music..., 3-4 vids per day, use trending songs, "how I learnt jyp from this song",
"0-3s: "This song has English, Spanish, AND French" (show song title)
3-10s: Play 5s of song + show LyricsMine translation overlay
10-15s: "Download LyricsMine to translate ANY song" (CTA)"


| Channel                                 | Effort                     | Potential                 |
| --------------------------------------- | -------------------------- | ------------------------- |
| Product Hunt                            | Medium (build karma first) | 500-2K users buildmvpfast |
| Twitter/X (language learning community) | Low                        | 100-500 users             |
| Indie Hackers                           | Low                        | 50-200 users              |
| Language Discord servers                | Medium (ask mods)          | 200-1K users              |
| YouTube Shorts (faceless)               | Medium                     | 500-5K views              |

## Trench Warfare in Niche Subreddits: 
* Reddit hates marketers but they love indie developers solving real problems. Go to communities where people need translations: 
r/kpop, r/anime, r/truespotify, or language-learning, r/learnjapanese, r/apphookup, r/producthunt 
- Post a genuine, text-based story: "I got frustrated trying to find English translations for my foreign Spotify playlists, so I built a real-time translator app. Looking for early testers." * The "Build-in-Public" Tech Flex (Dev.to / Medium / Hashnode): You are building a complex app using Expo, Supabase edge functions, and real-time data syncing. Developers love reading about architecture. Write an article titled "How I built a real-time Spotify translator for $0." Tech audiences are highly forgiving early-adopters, and they will help you stress-test your database limits.

## App Store Optimization (ASO): 
* Your app store listing is your silent, 24/7 salesman. Organic search is free. Don't just name the app "LyricsMine" on the Play Store. Name it something highly searchable like "LyricsMine: Spotify Translator & Romanization." Pack your description with the exact keywords your target audience is typing into the search bar.

## Privacy Policy Snippet:
### Real-Time Media Tracking & Android Permissions
To provide contextual translation and synchronization features, LyricsMine requests Android "Notification Access" via a standard NotificationListenerService. 
* **What We See:** The application strictly processes system-level MediaController metadata payloads. This includes solely the track title, artist name, playback state (playing/paused), and current timecode duration.
* **What We Ignore:** The underlying execution engine explicitly drops, ignores, and refuses to read notifications originating from messaging apps (e.g., WhatsApp, SMS), financial applications, system alerts, or any non-media playing software.
* **Data Transmission:** All text parsing happens completely client-side. No chat logs, notification logs, or personal data are monitored, recorded, cached, or transmitted to external servers. The song title and artist are exclusively evaluated to stream lyrics from our backend database.

## Part 3: The "Introvert Marketing" Blog Post Blueprint
(To post on Dev.to, Medium, or Hashnode to build organic developer trust)
* **Title:** Why My New Android App Demands a "Scary" Permission (And the Open Source Kotlin Code Proving It's Safe)
* **The Hook:** Explain that you wanted an app that translates foreign songs playing on any media player (Spotify, YouTube, local players) right on your screen.
* **The Compliance Wall:** Show a screenshot of the terrifying Android warning screen. Admit that if you saw this on an app, you'd delete it too.
* **The Tech Transparency (The Code Drop):** Show them the core logic of ExpoAmbientListenerModule.kt.
* **Drop a snippet showing exactly how the event map filters for music attributes:**

Kotlin
```
override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val packageName = sbn?.packageName ?: return
    val extras = sbn.notification?.extras ?: return

    // We ONLY inspect packages that match media profiles or active audio sessions
    val isMedia = sbn.notification?.category == Notification.CATEGORY_TRANSPORT || 
                  extras.containsKey(Notification.EXTRA_MEDIA_SESSION)

    if (!isMedia) return // Drop everything else immediately!

    val trackTitle = extras.getString(Notification.EXTRA_TITLE)
    val artistName = extras.getString(Notification.EXTRA_TEXT)

    // Send strictly music metadata to the frontend
    sendEvent("onMediaChanged", mapOf("title" to trackTitle, "artist" to artistName))
}
```
* **The CTA (Call to Action):** "I built this for the culture because I wanted to know what my favorite tracks actually mean without manually searching lyrics. If you're skeptical, run this code snippet through an AI model or ask a developer friend. If it checks out, grab LyricsMine on the Play Store!"