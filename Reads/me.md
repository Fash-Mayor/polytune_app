# Hi there, I'm [Your Name] 👋

I'm a software developer focused on building scalable backend architectures, high-performance mobile applications, and AI-integrated tools. I like solving complex problems—whether that's bypassing strict system limitations or engineering concurrency shields for heavy data pipelines.

### 🛠️ What I'm working on
* **PolyTune:** An Android app that translates and syncs lyrics in real-time using AI and native background services.
* Building out full-stack applications with a focus on seamless user experiences and bulletproof backends.

### 💻 Tech Stack
* **Mobile:** React Native, Expo, Kotlin (Native Android Modules)
* **Backend & Database:** Node.js, Supabase, PostgreSQL, Edge Functions
* **Frontend:** React, Next.js, Tailwind CSS / NativeWind
* **Integrations:** Gemini API, Groq, RESTful Architecture

### 📫 Let's Connect
* [Link to your LinkedIn]
* [Link to your Portfolio/Blog if you have one]



'


I need your help fixing a React Native state synchronization bug and implementing PostHog analytics in my Expo app (PolyTune).
### CONTEXT:
Stack: React Native, Expo Router, NativeWind, and a custom Kotlin Native Module.
The app listens to Android media sessions and streams translated lyrics. 
I already have the `PostHogProvider` wrapping the root layout, so the native SDK is installed.
### TASK 1: Fix the Album Art State Sync
My custom Kotlin module emits an event called `onMediaChanged` using Expo's event emitter. 
Check what the payload it sends look exactly like ando do not assume. DO NOT GUESS!
Currently, the album art is stubbornly not updating in the UI when the song changes, even though the title and artist change rapidly. The Kotlin side sends a delayed event 600ms later when it finally finds the album art. 
-> I want you to implement correctly an update to my app for the album art to update just like the sing title and artist.
-> If the album art is null, it should smoothly fall back to a default placeholder image until the correct album art arrives.
### TASK 2: Implement Core Beta Analytics (PostHog)
Since this is a beta launch, I only want to track the most crucial activation metrics. Do not overcomplicate this.implement tracking for these 2 specific events in my components:
1. `Song_Detected`: Trigger this when the `onMediaChanged` listener receives a NEW track title. (Do not trigger this on every playback position tick, only when the song actually changes).
   - Properties to send: { artist: "..." } (Do not send the song title to avoid PII/copyright clutter, just the artist to see what genres users listen to).
2. `Lyrics_Stream_Started`: Trigger this when successfully initiate the Supabase/AI fetch for the lyrics.
Please review my current player component code and provide the exact updated `.tsx` code to achieve both tasks seamlessly.