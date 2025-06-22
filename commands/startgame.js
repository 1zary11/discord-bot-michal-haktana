// Handles the /startgame command
const { SlashCommandBuilder } = require('discord.js');
const { gameState } = require('../utils/state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startgame')
        .setDescription('Mutes everyone in the voice channel to start the game.'),
    async execute(interaction) {
        const member = interaction.member;
        if (!member.voice.channel) {
            return interaction.reply({ content: '🚫 You need to be in a voice channel to start a game!', ephemeral: true });
        }
        await interaction.deferReply();
        const voiceChannel = member.voice.channel;
        gameState.set(interaction.guild.id, {
            voiceChannelId: voiceChannel.id,
            mutedPlayers: new Set()
        });
        const mutePromises = [];
        for (const [_, m] of voiceChannel.members) {
            if (!m.user.bot) mutePromises.push(m.voice.setMute(true, 'Game Started'));
        }
        await Promise.all(mutePromises);
        await interaction.editReply(`🔇 Game started! All players muted in ${voiceChannel.name}.`);
    }
};
