import { SlashCommandBuilder } from 'discord.js';
import { verifyPlayer } from '../utils/verifyPlayer.js';

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

    await interaction.editReply({ embeds: [result.embed] });
  }
};
