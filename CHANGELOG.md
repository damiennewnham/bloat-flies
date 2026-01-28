# Changelog

All notable changes to the Bloat-Flies Discord bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-28

### Added
- **Auto-Verification on Image Upload**
  - Monitors image uploads in configured `verify` and `test` channels
  - Automatically creates verification threads
  - Resolves Discord nickname → OSRS username lookup
  - Asks for IGN if Discord name not found (up to 2 attempts)
  - Updates server nickname on successful verification

- **RuneWatch Integration**
  - Checks players against official RuneWatch watchlist API
  - Fetches from `https://runewatch.com/api/cases/mixedlist`
  - Logs flagged cases with reason and evidence rating
  - Pings mod role when player is flagged

- **Manual Verify Command**
  - `/verify [username]` slash command
  - Runs HMT verification checks
  - Integrates RuneWatch checking
  - Logs results to botlogs channel

- **Comprehensive Logging**
  - All verification attempts logged to designated botlogs channel
  - Debug tags: `[VERIFY]`, `[HISCORES]`, `[CHECK]`, `[RESULT]`
  - Audit trail of who verified whom and results

- **Configuration System**
  - `config.json` for channel and role management
  - Eliminates hardcoding of IDs
  - Easy to deploy across multiple servers

- **Graceful Error Handling**
  - 2-attempt retry logic for hiscores API
  - Fallback to global name if nickname not available
  - Handles missing hiscores accounts
  - Handles RuneWatch API failures

### Technical
- Discord.js v14.25.1 integration
- Guild-based slash commands (instant updates, no 1-hour delay)
- Event-driven architecture with auto-loading
- OSRS hiscores API integration via osrs-json-hiscores library
- Railway deployment ready

---

## [0.2.0] - 2026-01-20

### Added
- **Manual /stats Command**
  - Basic player stats lookup
  - Displays combat level and total level

### Fixed
- Resolved config path issues in Railway deployment
- Fixed event name from `clientReady` to `ready` for Discord.js compatibility

---

## [0.1.0] - 2026-01-15

### Added
- **Initial Bot Setup**
  - Basic Discord.js bot framework
  - Dynamic command and event loading
  - Guild-based slash command registration
  - `/verify` command (basic version)
  - HMT requirement validation logic
    - Attack: 80+
    - Defence: 80+
    - Strength: 99
    - Ranged: 99
    - Magic: 99
    - Prayer: 77+
    - Theatre of Blood KC: 100+
  - Colored embed responses (green for pass, red for fail)

---

## Known Issues

- **Nickname Update Permission**: Bot requires role hierarchy to update user nicknames. If bot's role is below target user's role, nickname updates will fail gracefully.
- **Hiscores API**: OSRS hiscores API occasionally has downtime. Bot implements 2-attempt retry with 2-second delay.

---

## Deployment

- **Platform**: Railway
- **Start Command**: `npm start` (runs registerCommands.js then bot.js)
- **Environment**: Node.js 21-22

