// Plays a specific MP3 when a specific user joins a voice channel, then leaves after playback
// Requires @discordjs/voice and a local mp3 file (e.g., './audio/special.mp3')
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('path');

const SPECIAL_USER_ID = '986592650566172732';
const SPECIAL_MP3_PATH = path.join(__dirname, '../audio/special.mp3'); // Place your mp3 here

async function playSpecialAudioOnJoin(oldState, newState) {
    // Only trigger when the user joins a voice channel
    if (newState.id !== SPECIAL_USER_ID) return;
    if (!newState.channel || oldState.channelId === newState.channelId) return;

    const channel = newState.channel;
    const guild = newState.guild;
    const member = newState.member;
    if (!channel || !member) return;

    // Join the voice channel
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch (error) {
        connection.destroy();
        return;
    }

    // Play the audio
    const player = createAudioPlayer();
    const resource = createAudioResource(SPECIAL_MP3_PATH);
    connection.subscribe(player);

    player.on('error', error => {
        console.error('Audio player error:', error.message);
    });
    player.on(AudioPlayerStatus.Playing, () => {
        console.log('Audio is now playing!');
    });
    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio finished, disconnecting.');
        connection.destroy();
    });

    player.play(resource);
}

module.exports = { playSpecialAudioOnJoin };
