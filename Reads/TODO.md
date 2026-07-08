## TODO
- add sum to tell them that my notif request isn't actually taking anything (Enable media access, Notif read, reply and control)✅
- The app shouldn't start listening till users give it permission, i.e clicking on the "Start Listening" button, which then brings up the "Privacy & Connection" modal.✅
- make edgr function faster & improve it (such that 5 users plays the same song, 4 pauses and only one gets to the AI)(What if I use Chat) (check sync engine, some songs aren't syncing (check the edge func code), some lines are skipped in the lyrics (mostly repeating lines like chorous), some lyrics get the original, tranlated and romanise mixed up )✅
- "sync issue" button inserts into supabase✅
- check sync engine, some song lyrics aren't syncing (check the edge function code), if both are okay no need to change anything.✅
- some Romanised lyrics has the ~, sometimes it's the original, sometimes it's the translation, and sometimes the app gives only one line that's both the romanised and translated lyrics in one (no separated line for translated lyrics and no original)✅
- image should update instantly (like the title and artist do)✅
- lyrics 're kinda lagging (just a bit)(remove the animation) opt2 remove animated:true -> animated:false✅
- the app re-launches when I minimise and go to another app and come back✅
- UI upgrade✅
- feedback page also adds the feedback to supabase✅
- might need to add a splash screen✅
- font❌
- make ui redering .tsx files light
- OTA updates check w (lyrics block width & app analytics)
-->> skipping forward and going back
- Authentication (login should percist)
- Settings/Profile page (w legals (T&C, PP))
- Paywall (RevenueCAT)
- OTA updates check
- privacy policy and (T&C)
- Add app analytics (aptabase & vexo?)(D.BigBoys)(track important things like when a translation completes, or paywall hit)
- Record Demo✅
- UIing using Copilot and Design.md (Including Native look) - CHANGE TO TAILWIND - CHANGE LYRICS APPEARING FORMAT/POSITIONING✅
- The "a text Node cannot be a child of <view>" error.✅
- Gemini Alt (DeepL?)✅
- Speed (make the edge function faster):
    - Gemini Model fallback for translation (for when quota is exceeded)(llama-3.3-70b-versatile✅)
    - LRCLIB fallback for lyrics search (for when LRCLIB doesn't have the requested lyrics)(Ovh✅)
- Whole app navigation (including Feedback page)✅
- Better error handling in the edge function code (so we can know exactly what happens when sum doesn't work)✅
- Since Groq is faster it should be the first POC and Gemini the fallback (is it more accurate than 2.5 Flash?)✅
- Adding romaji (that's how other languages will be added too)✅

## B4Launch
- real users tested and given feedback. (b4 authentiction step)
- OTA updates check
- Play store assets
- fonts fix (wAI)


## PIVOT I:
### The Execution Plan
We need to execute this refactor in three distinct phases so we don't break the app:
**Phase 1:** The Purge. We delete all the expo-auth-session and secure vault code. We strip the app down to just the UI and the streaming engine.
**Phase 2:** The Native Bridge. We initialize a local Expo module and write the Kotlin service to intercept the Android media intents.
**Phase 3:** The Reconnection. We link the new native data stream directly into your fetchLyricsStream function.

## PIVOT II:
### Free Trial
User gets 3 free tranlsations daily for un-cached tracks.
Users can stream cached tracks forever without paying.


eas build --profile preview --platform android
eas update --branch main --message "message"
- cd android && gradlew clean && cd ..
npx expo run:android --variant release
- Testo to Live Reload (npx expo prebuild --clean)--(npx expo start --tunnel --reset-cache)--(npx expo start --dev-client --tunnel)
npx expo run:android --variant debug
npx expo start --dev-client
**(npx expo start --dev-client --tunnel -c)**
# 1. Clear Expo's local asset cache
npx expo start --clear
# 2. Force a clean generation of the native Android project
npx expo prebuild --clean
# 3. Build the final Android package
npx expo run:android --variant release
### eas update --channel production --message "OTA Testo ichi"

## Ato de
 - Maybe I'll put my app in ProductHunt..?

## Shower Thoughts
- Add a feature where users can see translated song?
- "All community-cached translations are completely free to stream forever. Want to translate a brand new track? Use an AI Credit or upgrade to Pro."
- "You translated" w filter for "recently translated"
- Might ned to modify the prompt given to gem and llama (cultural and deep meaning can be pro)

** Edge Func Todo's:
❌ Zero Protection / No Paywall Enforcement: This is the biggest issue. This function does not inspect the user's authorization token or check their account status. Anyone who finds this endpoint URL can spam it infinitely, burn your AI keys, and bypass your "1 free song per day" strategy completely. It needs to check the user's profile table for their subscription status or token balance before executing.❌ The "Plain Lyrics" Sync Trap: Your code falls back to raw lyrics from lyrics.ovh or plain text from LRCLIB if synced lyrics aren't found. If the source lyrics don't have timestamps, your prompt tells Gemini to output [timecode]|.... Because the AI has no time reference, it will completely hallucinate timestamps, causing the lyrics to be drastically out of sync on the user's phone.  ❌ Brittle String Cache Misses: The database check uses an exact match: .eq("title", trackTitle).eq("artist", artistName). If Spotify passes a title with slight variations like "Lose Yourself - Bonus Track" or trailing whitespaces, your database will count it as a cache miss, forcing an expensive and unnecessary AI call. You need to strip common suffixes and trim strings before checking the cache.  ❌ Groq Stream Fragmentation Bug: Your Gemini SDK handles chunk buffering automatically, but your manual Groq fetch stream splits chunks blindly using chunk.split("\n"). If a JSON data line gets cut in half across two incoming network packets, JSON.parse will crash mid-stream and drop lines of lyrics.  ❌ Timeout Mismatch: Your code comment says // Instantly cut off hang ups at 2 seconds, but the code actually passes AbortSignal.timeout(10000) (10 seconds). Leaving a connection hanging for 10 seconds on an external API call will make the app feel incredibly sluggish to the end-user.  
-->> 