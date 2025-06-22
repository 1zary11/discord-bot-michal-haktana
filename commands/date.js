const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('date')
        .setDescription('Move yourself and another user to the date channel!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Select a user to move with you')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetChannelId = '1251966706126159953';
        const user1 = interaction.member;
        const user2 = interaction.options.getMember('user');
        const guild = interaction.guild;

        // Check if both users are in a voice channel
        if (!user1.voice.channel || !user2 || !user2.voice.channel) {
            return interaction.reply({
                content: 'Both users must be connected to a voice channel to be moved.',
                ephemeral: true
            });
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        const targetChannel = guild.channels.cache.get(targetChannelId);
        if (!targetChannel) {
            return interaction.reply({
                content: 'Target voice channel not found.',
                ephemeral: true
            });
        }
        if (!targetChannel.permissionsFor(botMember).has('MoveMembers')) {
            return interaction.reply({
                content: 'I do not have permission to move members to the date channel.',
                ephemeral: true
            });
        }

        try {
            await user1.voice.setChannel(targetChannelId);
            await user2.voice.setChannel(targetChannelId);
            await interaction.reply({
                content: 'You have been moved to the date channel!',
                ephemeral: false
            });
        } catch (error) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: 'Failed to move users. Please check my permissions and try again.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'Failed to move users. Please check my permissions and try again.',
                    ephemeral: true
                });
            }
        }
    },
};
