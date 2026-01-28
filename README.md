# Bloat-Flies Discord Bot not by root

A Discord bot for HMT Learner Hub communitity, focused on verifying player eligibility for HMT/TOB learner hubs, with automatic gear screenshot detection, RuneWatch integration, and detailed logging.

---

## Features

- **Slash Commands**: `/stats`, `/verify`
- **Automatic Verification**: Detects gear screenshots in specified channels, verifies stats/KC, and prompts for IGN if needed
- **Manual Verification**: `/verify` command for mods/admins
- **RuneWatch Integration**: Checks players against the RuneWatch watchlist
- **Detailed Embeds**: Shows pass/fail status and missing requirements
- **Comprehensive Logging**: All actions and results are logged to a designated botlogs channel
- **Configurable**: Channel and role IDs are set in `config.json`
- **Graceful Error Handling**: Handles hiscores downtime, invalid names, and permission issues

---

## Setup

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/bloat-flies.git
cd bloat-flies
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_guild_id
```

### 4. Configure Channels and Roles

Edit `config.json`:

```json
{
  "channels": {
    "verify": "YOUR_VERIFY_CHANNEL_ID",
    "test": "YOUR_TEST_CHANNEL_ID",
    "botlogs": "YOUR_BOTLOGS_CHANNEL_ID"
  },
  "roles": {
    "helper": "YOUR_HELPER_ROLE_ID",
    "mod": "YOUR_MOD_ROLE_ID"
  }
}
```

### 5. Register Slash Commands

```sh
node src/registerCommands.js
```

### 6. Start the Bot

```sh
npm start
```

---

## Usage

### Automatic Verification

- **Where:** Only in channels specified in `config.json` (`verify` and `test`)
- **How:** User uploads a gear screenshot
- **What happens:**
  - Bot creates a thread and attempts to verify using server nickname/global name
  - If not found, prompts user for IGN (up to 2 attempts)
  - Checks stats and KC against HMT requirements
  - Checks RuneWatch watchlist
  - Logs all actions to the botlogs channel
  - If flagged on RuneWatch, pings the mod role

### Manual Verification

- **Command:** `/verify [username]`
- **Who:** Mods/admins
- **What happens:**
  - Checks stats and KC
  - Checks RuneWatch
  - Logs results to botlogs

---

## Permissions

- **Bot must have:**
  - `Read Messages`
  - `Send Messages`
  - `Create Public Threads`
  - `Manage Nicknames` (for nickname updates)
  - `Embed Links`
  - `Read Message History`
  - `Attach Files` (if needed)
  - `Use Application Commands`

- **Bot role must be above members it needs to change nicknames for.**

---

## Logging

- All verification attempts, results, and errors are logged to the channel specified as `botlogs` in `config.json`.
- Logs include detailed debug info for troubleshooting.

---

## RuneWatch Integration

- The bot fetches the latest RuneWatch watchlist from:  
  `https://runewatch.com/api/cases/mixedlist`
- If a player is found on the list, the bot logs the case details and pings the mod role.

---

## Troubleshooting

- **Bot not responding?**  
  Check that your `.env` and `config.json` are correct, and that the bot has all required permissions.
- **Nickname not updating?**  
  Ensure the bot's role is higher than the user's role.
- **Slash commands not appearing?**  
  Re-run `node src/registerCommands.js` and make sure your `GUILD_ID` is correct.

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue for major changes.

---

## License

MIT

---

*Built for HMT Learner Community by Ducky
