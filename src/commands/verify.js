import { SlashCommandBuilder } from 'discord.js';
import { verifyPlayer } from '../utils/verifyPlayer.js';
import { checkRunewatch } from '../utils/checkRuneWatch.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8'));

const MOD_ROLE_ID = config.roles.mod;
const BOTLOGS_CHANNEL_ID = config.channels.botlogs;

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Check HMT Learner Hub requirements')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('OSRS username')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    await interaction.deferReply();

    const result = await verifyPlayer(username);

    if (result.error) {
      return await interaction.editReply(result.error);
    }

    // Check runewatch if verification passed
    if (result.success) {
      console.log(`[RUNEWATCH] Checking ${result.playerName} on RuneWatch (manual verify)`);
      const rwCheck = await checkRunewatch(result.playerName);
      
      if (rwCheck.onList) {
        console.log(`[RUNEWATCH] ${result.playerName} - FLAGGED on RuneWatch (manual verify)`);
        const guild = interaction.guild;
        const modRole = await guild.roles.fetch(MOD_ROLE_ID);
        const logsChannel = await interaction.client.channels.fetch(BOTLOGS_CHANNEL_ID);
        
        if (logsChannel) {
          let modPing = modRole ? `${modRole} ` : '';
          await logsChannel.send(`⚠️ ${modPing}**${result.playerName}** - FLAGGED on RuneWatch (Manual Verify by ${interaction.user.username})\n**Reason:** ${rwCheck.data.reason}\n**Evidence Rating:** ${rwCheck.data.evidence_rating}/5`);
        }
      } else {
        console.log(`[RUNEWATCH] ${result.playerName} - Clean on RuneWatch (manual verify)`);
        const logsChannel = await interaction.client.channels.fetch(BOTLOGS_CHANNEL_ID);
        if (logsChannel) {
          await logsChannel.send(`✅ **${result.playerName}** - PASSED (Manual Verify by ${interaction.user.username})`);
        }
      }
    }

    await interaction.editReply({ embeds: [result.embed] });
  }
};
