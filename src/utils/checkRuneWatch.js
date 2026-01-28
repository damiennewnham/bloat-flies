// Check runewatch status by running /rw command
export async function checkRunewatch(thread, playerIGN, client) {
  try {
    console.log(`[RUNEWATCH] Checking ${playerIGN} against RuneWatch...`);
    
    // Send the /rw command
    const rwCommand = await thread.send(`/rw ${playerIGN}`);
    
    // Wait for TwistyBot's response (up to 5 seconds)
    const responses = await thread.awaitMessages({
      filter: m => m.author.username === 'TwistyBot' || m.author.id === '628306124674588672', // TwistyBot's common ID
      max: 1,
      time: 5000,
      errors: []
    });
    
    if (responses.size === 0) {
      console.log(`[RUNEWATCH] No response from TwistyBot`);
      return { onList: false, message: null };
    }
    
    const response = responses.first();
    const content = response.content;
    
    // Check if player is not found (meaning they're clean)
    if (content.includes('Player not found')) {
      console.log(`[RUNEWATCH] ${playerIGN} - Player not found (CLEAN)`);
      return { onList: false, message: null };
    }
    
    // If message contains details, they're on the list
    if (response.embeds && response.embeds.length > 0) {
      console.log(`[RUNEWATCH] ${playerIGN} - FLAGGED on RuneWatch`);
      return { 
        onList: true, 
        message: response,
        embed: response.embeds[0]
      };
    }
    
    return { onList: false, message: null };
  } catch (err) {
    console.error(`[RUNEWATCH] Error checking RuneWatch:`, err.message);
    return { onList: false, message: null };
  }
}
