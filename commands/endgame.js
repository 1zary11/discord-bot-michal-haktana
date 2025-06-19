// Handles the /endgame command
const { gameState } = require('../utils/state');

module.exports = {
    name: 'endgame',
    async execute(interaction) {
        const gameData = gameState.get(interaction.guild.id);
        if (!gameData) {
            return interaction.reply({ content: '❌ No active game to end!', ephemeral: true });
        }
        await interaction.deferReply();
        const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
        if (voiceChannel) {
            const unmutePromises = [];
            for (const [_, m] of voiceChannel.members) {
                if (!m.user.bot) unmutePromises.push(m.voice.setMute(false, 'Game Ended'));
            }
            await Promise.all(unmutePromises);
        }
        gameState.delete(interaction.guild.id);
        await interaction.editReply('🎉 Game ended! All players have been unmuted.');
    }
};
