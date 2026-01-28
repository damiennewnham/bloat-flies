import { ChannelType } from 'discord.js';
import { verifyPlayer } from '../utils/verifyPlayer.js';
import config from '../config.json' assert { type: 'json' };

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
    if (!VERIFY_CHANNELS.includes(message.channelId)) return;

    // Only process if message has attachments (images)
    if (!message.attachments || message.attachments.size === 0) return;

    // Check if any attachment is an image
    const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));
    if (!hasImage) return;

    // Get the user's server nickname or username
    const member = await message.guild.members.fetch(message.author.id);
    let displayName = member.nickname || message.author.username;

    // Create a thread for verification
    const thread = await message.startThread({
      name: `Verifying ${displayName}`,
      autoArchiveDuration: 1440 // 24 hours
    });

    // Send initial message
    await thread.send(`⏳ Verifying **${displayName}**...`);

    // Try to verify with their Discord name/nickname
    let result = await verifyPlayer(displayName);

    // If not found, ask for IGN
    if (result.error && result.error.includes('not found')) {
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

        // Update their server nickname
        try {
          await member.setNickname(ign);
        } catch (err) {
          console.error('Failed to update nickname:', err);
          await thread.send(`⚠️ Could not update your server nickname, but I'll verify with IGN: **${ign}**`);
        }

        // Rerun verification with the provided IGN
        result = await verifyPlayer(ign);

        if (result.error) {
          return await thread.send(result.error);
        }
      } catch (err) {
        return await thread.send('⏱️ Verification timed out. Please try again by posting another message.');
      }
    }

    // Handle verification result
    if (result.error) {
      return await thread.send(result.error);
    }

    // Send the verification embed
    const response = await thread.send({ embeds: [result.embed] });

    // If passed, ping the helper role
    if (result.success) {
      const helperRole = await message.guild.roles.fetch(HELPER_ROLE_ID);
      if (helperRole) {
        await thread.send(`${helperRole} - ${message.author} is ready for HMT!`);
      }
    }
  }
};
