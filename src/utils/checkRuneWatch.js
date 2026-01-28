// Check runewatch status by querying the cases API
export async function checkRunewatch(playerIGN) {
  try {
    console.log(`[RUNEWATCH] Checking ${playerIGN} against RuneWatch...`);
    
    // Query RuneWatch cases endpoint - they likely have an API for cases
    const response = await fetch(`https://runewatch.com/api/cases`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[RUNEWATCH] API error (${response.status})`);
      return { onList: false, data: null };
    }
    
    const cases = await response.json();
    
    // Search through all cases for matching player
    if (Array.isArray(cases)) {
      const playerCase = cases.find(c => 
        c.player?.toLowerCase() === playerIGN.toLowerCase() ||
        c.rsn?.toLowerCase() === playerIGN.toLowerCase() ||
        c.victim?.toLowerCase() === playerIGN.toLowerCase()
      );
      
      if (playerCase) {
        console.log(`[RUNEWATCH] ${playerIGN} - FLAGGED on RuneWatch`);
        return { 
          onList: true, 
          data: playerCase
        };
      }
    }
    
    console.log(`[RUNEWATCH] ${playerIGN} - Clean on RuneWatch`);
    return { onList: false, data: null };
  } catch (err) {
    console.error(`[RUNEWATCH] Error checking RuneWatch:`, err.message);
    // If request fails, assume clean (don't block verification)
    return { onList: false, data: null };
  }
}

