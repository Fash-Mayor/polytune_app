import { supabase } from "../utils/supabase"; 

export const ReportingService = {
  
  async reportSyncIssue(
    title: string,
    artist: string,
    note?: string,
  ): Promise<void> {
    try {
      // 1. Sanitize inputs to prevent trailing space failures
      const cleanTitle = title.trim();
      const cleanArtist = artist.trim();
      const cleanNote = note?.trim();

      // 2. Add high-visibility diagnostics to your Metro terminal
      console.log(`[REPORT QUERY] 🔍 Looking up: "${cleanTitle}" by "${cleanArtist}"`);

      // 3. Fetch the exact song ID using case-insensitive matching
      const { data: song, error: songError } = await supabase
        .from("songs")
        .select("id")
        .ilike("title", cleanTitle)   // Matches 'Soso' even if input is 'soso'
        .ilike("artist", cleanArtist) // Matches 'Omah Lay' even if input is 'omah lay'
        .maybeSingle();

      if (songError) throw new Error(`Database lookup failed: ${songError.message}`);
      
      if (!song) {
        // If it still fails, this log will show you exactly what text mismatch occurred
        throw new Error(`Track target match failed. Track lyrics does not exist in the DB.`);
      }

      // 4. Insert the report
      const { error: bugError } = await supabase
        .from("reported_bugs")
        .insert([
          {
            song_id: song.id,
            bug_description: cleanNote
              ? `Sync/translation deviation flagged by user via the NowPlaying overlay panel. User note: ${cleanNote}`
              : "Sync/translation deviation flagged by user via the NowPlaying overlay panel.",
          },
        ]);

      if (bugError) throw new Error(`Failed to log report: ${bugError.message}`);
      
    } catch (error: any) {
      console.error("[REPORTING SERVICE ERROR]", error.message);
      throw error; 
    }
  },

  async reportBug(details: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("reported_bugs")
        .insert([
          {
            bug_description: `feedback-bug-report: ${details}`,
          },
        ]);
      if (error) throw new Error(`Failed to log bug: ${error.message}`);
    } catch (error: any) {
      console.error("[REPORTING SERVICE ERROR]", error.message);
      throw error;
    }
  }
};