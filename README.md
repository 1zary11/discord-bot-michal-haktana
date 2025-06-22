# discord-bot-michal-haktana
This is a Discord bot designed to help manage voice channels and user interactions for games and meetings on your Discord server.

## Features & Commands

### /startgame
Mutes everyone in your current voice channel and marks the start of a game session.
- **Usage:** `/startgame`
- **Note:** You must be in a voice channel to use this command.

### /endgame
Unmutes everyone in the game voice channel and ends the game session.
- **Usage:** `/endgame`
- **Note:** Only works if a game is active.

### /report
Unmutes all players for a meeting, but keeps up to three specified users muted (e.g., for reporting or discussion phases).
- **Usage:** `/report user1 [user2] [user3]`
  - `user1` (required): The user to keep muted.
  - `user2`, `user3` (optional): Additional users to keep muted.
- **Note:** Only works if a game is active.

### /endmeeting
Mutes everyone in the game voice channel again after a meeting.
- **Usage:** `/endmeeting`
- **Note:** Only works if a game is active.

### /mute
Mutes (gags) a specific user for a set duration (in seconds) or indefinitely.
- **Usage:** `/mute user time`
  - `user` (required): The user to mute.
  - `time` (required): Duration in seconds (0 for indefinite).
- **Note:** Some responses may be in Hebrew.

### /unmute
Unmutes a specific user (removes gag). You can specify up to three users.
- **Usage:** `/unmute user [user2] [user3]`
  - `user` (required): The user to unmute.
  - `user2`, `user3` (optional): Additional users to unmute.

### /spam
Sends a message multiple times in the current channel.
- **Usage:** `/spam text amount`
  - `text` (required): The message to send.
  - `amount` (required): Number of times to send (1-30).

### /date
Moves you and another user to a special "date" voice channel (if both are in a voice channel).
- **Usage:** `/date user`
  - `user` (required): The user to move with you.

## Setup Instructions

To set up this project, run the following command in your project directory:

```
npm install
```

- `npm install` will install all required dependencies listed in your `package.json`.

After running this command, you can start developing and running your Discord bot.

## Running the Bot

To start the bot, use one of the following commands in your project directory:

```
node .\bot.js
```

Or, if you have a `start` script in your `package.json`, you can use:

```
npm start
```

This will launch your Discord bot.