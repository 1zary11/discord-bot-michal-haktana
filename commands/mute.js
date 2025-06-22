// Handles the /mute command
const { SlashCommandBuilder } = require('discord.js');
const { followedUsers } = require('../utils/state');
const { joinAndListen, startTagging, stopGag } = require('../utils/gag');
const { GENERAL_CHANNEL_NAME } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('עוקב אחרי האדם אשר בוצע עליו הפקודה ומשגע לו את התחת')
        .addUserOption(option => option.setName('user').setDescription('הקורבן 😉').setRequired(true))
        .addIntegerOption(option => option.setName('time').setDescription('זמן (בשניות)  (0 = ♾️)').setRequired(true)),
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
        await interaction.reply({ content: `שלטת את אבוש על ${userToGag.username}${duration > 0 ? ` ל ${duration} שניות` : ' indefinitely'}.`, ephemeral: true });
    }
};
