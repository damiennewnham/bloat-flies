import { ChannelType } from 'discord.js';
import { verifyPlayer } from '../utils/verifyPlayer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf-8'));

const HELPER_ROLE_ID = config.roles.helper;
const VERIFY_CHANNELS = [config.channels.verify, config.channels.test];
const BOTLOGS_CHANNEL_ID = config.channels.botlogs;

// Helper function to send logs to botlogs channel
async function sendBotLog(client, message) {
  try {
    const logsChannel = await client.channels.fetch(BOTLOGS_CHANNEL_ID);
    if (logsChannel) {
      await logsChannel.send(message);
    }
  } catch (err) {
    console.error(`[LOGS] Failed to send to botlogs channel:`, err.message);
  }
}

// Helper function to log to both console and collect for botlogs
function logBoth(tag, message, logs) {
  const fullMessage = `[${tag}] ${message}`;
  console.log(fullMessage);
  logs.push(fullMessage);
}

export default {
  name: 'messageCreate',
  async execute(message) {
    const logs = []; // Collect all logs
    
    // Ignore bot messages
    if (message.author.bot) return;

    // Only process in guild channels
    if (!message.guild) return;

    // Only process in allowed channels
    if (!VERIFY_CHANNELS.includes(message.channelId)) {
      logBoth('VERIFY', `Ignored message in channel ${message.channelId} (not in verify/test channels)`, logs);
      return;
    }

    // Only process if message has attachments (images)
    if (!message.attachments || message.attachments.size === 0) {
      logBoth('VERIFY', `Ignored message from ${message.author.username} - no attachments`, logs);
      return;
    }

    // Check if any attachment is an image
    const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));
    if (!hasImage) {
      logBoth('VERIFY', `Ignored message from ${message.author.username} - no images`, logs);
      return;
    }

    logBoth('VERIFY', `Processing verification for ${message.author.username} in channel ${message.channelId}`, logs);

    // Get the user's server nickname, global name, or username
    const member = await message.guild.members.fetch(message.author.id);
    let displayName = member.nickname || member.user.globalName || message.author.username;
    logBoth('VERIFY', `Discord name: ${displayName} (nickname: ${member.nickname}, globalName: ${member.user.globalName}, username: ${message.author.username})`, logs);

    // Create a thread for verification
    const thread = await message.startThread({
      name: `Verifying ${displayName}`,
      autoArchiveDuration: 1440 // 24 hours
    });
    logBoth('VERIFY', `Created thread: ${thread.id}`, logs);

    // Send initial message
    await thread.send(`⏳ Verifying **${displayName}**...`);

    // Try to verify with their Discord name/nickname
    logBoth('VERIFY', `Attempting verification with Discord name: ${displayName}`, logs);
    let result = await verifyPlayer(displayName);

    // If initial verification fails, ask for IGN
    if (result.error) {
      logBoth('VERIFY', `Verification failed with Discord name, requesting IGN`, logs);
      
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        await thread.send(
          `${message.author} Could not find your stats as **${displayName}**. Please reply with your OSRS IGN:`
        );

        // Wait for user response
        try {
          const collected = await thread.awaitMessages({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 60000, // 1 minute timeout
            errors: ['time']
          });

          const ign = collected.first().content.trim();
          logBoth('VERIFY', `Received IGN (attempt ${attempts + 1}): ${ign}`, logs);

          // Update their server nickname
          try {
            await member.setNickname(ign);
            logBoth('VERIFY', `Updated nickname to: ${ign}`, logs);
          } catch (err) {
            console.error(`[VERIFY] Failed to update nickname:`, err.message);
            logBoth('VERIFY', `Failed to update nickname: ${err.message}`, logs);
            logBoth('VERIFY', `Bot highest role: ${message.guild.members.me.roles.highest.name}`, logs);
            logBoth('VERIFY', `User highest role: ${member.roles.highest.name}`, logs);
            await thread.send(`⚠️ Could not update your server nickname, but I'll verify with IGN: **${ign}**`);
          }

          // Rerun verification with the provided IGN
          logBoth('VERIFY', `Rerunning verification with IGN: ${ign}`, logs);
          result = await verifyPlayer(ign);

          if (result.error) {
            logBoth('VERIFY', `Error on attempt ${attempts + 1}: ${result.error}`, logs);
            attempts++;
            if (attempts < maxAttempts) {
              await thread.send(`❌ ${result.error}\n\nPlease try again:`);
              continue;
            } else {
              await thread.send(`❌ Unable to verify your account after ${maxAttempts} attempts. Please contact a Helper.`);
              await sendBotLog(message.client, `\`\`\`\n${logs.join('\n')}\n\`\`\``);
              return;
            }
          } else {
            // Success - break out of loop
            break;
          }
        } catch (err) {
          console.error(`[VERIFY] Timeout or error waiting for IGN:`, err.message);
          logBoth('VERIFY', `Timeout or error waiting for IGN: ${err.message}`, logs);
          await thread.send('⏱️ Verification timed out. Please try again by posting another message.');
          await sendBotLog(message.client, `\`\`\`\n${logs.join('\n')}\n\`\`\``);
          return;
        }
      }
    }

    // Handle verification result
    if (result.error) {
      logBoth('VERIFY', `Verification error: ${result.error}`, logs);
      await thread.send(result.error);
      await sendBotLog(message.client, `\`\`\`\n${logs.join('\n')}\n\`\`\``);
      return;
    }

    // Send the verification embed
    const response = await thread.send({ embeds: [result.embed] });
    logBoth('VERIFY', `Sent verification embed - Status: ${result.success ? 'PASSED' : 'FAILED'}`, logs);

    // If passed, notify helper
    if (result.success) {
      logBoth('VERIFY', `Player passed! Notifying Helper`, logs);
      await thread.send(`✅ Stats and KC verified! A Helper will check your gear shortly!`);
      await sendBotLog(message.client, `✅ **${result.playerName}** (${message.author.username}) - PASSED\n\`\`\`\n${logs.join('\n')}\n\`\`\``);
    } else {
      logBoth('VERIFY', `Player failed verification`, logs);
      await thread.send(`❌ Unfortunately you don't meet the HMT requirements:\n\n${result.failedRequirements.map(req => `• ${req}`).join('\n')}`);
      await sendBotLog(message.client, `❌ **${result.playerName}** (${message.author.username}) - FAILED\n\`\`\`\n${logs.join('\n')}\n\`\`\``);
    }
  }
};
