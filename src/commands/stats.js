import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStats, HiScoresError, PlayerNotFoundError } from 'osrs-json-hiscores';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Check basic OSRS stats for a player')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('OSRS username')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    await interaction.deferReply();

    let player;
    for (let i = 0; i < 2; i++) {
      try {
        player = await getStats(username);
        break;
      } catch (err) {
        if (!(err instanceof HiScoresError)) {
          console.error(err);
          return interaction.editReply('💀 Failed to fetch stats for this player');
        }
        await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
      }
    }

    if (!player) {
      return interaction.editReply(
        '⏳ OSRS hiscores are temporarily unavailable. Please try again later.'
      );
    }

    const data = player[player.mode];
    const overall = data.skills?.overall;

    const embed = new EmbedBuilder()
      .setTitle(`� Stats for ${player.name}`)
      .setColor(0x1abc9c)
      .addFields(
        { name: 'Mode', value: player.mode, inline: true },
        { name: 'Total Level', value: overall?.level?.toString() ?? 'N/A', inline: true },
        { name: 'Total XP', value: overall?.xp?.toLocaleString() ?? 'N/A', inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
