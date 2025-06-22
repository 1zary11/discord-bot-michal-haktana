// Registers slash commands with Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { TOKEN, CLIENT_ID } = require('./config');
const fs = require('fs');
const path = require('path');

// Dynamically load all command data from the commands directory
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
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
