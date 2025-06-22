const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    name: 'joinvoice',
    data: new SlashCommandBuilder()
        .setName('joinvoice')
        .setDescription('Bot joins your current voice channel'),
    async execute(interaction) {
        try {
            const member = interaction.member;
            if (!member) {
                await interaction.reply({ content: 'Error: No member found.', ephemeral: true });
                return;
            }
            const channel = member.voice.channel;
            if (!channel) {
                await interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
                return;
            }
            await interaction.deferReply({ ephemeral: true });
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });
            await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
            await interaction.editReply({ content: 'Joined your channel!' });
        } catch (err) {
            console.error('Error in /joinvoice:', err);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: 'An error occurred.' });
                } else {
                    await interaction.reply({ content: 'An error occurred.', ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to send error reply:', e);
            }
        }
    },
};