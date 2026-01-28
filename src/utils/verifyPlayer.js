import { EmbedBuilder } from 'discord.js';
import { getStats, HiScoresError, PlayerNotFoundError } from 'osrs-json-hiscores';

export const requirements = {
  attack: 80,
  defence: 80,
  strength: 99,
  ranged: 99,
  magic: 99,
  prayer: 77
};

export async function verifyPlayer(username) {
<<<<<<< HEAD
  console.log(`[HISCORES] Fetching stats for: ${username}`);
=======
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
  let player;

  // Retry logic for temporary hiscores downtime
  for (let i = 0; i < 2; i++) {
    try {
      player = await getStats(username);
<<<<<<< HEAD
      console.log(`[HISCORES] Successfully fetched stats for ${username}`);
      break;
    } catch (err) {
      if (err instanceof HiScoresError) {
        console.log(`[HISCORES] HiScores API error, retrying in 2s (attempt ${i + 1}/2)`);
        await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
      } else if (err instanceof PlayerNotFoundError) {
        console.log(`[HISCORES] Player not found: ${username}`);
=======
      break;
    } catch (err) {
      if (err instanceof HiScoresError) {
        await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
      } else if (err instanceof PlayerNotFoundError) {
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
        return {
          success: false,
          error: `❌ Player **${username}** not found on OSRS hiscores.`
        };
      } else {
<<<<<<< HEAD
        console.error(`[HISCORES] Unexpected error:`, err.message);
=======
        console.error(err);
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
        return {
          success: false,
          error: '💀 Failed to fetch stats for this player.'
        };
      }
    }
  }

  if (!player) {
<<<<<<< HEAD
    console.log(`[HISCORES] Hiscores temporarily unavailable for ${username}`);
=======
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
    return {
      success: false,
      error: '⏳ OSRS hiscores are temporarily unavailable. Please try again later.'
    };
  }

  const data = player[player.mode];
  if (!data?.skills || !data?.bosses) {
<<<<<<< HEAD
    console.log(`[HISCORES] Could not read stats data for ${username}`);
=======
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
    return {
      success: false,
      error: `⚠️ Could not read stats for **${username}**`
    };
  }

  const failed = [];

  // Check skills
  const skillInfo = {};
  for (const [skill, required] of Object.entries(requirements)) {
    const level = data.skills[skill]?.level ?? 0;
    skillInfo[skill] = level;
    if (level < required) {
<<<<<<< HEAD
      console.log(`[CHECK] ${skill}: ${level}/${required} ❌`);
      failed.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} (${level} / ${required})`);
    } else {
      console.log(`[CHECK] ${skill}: ${level}/${required} ✅`);
=======
      failed.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} (${level} / ${required})`);
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
    }
  }

  // Check TOB KC (normal + hard mode)
  const tobKCNormal = data.bosses?.theatreOfBlood?.score ?? 0;
  const tobKCHard = data.bosses?.theatreOfBloodHardMode?.score ?? 0;
  const totalTOBKC = tobKCNormal + tobKCHard;

<<<<<<< HEAD
  console.log(`[CHECK] TOB KC: ${totalTOBKC} (Normal: ${tobKCNormal}, Hard: ${tobKCHard})`);

  if (totalTOBKC < 100) {
    console.log(`[CHECK] TOB KC: ${totalTOBKC}/100 ❌`);
    failed.push(`ToB/HMT KC (${totalTOBKC} / 100)`);
  } else {
    console.log(`[CHECK] TOB KC: ${totalTOBKC}/100 ✅`);
=======
  if (totalTOBKC < 100) {
    failed.push(`ToB/HMT KC (${totalTOBKC} / 100)`);
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
  }

  // Build embed
  const embed = new EmbedBuilder()
    .setTitle(`🦆 ${player.name} Verification`)
    .setColor(failed.length === 0 ? 0x57f287 : 0xed4245) // green if passed, red if failed
    .addFields(
      { name: 'Status', value: failed.length === 0 ? '✅ HMT Ready' : '❌ Failed' },
      { name: 'Missing Requirements', value: failed.length ? failed.join('\n') : 'None' }
    );

  // If passed, add full stats info
  if (failed.length === 0) {
    embed.addFields(
      { name: 'ToB KC', value: tobKCNormal.toString(), inline: true },
      { name: 'HMT KC', value: tobKCHard.toString(), inline: true }
    );
<<<<<<< HEAD
    console.log(`[RESULT] ✅ ${player.name} PASSED HMT verification`);
  } else {
    console.log(`[RESULT] ❌ ${player.name} FAILED HMT verification - Missing: ${failed.join(', ')}`);
=======
>>>>>>> 7fd132903a98921ed3216705f61f6663fee41068
  }

  return {
    success: failed.length === 0,
    embed: embed,
    playerName: player.name,
    hasFailed: failed.length > 0
  };
}
