// State management for followed users and game state
const followedUsers = new Map(); // { userId: { guildId, unmuteTimeout, taggingInterval } }
const gameState = new Map(); // { guildId: { voiceChannelId, mutedPlayers: Set } }

module.exports = {
    followedUsers,
    gameState,
};
