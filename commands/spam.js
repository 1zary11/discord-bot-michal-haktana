// Handles the /spam command
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Send a message multiple times.')
        .addStringOption(option => option.setName('text').setDescription('Text to spam').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('How many times to send').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        let amount = interaction.options.getInteger('amount');
        if (amount < 1) {
            await interaction.reply({ content: 'Amount must be at least 1.', ephemeral: true });
            return;
        }
        if (amount > 30) {
            await interaction.reply({ content: 'Amount too high (max 30).', ephemeral: true });
            return;
        }
        for (let i = 0; i < amount; i++) {
            await interaction.channel.send(text);
        }
        await interaction.deleteReply();
    },
};
