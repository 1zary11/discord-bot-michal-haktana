const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState,
    EndBehaviorType,
} = require('@discordjs/voice');

// --- Configuration ---
const TOKEN = 'MTM4NTIzOTAwOTIzNTgyODkwOQ.GaHQN7.Vjx9K7Tnsvvp7XTyhrjC--VOfpJmKUNpj37deE';
const CLIENT_ID = '1385239009235828909';
const GENERAL_CHANNEL_NAME = 'צאט-ראשי🌏'; // The name of the channel to tag the user in
const TAG_INTERVAL_SECONDS = 60; // How often to tag the user when they are not in a VC

// --- State Management ---
// A map to hold state about the user being followed
const followedUsers = new Map(); // { userId: { guildId, unmuteTimeout, taggingInterval } }

// --- Create Discord Client ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required for message content in v14+
    ]
});

// --- Slash Commands Definition ---
const commands = [
    new SlashCommandBuilder()
        .setName('startgame')
        .setDescription('Mutes everyone in the voice channel to start the game.'),
    new SlashCommandBuilder()
        .setName('endmeeting')
        .setDescription('Mutes everyone in the voice channel after a meeting.'),
    new SlashCommandBuilder()
        .setName('endgame')
        .setDescription('Unmutes everyone in the voice channel and ends the game.'),
    new SlashCommandBuilder()
        .setName('report')
        .setDescription('Unmutes players for a meeting, keeping specified users muted.')
        .addUserOption(option => 
            option.setName('user1')
                .setDescription('A user to keep muted.')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user2')
                .setDescription('Another user to keep muted.')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('user3')
                .setDescription('Another user to keep muted.')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('.עוקב אחרי האדם אשר בוצע עליו הפקודה ומשגע לו את התחת')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('הקורבן 😉')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('זמן (בשניות)  (0 = ♾️)')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('.משחרר את האדם (כנראה נועם) לחופשי')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('הבר מזל')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user2')
                .setDescription('Another user to unmute.')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('user3')
                .setDescription('Another user to unmute.')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('date')
        .setDescription('Special command for a specific user.'),
];

// --- Command Registration ---
const rest = new REST({ version: '10' }).setToken(TOKEN);
async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands.map(command => command.toJSON()) }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}


// --- Core Gag Logic ---

/**
 * Makes the bot join the user's voice channel and listen for them to speak.
 * @param {import('discord.js').GuildMember} member The member to follow and listen to.
 */
async function joinAndListen(member) {
    const guild = member.guild;
    const userId = member.id;

    // Ensure the bot has permissions to join and speak
    if (!member.voice.channel.joinable) {
        console.log(`Cannot join voice channel ${member.voice.channel.name}. Missing permissions.`);
        return;
    }

    try {
        // Unmute the user initially so they *can* speak, triggering the trap.
        if (member.voice.serverMute) {
            await member.voice.setMute(false, 'Preparing the gag.');
        }

        const connection = joinVoiceChannel({
            channelId: member.voice.channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false, // We need to hear the user
        });

        // Wait for the connection to be ready before proceeding
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        console.log(`Joined ${member.voice.channel.name} to follow ${member.user.tag}.`);

        // Create a listener for the user's audio
        const audioStream = connection.receiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 100,
            },
        });

        // When the user starts speaking for the first time, mute them.
        audioStream.once('data', async () => {
            console.log(`Speech detected from ${member.user.tag}. Muting.`);
            try {
                if (!member.voice.serverMute) {
                    await member.voice.setMute(true, 'Gagged after speaking.');
                    console.log(`Successfully muted ${member.user.tag}.`);
                }
                // Stop listening after the deed is done for this channel session.
                if (!audioStream.destroyed) {
                    audioStream.destroy();
                }
            } catch (muteError) {
                console.error(`Failed to mute ${member.user.tag} after speaking:`, muteError);
            }
        });

    } catch (error) {
        console.error(`Error in joinAndListen for ${member.user.tag}:`, error);
        getVoiceConnection(guild.id)?.destroy();
    }
}

/**
 * Starts an interval to tag the user in the general channel.
 * @param {import('discord.js').Guild} guild The guild where this is happening.
 * @param {string} userId The ID of the user to tag.
 */
async function startTagging(guild, userId) {
    const followedUser = followedUsers.get(userId);
    if (!followedUser || followedUser.taggingInterval) return; // Already tagging or no longer followed

    const generalChannel = guild.channels.cache.find(
        ch => ch.name.toLowerCase() === GENERAL_CHANNEL_NAME && ch.type === ChannelType.GuildText
    );

    if (!generalChannel) {
        console.error(`Could not find a #${GENERAL_CHANNEL_NAME} text channel.`);
        return;
    }

    console.log(`User ${userId} is not in a voice channel. Starting to tag...`);
    
    // Tag immediately, then start the interval
    generalChannel.send(`<@${userId}> אבא מחכה`);
    const interval = setInterval(() => {
        generalChannel.send(`<@${userId}> אבא מחכה`);
    }, TAG_INTERVAL_SECONDS * 1000);

    followedUsers.get(userId).taggingInterval = interval;
}

/**
 * Stops all gag-related activities for a user.
 * @param {import('discord.js').Guild} guild The guild.
 * @param {string} userId The user's ID.
 */
async function stopGag(guild, userId) {
    const followedUser = followedUsers.get(userId);
    if (!followedUser) return;

    console.log(`Stopping all gag activities for user ${userId}.`);

    // Clear any running timers or intervals
    if (followedUser.taggingInterval) clearInterval(followedUser.taggingInterval);
    if (followedUser.unmuteTimeout) clearTimeout(followedUser.unmuteTimeout);

    // Disconnect the bot from the voice channel
    getVoiceConnection(guild.id)?.destroy();

    // Ensure the user is unmuted
    try {
        const member = await guild.members.fetch(userId);
        if (member?.voice.serverMute) {
            await member.voice.setMute(false, 'Gag removed by command/timeout.');
        }
    } catch (error) {
        // This can fail if the user left the server, which is fine.
        console.error(`Could not fetch member ${userId} to unmute them. They may have left.`, error);
    }

    // Remove from tracking
    followedUsers.delete(userId);
}


// --- Event Handlers ---

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || !interaction.inGuild()) return;

    const { commandName, options, member, guild } = interaction;

    // Check for administrator permissions
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && commandName !== 'date') {
        return interaction.reply({ content: '!רק הראויים ביותר יכולים להשתמש בפקודה הזו', ephemeral: true });
    }

    if (commandName === 'date') {
        // Move both the command user and the specific user to the target channel
        const targetChannelId = '1251966706126159953';
        const targetChannel = guild.channels.cache.get(targetChannelId);
        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
            return interaction.reply({ content: 'Target channel not found or is not a voice channel.', ephemeral: true });
        }
        // Move the command user if in a voice channel
        let movedSelf = false;
        if (member.voice.channel) {
            try {
                await member.voice.setChannel(targetChannel);
                movedSelf = true;
            } catch {}
        }
        // Move the specific user if in a voice channel
        let movedOther = false;
        try {
            const otherMember = await guild.members.fetch('774221048774000650');
            if (otherMember && otherMember.voice.channel) {
                await otherMember.voice.setChannel(targetChannel);
                movedOther = true;
            }
        } catch {}
        if (movedSelf || movedOther) {
            return interaction.reply({ content: 'Moved you and the special user (if in a voice channel) to the date channel!', ephemeral: true });
        } else {
            return interaction.reply({ content: 'Neither you nor the special user are in a voice channel.', ephemeral: true });
        }
    }

    if (commandName === 'mute') {
        const userToGag = options.getUser('user');
        const duration = options.getInteger('time');

        if (userToGag.bot) {
            return interaction.reply({ content: "למה שתעשה את זה על בוט, מוזר", ephemeral: true });
        }
        if (followedUsers.has(userToGag.id)) {
            return interaction.reply({ content: `${userToGag.username} כבר מקבל חזק.`, ephemeral: true });
        }
        if (interaction.user.id === '774221048774000650') {
            return interaction.reply({ content: 'סתום תפה נועם', ephemeral: true });
        }

        const gaggedMember = await guild.members.fetch(userToGag.id).catch(() => null);
        if (!gaggedMember) {
            return interaction.reply({ content: '.לא בשרת (או שיחה)', ephemeral: true });
        }

        console.log(`Starting gag on ${userToGag.tag} for ${duration > 0 ? duration + 's' : 'indefinitely'}.`);

        let unmuteTimeout = null;
        if (duration > 0) {
            unmuteTimeout = setTimeout(() => {
                console.log(`Gag duration ended for ${userToGag.tag}.`);
                stopGag(guild, userToGag.id);
                const generalChannel = guild.channels.cache.find(ch => ch.name === GENERAL_CHANNEL_NAME);
                if (generalChannel) {
                    generalChannel.send(`<@${userToGag.id}> היה כיף, אבוא בפעם הבאה 😉😉😉.`);
                }
            }, duration * 1000);
        }

        followedUsers.set(userToGag.id, {
            guildId: guild.id,
            unmuteTimeout: unmuteTimeout,
            taggingInterval: null,
        });

        // Check user's current voice state and act accordingly
        if (gaggedMember.voice.channel) {
            await joinAndListen(gaggedMember);
        } else {
            await startTagging(guild, userToGag.id);
        }

        await interaction.reply({
            content: `שלחת את אבוש על ${userToGag.username}${duration > 0 ? ` ל ${duration} שניות` : ' indefinitely'}.`,
            ephemeral: true
        });

    } else if (commandName === 'unmute') {
        const userToUnGag = options.getUser('user');

        if (!followedUsers.has(userToUnGag.id)) {
            // Still try to unmute them just in case
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

        await interaction.reply({
            content: `בסדר בסדר, אני אשחרר מ- ${userToUnGag.username}.`,
            ephemeral: true
        });
    }
});

// The main handler for following the user
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if the user is someone we are following
    if (!followedUsers.has(newState.id)) return;

    const guild = newState.guild;
    const member = newState.member;
    const { taggingInterval } = followedUsers.get(newState.id);

    // CASE 1: User joins or switches voice channels.
    if (newState.channel) {
        console.log(`Followed user ${member.user.tag} joined/switched to ${newState.channel.name}.`);
        // Stop tagging them if we were.
        if (taggingInterval) {
            clearInterval(taggingInterval);
            followedUsers.get(newState.id).taggingInterval = null;
        }
        // Follow them into the new channel.
        await joinAndListen(member);
    }
    // CASE 2: User leaves a voice channel entirely.
    else if (oldState.channel && !newState.channel) {
        console.log(`Followed user ${member.user.tag} left all voice channels.`);
        // Disconnect the bot.
        getVoiceConnection(guild.id)?.destroy();
        // Start tagging them.
        await startTagging(guild, newState.id);
    }
});


// --- Login ---
client.login(TOKEN);




















// amongus 

































// Store game state: { guildId: { voiceChannelId, mutedPlayers: Set } }
const gameState = new Map();

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'startgame':
                await startGame(interaction);
                break;
            case 'report':
                await handleReport(interaction);
                break;
            case 'endmeeting':
                await endMeeting(interaction);
                break;
            case 'endgame':
                await endGame(interaction);
                break;
        }
    } catch (error) {
        console.error(error);
        const replyOptions = { content: '❌ An error occurred while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

async function startGame(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
        return interaction.reply({ content: '🚫 You need to be in a voice channel to start a game!', ephemeral: true });
    }
    await interaction.deferReply();

    const voiceChannel = member.voice.channel;
    gameState.set(interaction.guild.id, {
        voiceChannelId: voiceChannel.id,
        mutedPlayers: new Set()
    });

    const mutePromises = [];
    for (const [memberId, member] of voiceChannel.members) {
        if (!member.user.bot) {
            mutePromises.push(member.voice.setMute(true, 'Game Started'));
        }
    }

    await Promise.all(mutePromises);
    await interaction.editReply(`🔇 Game started! All players muted in ${voiceChannel.name}.`);
}

async function handleReport(interaction) {
    const gameData = gameState.get(interaction.guild.id);
    if (!gameData) {
        return interaction.reply({ content: '❌ No active game! Start a game with /startgame first.', ephemeral: true });
    }
    await interaction.deferReply();

    const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
    if (!voiceChannel) {
        return interaction.editReply('❌ Voice channel not found!');
    }

    // Add mentioned users to the permanent mute list for this game
    const usersToKeepMuted = [];
    ['user1', 'user2', 'user3'].forEach(optionName => {
        const user = interaction.options.getUser(optionName);
        if (user) {
            usersToKeepMuted.push(user);
            gameData.mutedPlayers.add(user.id);
        }
    });

    // Unmute everyone except the permanently muted players
    const promises = [];
    for (const [memberId, member] of voiceChannel.members) {
        if (member.user.bot) continue;
        const shouldMute = gameData.mutedPlayers.has(member.id);
        promises.push(member.voice.setMute(shouldMute, 'Meeting Started'));
    }

    await Promise.all(promises);
    const mutedUserMentions = usersToKeepMuted.map(u => `<@${u.id}>`).join(', ');
    await interaction.editReply(`📢 Meeting started! The following players remain muted: ${mutedUserMentions || 'None'}`);
}

async function endMeeting(interaction) {
    const gameData = gameState.get(interaction.guild.id);
    if (!gameData) {
        return interaction.reply({ content: '❌ No active game! Start a game with /startgame first.', ephemeral: true });
    }
    await interaction.deferReply();

    const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
    if (!voiceChannel) {
        return interaction.editReply('❌ Voice channel not found!');
    }

    const mutePromises = [];
    for (const [memberId, member] of voiceChannel.members) {
        if (!member.user.bot) {
            mutePromises.push(member.voice.setMute(true, 'Meeting Ended'));
        }
    }

    await Promise.all(mutePromises);
    await interaction.editReply('🤫 Meeting ended! All players muted again.');
}

async function endGame(interaction) {
    const gameData = gameState.get(interaction.guild.id);
    if (!gameData) {
        return interaction.reply({ content: '❌ No active game to end!', ephemeral: true });
    }
    await interaction.deferReply();

    const voiceChannel = interaction.guild.channels.cache.get(gameData.voiceChannelId);
    if (voiceChannel) {
        const unmutePromises = [];
        for (const [memberId, member] of voiceChannel.members) {
            if (!member.user.bot) {
                unmutePromises.push(member.voice.setMute(false, 'Game Ended'));
            }
        }
        await Promise.all(unmutePromises);
    }

    gameState.delete(interaction.guild.id);
    await interaction.editReply('🎉 Game ended! All players have been unmuted.');
}

client.once('ready', () => {
    console.log(`${client.user.tag} is ready`);
});









/////////////////////////////////////////////////



// Login to Discord with your client's token
// client.login(config.token);