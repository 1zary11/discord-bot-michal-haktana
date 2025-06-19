// Handles the /unmute command
const { followedUsers } = require('../utils/state');
const { stopGag } = require('../utils/gag');

module.exports = {
    name: 'unmute',
    async execute(interaction) {
        const { guild, options } = interaction;
        const userToUnGag = options.getUser('user');
        if (!followedUsers.has(userToUnGag.id)) {
            try {
                const memberToUnmute = await guild.members.fetch(userToUnGag.id);
                if (memberToUnmute?.voice.serverMute) {
                    await memberToUnmute.voice.setMute(false);
                    return interaction.reply({ content: `אז הורדתי לו מיוט ${userToUnGag.username} אני לא כרגע מעצבן את.`, ephemeral: true });
                }
            } catch {}
            return interaction.reply({ content: `${userToUnGag.username} is not currently being gagged.`, ephemeral: true });
        }
        await stopGag(guild, userToUnGag.id);
        await interaction.reply({ content: `בסדר בסדר, אני אשחרר מ- ${userToUnGag.username}.`, ephemeral: true });
    }
};
