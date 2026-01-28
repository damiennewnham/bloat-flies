import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStats, HiScoresError, PlayerNotFoundError } from 'osrs-json-hiscores';

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

    let player;

    // Retry logic for temporary hiscores downtime
    for (let i = 0; i < 2; i++) {
      try {
        player = await getStats(username);
        break;
      } catch (err) {
        if (err instanceof HiScoresError) {
          await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
        } else if (err instanceof PlayerNotFoundError) {
          return interaction.editReply(`❌ Player **${username}** not found on OSRS hiscores.`);
        } else {
          console.error(err);
          return interaction.editReply('💀 Failed to fetch stats for this player.');
        }
      }
    }

    if (!player) {
      return interaction.editReply(
        '⏳ OSRS hiscores are temporarily unavailable. Please try again later.'
      );
    }

    const data = player[player.mode];
    if (!data?.skills || !data?.bosses) {
      return interaction.editReply(`⚠️ Could not read stats for **${username}**`);
    }

    // HMT Requirements
    const requirements = {
      attack: 80,
      defence: 80,
      strength: 99,
      ranged: 99,
      magic: 99,
      prayer: 77
    };

    const failed = [];

    // Check skills
    const skillInfo = {};
    for (const [skill, required] of Object.entries(requirements)) {
      const level = data.skills[skill]?.level ?? 0;
      skillInfo[skill] = level;
      if (level < required) {
        failed.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} (${level} / ${required})`);
      }
    }

    // Check TOB KC (normal + hard mode)
    const tobKCNormal = data.bosses?.theatreOfBlood?.score ?? 0;
    const tobKCHard = data.bosses?.theatreOfBloodHardMode?.score ?? 0;
    const totalTOBKC = tobKCNormal + tobKCHard;

    if (totalTOBKC < 100) {
      failed.push(`TOB KC (${totalTOBKC} / 100)`);
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`🦆 ${player.name} Verification`)
      .setColor(failed.length === 0 ? 0x57f287 : 0xed4245) // green if passed, red if failed
      .addFields(
        { name: 'Status', value: failed.length === 0 ? '✅ PASSED' : '❌ FAILED' },
        { name: 'Missing Requirements', value: failed.length ? failed.join('\n') : 'None' },

      );

    // If passed, add full stats info
    if (failed.length === 0) {
      embed.addFields(
        { name: 'ToB KC', value: tobKCNormal.toString(), inline: true },
        { name: 'HMT KC', value: tobKCHard.toString(), inline: true },
      );
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
