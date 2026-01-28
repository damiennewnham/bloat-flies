// Check runewatch status via HTTP request
export async function checkRunewatch(playerIGN) {
  try {
    console.log(`[RUNEWATCH] Checking ${playerIGN} against RuneWatch...`);
    
    // Try querying RuneWatch API/endpoint
    const encodedIGN = encodeURIComponent(playerIGN);
    const response = await fetch(`https://runewatch.com/api/player/${encodedIGN}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[RUNEWATCH] Player not found or API error (${response.status})`);
      return { onList: false, data: null };
    }
    
    const data = await response.json();
    
    // If we get data, player is flagged
    if (data && (data.cases || data.length > 0)) {
      console.log(`[RUNEWATCH] ${playerIGN} - FLAGGED on RuneWatch`);
      return { 
        onList: true, 
        data: data
      };
    }
    
    console.log(`[RUNEWATCH] ${playerIGN} - Clean on RuneWatch`);
    return { onList: false, data: null };
  } catch (err) {
    console.error(`[RUNEWATCH] Error checking RuneWatch:`, err.message);
    // If request fails, assume clean (don't block verification)
    return { onList: false, data: null };
  }
}

