// Variables:

const mineflayer = require("mineflayer") // What makes creating a minecraft bot possible
const discord = require("discord.js") // What makes creating a discord bot possible
const fs = require(`fs`) // FileService - Manages settings.json
let settings = require("./settings.json") // Settings file

// Minecraft Bot:

const minecraftBot = mineflayer.createBot({
  username: settings.minecraftbot.minecraftaccountemail,
  password: settings.minecraftbot.minecraftaccountpass,
  host: settings.minecraftbot.serverip,
  port: settings.minecraftbot.port,
  version: settings.minecraftbot.version
});

minecraftBot.on("login", async =>{
  console.log(`Minecraft Bot logged in!`)
  minecraftBot.chat(settings.minecraftbot.hubcommand)

  // Every 60 seconds send the hub command:
  setInterval(() => {
    settings = reload(`./settings.json`)
    minecraftBot.chat(settings.minecraftbot.hubcommand)
  }, 60000);
})

minecraftBot.on("message", json => {
  let message = "";
  if (json.extra != null) {
    json.extra.forEach(text => {
      if (text != null) {
        message += text;
      }
    })
  }

  if (message.replace(/\s/g, '').length <= 1 || message.length <= 1) return
  console.log(message)

  settings = reload(`./settings.json`)

  let array = settings.minecraftbot.blacklistedcharacters
  if (array.some(function(v) {
      return message.indexOf(v) >= 0;
    })) return
  else {

    let array2 = settings.minecraftbot.phrasestotrack
    if (array2.some(function(v) {
        return message.indexOf(v) >= 0;
      })) {

      let alertchannel = client.channels.resolve(settings.discordbot.alertchannelid)

      if (settings.discordbot.alertroleid !== null && settings.discordbot.alertroleid !== "none") {
        if (settings.discordbot.tagonalert == true) {
          alertchannel.send(`<@&${settings.discordbot.alertroleid}>`)
        }
      }

      setTimeout(() => {
        alertchannel.send(message)
      }, 200);
    }
  }
})

// Discord Bot:

const client = new discord.Client()

client.login(settings.discordbot.token)

client.on("ready", async =>{
  // Log that the discord bot has logged in:
  console.log(`The Discord Bot has logged in as: ${client.user.tag}`)

  // Set the activity message:
  if (settings.discordbot.activitymessage !== null && settings.discordbot.activitymessage !== "none") {
    client.user.setActivity(settings.discordbot.activitymessage)
  }

})

client.on("message", async message => {
  // Only listen to some messages:
  if (message.author.bot || message.content.slice(1) == null || message.guild.id !== settings.discordbot.serverid || !message.content.startsWith(settings.discordbot.prefix)) return

  // Defining commands:
  const args = argsf(message);
  const command = args.shift().toLowerCase();

  // Command Handler:
  if (command == "help") {
    message.delete()
    settings = reload(`./settings.json`)
    let prefix = settings.discordbot.prefix
    let em = emb(settings.discordbot.color, "Help", `Commands:\n${prefix}help - This command, lists the commands.\n${prefix}sudo - Make the bot say something ingame.\n${prefix}list - Lists key phrases to find in chat!\n${prefix}removekeyphrase - Removes a key phrase to search for.\n${prefix}addkeyphrase - Adds a key phrase to search for.`)
    message.channel.send(em)
  }

  if (command == "sudo") {
    if (!message.member.roles.cache.has(settings.discordbot.adminroleid)) return message.channel.send(`No Permission!`)
    message.delete()
    minecraftBot.chat(args.join(" "))

    let em = emb(settings.discordbot.color, "Sudo", `The bot said: \`${args.join(" ")}\``)
    message.channel.send(em)
  }

  if (command == "list") {
    if (!message.member.roles.cache.has(settings.discordbot.adminroleid)) return message.channel.send(`No Permission!`)
    message.delete()
    settings = reload("./settings.json")

    let em = emb(settings.discordbot.color, "Key Phrases", `Phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
    message.channel.send(em)
  }

  if (command == "removekeyphrase") {
    if (!message.member.roles.cache.has(settings.discordbot.adminroleid)) return message.channel.send(`No Permission!`)
    message.delete()
    settings = reload("./settings.json")

    if (!args[0]) return message.channel.send(`Say a phrase to remove!`)
    let remove = args.join(" ")
    if (!settings.minecraftbot.phrasestotrack.includes(remove)) return message.channel.send(`Not a tracked phrase!`)

    settings.minecraftbot.phrasestotrack.filter(a => a !== remove)
    fs.writeFileSync(`./settings.json`, JSON.stringify(settings, null, 2));

    settings = reload("./settings.json")
    let em = emb(settings.discordbot.color, "Key Phrases", `Updated phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
    message.channel.send(em)
  }

  if (command == "addkeyphrase") {
    if (!message.member.roles.cache.has(settings.discordbot.adminroleid)) return message.channel.send(`No Permission!`)
    message.delete()
    settings = reload("./settings.json")

    if (!args[0]) return message.channel.send(`Say a phrase to add!`)
    let add = args.join(" ")

    if (settings.minecraftbot.phrasestotrack.includes(add)) return message.channel.send(`Already in!`)

    settings.minecraftbot.phrasestotrack.push(add)
    fs.writeFileSync(`./settings.json`, JSON.stringify(settings, null, 2));

    settings = reload("./settings.json")

    let em = emb(settings.discordbot.color, "Key Phrases", `Updated phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
    message.channel.send(em)
  }

})

// Various Functions:

function argsf(message) {
  settings = reload("./settings.json")
  return message.content.slice(settings.discordbot.prefix.length).split(' ');
}

function reload(f) {
  delete require.cache[require.resolve(f)];
  return require(f);
}

function emb(color, author, desc) {
  return em = new discord.MessageEmbed().setColor(color).setTimestamp().setAuthor(author).setThumbnail(client.user.displayAvatarURL()).setDescription(desc)
}
