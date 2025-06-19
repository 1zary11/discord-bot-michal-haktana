// Utility functions for gag logic, tagging, and stopping gags
const { getVoiceConnection, entersState, VoiceConnectionStatus, EndBehaviorType, joinVoiceChannel } = require('@discordjs/voice');
const { GENERAL_CHANNEL_NAME, TAG_INTERVAL_SECONDS } = require('./config');
const { followedUsers } = require('./state');

async function joinAndListen(member) {
    const guild = member.guild;
    const userId = member.id;
    if (!member.voice.channel.joinable) return;
    try {
        if (member.voice.serverMute) await member.voice.setMute(false, 'Preparing the gag.');
        const connection = joinVoiceChannel({
            channelId: member.voice.channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        const audioStream = connection.receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 100 } });
        audioStream.once('data', async () => {
            try {
                if (!member.voice.serverMute) await member.voice.setMute(true, 'Gagged after speaking.');
                if (!audioStream.destroyed) audioStream.destroy();
            } catch {}
        });
    } catch (error) {
        getVoiceConnection(guild.id)?.destroy();
    }
}

async function startTagging(guild, userId) {
    const followedUser = followedUsers.get(userId);
    if (!followedUser || followedUser.taggingInterval) return;
    const generalChannel = guild.channels.cache.find(
        ch => ch.name.toLowerCase() === GENERAL_CHANNEL_NAME && ch.type === 0 // GuildText
    );
    if (!generalChannel) return;
    generalChannel.send(`<@${userId}> אבא מחכה`);
    const interval = setInterval(() => {
        generalChannel.send(`<@${userId}> אבא מחכה`);
    }, TAG_INTERVAL_SECONDS * 1000);
    followedUsers.get(userId).taggingInterval = interval;
}

async function stopGag(guild, userId) {
    const followedUser = followedUsers.get(userId);
    if (!followedUser) return;
    if (followedUser.taggingInterval) clearInterval(followedUser.taggingInterval);
    if (followedUser.unmuteTimeout) clearTimeout(followedUser.unmuteTimeout);
    getVoiceConnection(guild.id)?.destroy();
    try {
        const member = await guild.members.fetch(userId);
        if (member?.voice.serverMute) await member.voice.setMute(false, 'Gag removed by command/timeout.');
    } catch {}
    followedUsers.delete(userId);
}

module.exports = {
    joinAndListen,
    startTagging,
    stopGag,
};
