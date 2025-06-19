# discord-bot-michal-haktana
This is a discord bot...

## Setup Instructions

To set up this project, run the following commands in your project directory:

```
npm init -y
npm i discord.js dotenv
```

- `npm init -y` initializes a new Node.js project and creates a `package.json` file with default settings.
- `npm i discord.js dotenv` installs the required dependencies:
  - `discord.js` is the main library for interacting with the Discord API and building your bot.
  - `dotenv` allows you to load environment variables from a `.env` file, which is useful for keeping sensitive data (like your bot token) out of your code.

After running these commands, you can start developing and running your Discord bot.

## Running the Bot

To start the bot, use one of the following commands in your project directory:

```
node index.js
```

Or, if you have a `start` script in your `package.json`, you can use:

```
npm start
```

This will launch your Discord bot.