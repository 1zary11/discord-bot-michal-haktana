// Handles the /report command
const { SlashCommandBuilder } = require('discord.js');
const { gameState } = require('../utils/state');

// Add a name property for command registration
module.exports = {
    name: 'report',
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Unmutes players for a meeting, keeping specified users muted.')
        .addUserOption(option => option.setName('user1').setDescription('A user to keep muted.').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('Another user to keep muted.').setRequired(false))
        .addUserOption(option => option.setName('user3').setDescription('Another user to keep muted.').setRequired(false)),
    async execute(interaction) {
        const gameData = gameState.get(interaction.guild.id);
        if (!gameData) {
            return interaction.reply({ content: '❌ No active game! Start a game with /startgame first.', ephemeral: true });
        }
        await interaction.deferReply();
        const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
        if (!voiceChannel) return interaction.editReply('❌ Voice channel not found!');
        const usersToKeepMuted = [];
        ['user1', 'user2', 'user3'].forEach(optionName => {
            const user = interaction.options.getUser(optionName);
            if (user) {
                usersToKeepMuted.push(user);
                gameData.mutedPlayers.add(user.id);
            }
        });
        const promises = [];
        for (const [_, m] of voiceChannel.members) {
            if (m.user.bot) continue;
            const shouldMute = gameData.mutedPlayers.has(m.id);
            promises.push(m.voice.setMute(shouldMute, 'Meeting Started'));
        }
        await Promise.all(promises);
        const mutedUserMentions = usersToKeepMuted.map(u => `<@${u.id}>`).join(', ');
        await interaction.editReply(`📢 Meeting started! The following players remain muted: ${mutedUserMentions || 'None'}`);
    }
};
