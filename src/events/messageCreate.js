import { ChannelType } from 'discord.js';
import { verifyPlayer } from '../utils/verifyPlayer.js';
import { checkRunewatch } from '../utils/checkRuneWatch.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf-8'));

const HELPER_ROLE_ID = config.roles.helper;
const MOD_ROLE_ID = config.roles.mod;
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

    // Get the member object
    const member = await message.guild.members.fetch(message.author.id);

    // Create a thread for verification
    const thread = await message.startThread({
      name: `Verifying ${message.author.username}`,
      autoArchiveDuration: 1440 // 24 hours
    });
    logBoth('VERIFY', `Created thread: ${thread.id}`, logs);

    // Always prompt for IGN first
    await thread.send(`⏳ Hi **${message.author.username}**, please reply with your OSRS IGN to verify:`);

    let result;
    let ign;
    let attempts = 0;
    const maxAttempts = 2;

    // Loop to get IGN and verify
    while (attempts < maxAttempts) {
      // Wait for user response
      try {
        const collected = await thread.awaitMessages({
          filter: m => m.author.id === message.author.id,
          max: 1,
          time: 60000, // 1 minute timeout
          errors: ['time']
        });

        ign = collected.first().content.trim();
        logBoth('VERIFY', `Received IGN (attempt ${attempts + 1}): ${ign}`, logs);

        // Verify with the provided IGN
        logBoth('VERIFY', `Attempting verification with IGN: ${ign}`, logs);
        result = await verifyPlayer(ign);

        if (result.error) {
          logBoth('VERIFY', `Error on attempt ${attempts + 1}: ${result.error}`, logs);
          attempts++;
          if (attempts < maxAttempts) {
            await thread.send(`❌ ${result.error}\n\nPlease try again:`);
            continue;
          } else {
            await thread.send(`❌ Unable to verify your account after ${maxAttempts} attempts. A Helper will respond shortly.`);
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

    // Update their server nickname with the verified IGN
    try {
      await member.setNickname(ign);
      logBoth('VERIFY', `Updated nickname to: ${ign}`, logs);
    } catch (err) {
      console.error(`[VERIFY] Failed to update nickname:`, err.message);
      logBoth('VERIFY', `Failed to update nickname: ${err.message}`, logs);
      logBoth('VERIFY', `Bot highest role: ${message.guild.members.me.roles.highest.name}`, logs);
      logBoth('VERIFY', `User highest role: ${member.roles.highest.name}`, logs);
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

    // If passed, notify helper and check runewatch
    if (result.success) {
      logBoth('VERIFY', `Player passed! Notifying Helper`, logs);
      await thread.send(`✅ Stats and KC verified! A Helper will check your gear shortly!`);
      
      // Check runewatch status
      logBoth('VERIFY', `Checking RuneWatch for ${result.playerName}`, logs);
      const rwCheck = await checkRunewatch(result.playerName);
      
      if (rwCheck.onList) {
        logBoth('VERIFY', `⚠️ ${result.playerName} is FLAGGED on RuneWatch`, logs);
        const modRole = await message.guild.roles.fetch(MOD_ROLE_ID);
        const logsChannel = await message.client.channels.fetch(BOTLOGS_CHANNEL_ID);
        
        if (logsChannel) {
          let modPing = modRole ? `${modRole} ` : '';
          await logsChannel.send(`⚠️ ${modPing}**${result.playerName}** (${message.author.username}) - FLAGGED on RuneWatch\n\`\`\`\n${logs.join('\n')}\n\`\`\``);
        }
      } else {
        logBoth('VERIFY', `✅ ${result.playerName} - Clean on RuneWatch`, logs);
        await sendBotLog(message.client, `✅ **${result.playerName}** (${message.author.username}) - PASSED\n\`\`\`\n${logs.join('\n')}\n\`\`\``);
      }
    } else {
      logBoth('VERIFY', `Player failed verification`, logs);
      await thread.send(`Unfortunately you don't meet the HMT requirements.`);
      await sendBotLog(message.client, `❌ **${result.playerName}** (${message.author.username}) - FAILED\n\`\`\`\n${logs.join('\n')}\n\`\`\``);
    }
  }
};
