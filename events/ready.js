// Handles the ready event
const { registerCommands } = require('../utils/registerCommands');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        await registerCommands();
    }
};
