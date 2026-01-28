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

export default {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only process in guild channels
    if (!message.guild) return;

    // Only process in allowed channels
    if (!VERIFY_CHANNELS.includes(message.channelId)) {
      console.log(`[VERIFY] Ignored message in channel ${message.channelId} (not in verify/test channels)`);
      return;
    }

    // Only process if message has attachments (images)
    if (!message.attachments || message.attachments.size === 0) {
      console.log(`[VERIFY] Ignored message from ${message.author.username} - no attachments`);
      return;
    }

    // Check if any attachment is an image
    const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));
    if (!hasImage) {
      console.log(`[VERIFY] Ignored message from ${message.author.username} - no images`);
      return;
    }

    console.log(`[VERIFY] Processing verification for ${message.author.username} in channel ${message.channelId}`);

    // Get the user's server nickname or username
    const member = await message.guild.members.fetch(message.author.id);
    let displayName = member.nickname !== null ? member.nickname : message.author.username;
    console.log(`[VERIFY] Discord name: ${displayName} (nickname: ${member.nickname}, username: ${message.author.username})`);

    // Create a thread for verification
    const thread = await message.startThread({
      name: `Verifying ${displayName}`,
      autoArchiveDuration: 1440 // 24 hours
    });
    console.log(`[VERIFY] Created thread: ${thread.id}`);

    // Send initial message
    await thread.send(`⏳ Verifying **${displayName}**...`);

    // Try to verify with their Discord name/nickname
    console.log(`[VERIFY] Attempting verification with Discord name: ${displayName}`);
    let result = await verifyPlayer(displayName);

    // If not found, ask for IGN
    if (result.error && result.error.includes('not found')) {
      console.log(`[VERIFY] Player not found as ${displayName}, requesting IGN`);
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
        console.log(`[VERIFY] Received IGN: ${ign}`);

        // Update their server nickname
        try {
          await member.setNickname(ign);
          console.log(`[VERIFY] Updated nickname to: ${ign}`);
        } catch (err) {
          console.error(`[VERIFY] Failed to update nickname:`, err.message);
          await thread.send(`⚠️ Could not update your server nickname, but I'll verify with IGN: **${ign}**`);
        }

        // Rerun verification with the provided IGN
        console.log(`[VERIFY] Rerunning verification with IGN: ${ign}`);
        result = await verifyPlayer(ign);

        if (result.error) {
          console.log(`[VERIFY] Error on retry:`, result.error);
          return await thread.send(result.error);
        }
      } catch (err) {
        console.error(`[VERIFY] Timeout or error waiting for IGN:`, err.message);
        return await thread.send('⏱️ Verification timed out. Please try again by posting another message.');
      }
    }

    // Handle verification result
    if (result.error) {
      console.log(`[VERIFY] Verification error:`, result.error);
      return await thread.send(result.error);
    }

    // Send the verification embed
    const response = await thread.send({ embeds: [result.embed] });
    console.log(`[VERIFY] Sent verification embed - Status: ${result.success ? 'PASSED' : 'FAILED'}`);

    // If passed, ping the helper role
    if (result.success) {
      const helperRole = await message.guild.roles.fetch(HELPER_ROLE_ID);
      if (helperRole) {
        console.log(`[VERIFY] Player passed! Pinging Helper role`);
        await thread.send(`${helperRole} - ${message.author} is ready for HMT!`);
      } else {
        console.error(`[VERIFY] Helper role ${HELPER_ROLE_ID} not found`);
      }
    } else {
      console.log(`[VERIFY] Player failed verification`);
    }
  }
};
