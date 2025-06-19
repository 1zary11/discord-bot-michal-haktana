// Handles the /endmeeting command
const { gameState } = require('../utils/state');

module.exports = {
    name: 'endmeeting',
    async execute(interaction) {
        const gameData = gameState.get(interaction.guild.id);
        if (!gameData) {
            return interaction.reply({ content: '❌ No active game! Start a game with /startgame first.', ephemeral: true });
        }
        await interaction.deferReply();
        const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
        if (!voiceChannel) return interaction.editReply('❌ Voice channel not found!');
        const mutePromises = [];
        for (const [_, m] of voiceChannel.members) {
            if (!m.user.bot) mutePromises.push(m.voice.setMute(true, 'Meeting Ended'));
        }
        await Promise.all(mutePromises);
        await interaction.editReply('🤫 Meeting ended! All players muted again.');
    }
};
