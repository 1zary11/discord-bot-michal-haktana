// Handles interactionCreate event and dispatches to command modules
const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');

// Load all command modules
const commands = {};
const cmdDir = path.join(__dirname, '../commands');
fs.readdirSync(cmdDir).forEach(file => {
    if (file.endsWith('.js')) {
        const cmd = require(`../commands/${file}`);
        commands[cmd.name] = cmd;
    }
});

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand() || !interaction.inGuild()) return;
        const { commandName, member } = interaction;
        // Only admins can use most commands except 'date'
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && commandName !== 'date') {
            return interaction.reply({ content: '!רק הראויים ביותר יכולים להשתמש בפקודה הזו', ephemeral: true });
        }
        if (commands[commandName]) {
            await commands[commandName].execute(interaction, client);
        }
    }
};
