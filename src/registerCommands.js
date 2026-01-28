import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [];
const commandsPath = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// ---- DEV: register for your guild (instant) ----
try {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('✅ Registered guild commands!');
} catch (err) {
  console.error(err);
}

// ---- OPTIONAL: register globally (production, 1hr delay) ----
// try {
//   await rest.put(
//     Routes.applicationCommands(process.env.CLIENT_ID),
//     { body: commands }
//   );
//   console.log('✅ Registered global commands!');
// } catch (err) {
//   console.error(err);
// }
