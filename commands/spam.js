const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'spam',
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Spam a message a specified number of times')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to spam')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('How many times to send the message (max 30)')
                .setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        let count = interaction.options.getInteger('count');
        if (count > 30) count = 30;
        if (count < 1) count = 1;
        try {
            await interaction.deferReply({ ephemeral: true });
            for (let i = 0; i < count; i++) {
                await interaction.channel.send(message);
            }
            await interaction.editReply({ content: `Spammed "${message}" ${count} times.` });
        } catch (err) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
            }
            console.error('Spam command error:', err);
        }
    },
};
