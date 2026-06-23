## TODO
- add sum to tell them that my notif request isn't actually taking anything (Enable media access, Notif read, reply and control)✅
- app shouldn't start listening till users give it permission (i.e clicking on the sync button)
- make edgr function faster & improve it (such that 5 users plays the same song, 4 pauses and only one gets to the AI)
- Settings/Profile page (w legals (T&C, PP))
- Rebranding & UI upgrade (animated lyrics) 
-->>
- Authentication
- Paywall (RevenueCAT)
- OTA updates check
- privacy policy and (T&C?)
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
npx expo run:android --variant release


## Ato de
 - Maybe I'll put my app in ProductHunt..?

## Shower Thoughts
- Add a feature where users can see translated song?
- "All community-cached translations are completely free to stream forever. Want to translate a brand new track? Use an AI Credit or upgrade to Pro."
- "You translated" w filter for "recently translated"
- Might ned to modify the prompt given to gem and llama (cultural and deep meaning can be pro)
