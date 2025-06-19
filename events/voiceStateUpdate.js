// Handles voiceStateUpdate event for gag logic
const { followedUsers } = require('../utils/state');
const { joinAndListen, startTagging } = require('../utils/gag');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        if (!followedUsers.has(newState.id)) return;
        const guild = newState.guild;
        const member = newState.member;
        const { taggingInterval } = followedUsers.get(newState.id);
        if (newState.channel) {
            if (taggingInterval) {
                clearInterval(taggingInterval);
                followedUsers.get(newState.id).taggingInterval = null;
            }
            await joinAndListen(member);
        } else if (oldState.channel && !newState.channel) {
            getVoiceConnection(guild.id)?.destroy();
            await startTagging(guild, newState.id);
        }
    }
};
