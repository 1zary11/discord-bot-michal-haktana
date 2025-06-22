// Handles the /date command
const { DATE_CHANNEL_ID, SPECIAL_USER_ID } = require('../utils/config');

module.exports = {
    data: {
        name: 'date',
        description: 'Move yourself and another user to the date channel',
        options: [
            {
                type: 6, // USER
                name: 'user',
                description: 'The user to move to the date channel',
                required: false
            }
        ]
    },
    name: 'date',
    async execute(interaction) {
        const { guild, member } = interaction;
        const targetChannel = guild.channels.cache.get(DATE_CHANNEL_ID);
        if (!targetChannel || targetChannel.type !== 2) { // 2 = GuildVoice
            return interaction.reply({ content: 'Target channel not found or is not a voice channel.', ephemeral: true });
        }
        let movedSelf = false;
        if (member.voice.channel) {
            try {
                await member.voice.setChannel(targetChannel);
                movedSelf = true;
            } catch {}
        }
        let movedOther = false;
        const userOption = interaction.options.getUser('user');
        let otherUserId = userOption ? userOption.id : SPECIAL_USER_ID;
        try {
            const otherMember = await guild.members.fetch(otherUserId);
            if (otherMember && otherMember.voice.channel) {
                await otherMember.voice.setChannel(targetChannel);
                movedOther = true;
            }
        } catch {}
        if (movedSelf || movedOther) {
            return interaction.reply({ content: 'Moved you and the selected user (if in a voice channel) to the date channel!', ephemeral: true });
        } else {
            return interaction.reply({ content: 'Neither you nor the selected user are in a voice channel.', ephemeral: true });
        }
    }
};
