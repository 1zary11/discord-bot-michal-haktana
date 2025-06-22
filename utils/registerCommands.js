// Registers slash commands with Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { TOKEN, CLIENT_ID } = require('./config');
const fs = require('fs');
const path = require('path');

// Dynamically load all commands from the commands directory
function getAllSlashCommands() {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    const allCommands = [];
    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        if (command.data && typeof command.data.toJSON === 'function') {
            allCommands.push(command.data.toJSON());
        }
    }
    return allCommands;
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        const allCommands = getAllSlashCommands();
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: allCommands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

async function clearCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: [] }
        );
        console.log('Successfully cleared all application (/) commands.');
    } catch (error) {
        console.error('Error clearing commands:', error);
    }
}

// To clear all commands, run: clearCommands();
// To register commands, run: registerCommands();

module.exports = { registerCommands, clearCommands };
