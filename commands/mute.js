// Handles the /mute command
const { followedUsers } = require('../utils/state');
const { joinAndListen, startTagging, stopGag } = require('../utils/gag');
const { GENERAL_CHANNEL_NAME } = require('../utils/config');

module.exports = {
    name: 'mute',
    async execute(interaction) {
        const { guild, options, user } = interaction;
        const userToGag = options.getUser('user');
        const duration = options.getInteger('time');
        if (userToGag.bot) return interaction.reply({ content: "למה שתעשה את זה על בוט, מוזר", ephemeral: true });
        if (followedUsers.has(userToGag.id)) return interaction.reply({ content: `${userToGag.username} כבר מקבל חזק.`, ephemeral: true });
        if (user.id === '774221048774000650') return interaction.reply({ content: 'סתום תפה נועם', ephemeral: true });
        const gaggedMember = await guild.members.fetch(userToGag.id).catch(() => null);
        if (!gaggedMember) return interaction.reply({ content: '.לא בשרת (או שיחה)', ephemeral: true });
        let unmuteTimeout = null;
        if (duration > 0) {
            unmuteTimeout = setTimeout(() => {
                stopGag(guild, userToGag.id);
                const generalChannel = guild.channels.cache.find(ch => ch.name === GENERAL_CHANNEL_NAME);
                if (generalChannel) generalChannel.send(`<@${userToGag.id}> היה כיף, אבוא בפעם הבאה 😉😉😉.`);
            }, duration * 1000);
        }
        followedUsers.set(userToGag.id, { guildId: guild.id, unmuteTimeout, taggingInterval: null });
        if (gaggedMember.voice.channel) {
            await joinAndListen(gaggedMember);
        } else {
            await startTagging(guild, userToGag.id);
        }
        await interaction.reply({ content: `שלחת את אבוש על ${userToGag.username}${duration > 0 ? ` ל ${duration} שניות` : ' indefinitely'}.`, ephemeral: true });
    }
};
