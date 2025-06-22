// Handles the /date command
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('date')
        .setDescription('Move yourself and another user to the date channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to move with you')
                .setRequired(true)),
    async execute(interaction) {
        const { guild, member } = interaction;
        const targetChannel = guild.channels.cache.get('1251966706126159953');
        if (!targetChannel || targetChannel.type !== 2) { // 2 = GuildVoice
            return interaction.reply({ content: 'Target channel not found or is not a voice channel.', ephemeral: true });
        }
        let movedSelf = false;
        if (member.voice.channel) {
            try {
                await member.voice.setChannel(targetChannel);
                movedSelf = true;
            } catch {}
        }
        let movedOther = false;
        const otherUser = interaction.options.getUser('user');
        if (otherUser) {
            try {
                const otherMember = await guild.members.fetch(otherUser.id);
                if (otherMember && otherMember.voice.channel) {
                    await otherMember.voice.setChannel(targetChannel);
                    movedOther = true;
                }
            } catch {}
        }
        if (movedSelf || movedOther) {
            return interaction.reply({ content: 'Moved you and the selected user (if in a voice channel) to the date channel!', ephemeral: true });
        } else {
            return interaction.reply({ content: 'Neither you nor the selected user are in a voice channel.', ephemeral: true });
        }
    }
};
