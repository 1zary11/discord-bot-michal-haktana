// Registers slash commands with Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { TOKEN, CLIENT_ID } = require('./config');

const commands = [
    new SlashCommandBuilder().setName('startgame').setDescription('Mutes everyone in the voice channel to start the game.'),
    new SlashCommandBuilder().setName('endmeeting').setDescription('Mutes everyone in the voice channel after a meeting.'),
    new SlashCommandBuilder().setName('endgame').setDescription('Unmutes everyone in the voice channel and ends the game.'),
    new SlashCommandBuilder().setName('report').setDescription('Unmutes players for a meeting, keeping specified users muted.')
        .addUserOption(option => option.setName('user1').setDescription('A user to keep muted.').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('Another user to keep muted.').setRequired(false))
        .addUserOption(option => option.setName('user3').setDescription('Another user to keep muted.').setRequired(false)),
    new SlashCommandBuilder().setName('mute').setDescription('.עוקב אחרי האדם אשר בוצע עליו הפקודה ומשגע לו את התחת')
        .addUserOption(option => option.setName('user').setDescription('הקורבן 😉').setRequired(true))
        .addIntegerOption(option => option.setName('time').setDescription('זמן (בשניות)  (0 = ♾️)').setRequired(true)),
    new SlashCommandBuilder().setName('unmute').setDescription('.משחרר את האדם (כנראה נועם) לחופשי')
        .addUserOption(option => option.setName('user').setDescription('הבר מזל').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('Another user to unmute.').setRequired(false))
        .addUserOption(option => option.setName('user3').setDescription('Another user to unmute.').setRequired(false)),
    new SlashCommandBuilder().setName('date').setDescription('Special command for a specific user.'),
    new SlashCommandBuilder().setName('spam').setDescription('Send a message multiple times.')
        .addStringOption(option => option.setName('text').setDescription('Text to spam').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('How many times to send').setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands.map(command => command.toJSON()) }
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
