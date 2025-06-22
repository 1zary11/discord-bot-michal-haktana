// Handles the /unmute command
const { SlashCommandBuilder } = require('discord.js');
const { followedUsers } = require('../utils/state');
const { stopGag } = require('../utils/gag');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('.משחרר את האדם (כנראה נועם) לחופשי')
        .addUserOption(option => option.setName('user').setDescription('הבר מזל').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('Another user to unmute.').setRequired(false))
        .addUserOption(option => option.setName('user3').setDescription('Another user to unmute.').setRequired(false)),
    async execute(interaction) {
        const { guild, options } = interaction;
        const userToUnGag = options.getUser('user');
        if (!followedUsers.has(userToUnGag.id)) {
            try {
                const memberToUnmute = await guild.members.fetch(userToUnGag.id);
                if (memberToUnmute?.voice.serverMute) {
                    await memberToUnmute.voice.setMute(false);
                    return interaction.reply({ content: `אז הורדתי לו מיות ${userToUnGag.username} אני לא כרגע מעצבן את.`, ephemeral: true });
                }
            } catch {}
            return interaction.reply({ content: `${userToUnGag.username} is not currently being gagged.`, ephemeral: true });
        }
        await stopGag(guild, userToUnGag.id);
        await interaction.reply({ content: `בסדר בסדר, אני אשחרר מ- ${userToUnGag.username}.`, ephemeral: true });
    }
};
