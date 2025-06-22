// Handles voiceStateUpdate event for gag logic
const { followedUsers } = require('../utils/state');
const { joinAndListen, startTagging } = require('../utils/gag');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus, getVoiceConnection, StreamType } = require('@discordjs/voice');
const path = require('path');

// The user ID to monitor
const TARGET_USER_ID = '986592650566172732';
// The filename of the MP3 to play (must be in the bot's root directory)
const MP3_FILENAME = 'sound.mp3';

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        // --- Existing gag logic ---
        if (!followedUsers.has(newState.id)) {
            // --- New logic for target user joining a voice channel ---
            // Only trigger when the user joins a different voice channel (not on camera/mute changes)
            if (
                newState.id === TARGET_USER_ID &&
                newState.channelId &&
                newState.channelId !== oldState.channelId &&
                newState.channel
            ) {
                try {
                    // Disconnect bot from any other voice channel in this guild
                    const existingConnection = getVoiceConnection(newState.guild.id);
                    if (existingConnection) {
                        existingConnection.destroy();
                    }

                    // Join the user's channel
                    const connection = joinVoiceChannel({
                        channelId: newState.channelId,
                        guildId: newState.guild.id,
                        adapterCreator: newState.guild.voiceAdapterCreator,
                        selfDeaf: false,
                    });
                    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

                    // Play the MP3 file (original, no ffmpeg/prism)
                    const player = createAudioPlayer();
                    const inputPath = path.join(__dirname, '..', MP3_FILENAME);
                    const resource = createAudioResource(inputPath);
                    connection.subscribe(player);
                    player.play(resource);

                    // Disconnect after playback ends
                    player.on(AudioPlayerStatus.Idle, () => {
                        connection.destroy();
                    });
                    player.on('error', (err) => {
                        console.error('Audio player error:', err);
                        connection.destroy();
                    });
                } catch (err) {
                    console.error('Voice join/playback error:', err);
                }
            }
            return;
        }
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
