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

minecraftBot.on("login", async => {
    console.log(`Minecraft Bot logged in!`)
    settings = reload(`./settings.json`)
    minecraftBot.chat(settings.minecraftbot.hubcommand)
    
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
        message += text;1
      }
    })
  }

  if (message.replace(/\s/g, '').length > 1) {
    if (message.length > 1){
      console.log(message)
    }
  }  else return

  settings = reload(`./settings.json`)
  let containsb = false

  let array = settings.minecraftbot.blacklistedcharacters
  for (var i = 0; i < array.length; i++) {
    if (message.includes(array[i])) return containsb = true;
  }

  setTimeout(() => {
    if (containsb == false) {
      let array2 = settings.minecraftbot.phrasestotrack
      for (var i = 0; i < array2.length; i++) {
        if (message.toLowerCase().includes(array2[i].toLowerCase())) {

          let alertchannel = client.channels.resolve(settings.discordbot.alertchannelid)

          if (settings.discordbot.alertroleid !== null && settings.discordbot.alertroleid !== "none") {
            if(settings.discordbot.tagonalert == true){
                alertchannel.send(`<@&${settings.discordbot.alertroleid}>`)
            }
          }

          setTimeout(() => {
            alertchannel.send(message)
          }, 200);
        }
      }
    }
  }, 500);
})

// Discord Bot:

const client = new discord.Client()

client.login(settings.discordbot.token)

client.on("ready", async =>{

  // Log that the discord bot has logged in:
  console.log(`The Discord Bot is logged in as: ${client.user.tag}`)

  // Set the activity message:
  if (settings.discordbot.activitymessage !== null && settings.discordbot.activitymessage !== "none") {
    client.user.setActivity(settings.discordbot.activitymessage)
  }

})

client.on("message", async message => {

  // Only listen to some messages:
  if (message.guild.id !== settings.discordbot.serverid) return
  if (!message.content.startsWith(settings.discordbot.prefix)) return
  if (message.content.slice(1) == null) return
  if (message.author.bot) return

  // Defining commands:
  const args = argsf(message);
  const command = args.shift().toLowerCase();

  // Command Handler:
  if (command == "help") {
    message.delete()
    settings = reload(`./settings.json`)
    let prefix = settings.discordbot.prefix

    let em = new discord.MessageEmbed()
      .setColor(settings.discordbot.color)
      .setTimestamp()
      .setAuthor("Help")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Commands:\n${prefix}help - This command, lists the commands.\n${prefix}sudo - Make the bot say something ingame.\n${prefix}list - Lists key phrases to find in chat!\n${prefix}removekeyphrase - Removes a key phrase to search for.\n${prefix}addkeyphrase - Adds a key phrase to search for.`)
    message.channel.send(em)
  }

  if (command == "sudo") {
    message.delete()
    minecraftBot.chat(args.join(" "))

    let em = new discord.MessageEmbed()
      .setColor(settings.discordbot.color)
      .setTimestamp()
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`The bot said: \`${args.join(" ")}\``)
      .setAuthor("Sudo")
    message.channel.send(em)
  }

  if (command == "list") {
    message.delete()
    settings = reload("./settings.json")

    let em = new discord.MessageEmbed()
      .setColor(settings.discordbot.color)
      .setTimestamp()
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
      .setAuthor("Key Phrases")
    message.channel.send(em)

  }

  if (command == "removekeyphrase") {
    message.delete()
    settings = reload("./settings.json")

    if (!args[0]) return message.channel.send(`Say a phrase to remove!`)
    let remove = args.join(" ")
    if (!settings.minecraftbot.phrasestotrack.includes(remove)) return message.channel.send(`Not a tracked phrase!`)

    settings.minecraftbot.phrasestotrack.filter(a => a !== remove)
    fs.writeFileSync(`./settings.json`, JSON.stringify(settings, null, 2));

    settings = reload("./settings.json")

    let em = new discord.MessageEmbed()
      .setColor(settings.discordbot.color)
      .setTimestamp()
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Updated phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
      .setAuthor("Key Phrases")
    message.channel.send(em)

  }

  if (command == "addkeyphrase") {
    message.delete()
    settings = reload("./settings.json")

    if (!args[0]) return message.channel.send(`Say a phrase to add!`)
    let add = args.join(" ")

    if (settings.minecraftbot.phrasestotrack.includes(add)) return message.channel.send(`Already in!`)

    settings.minecraftbot.phrasestotrack.push(add)
    fs.writeFileSync(`./settings.json`, JSON.stringify(settings, null, 2));

    settings = reload("./settings.json")

    let em = new discord.MessageEmbed()
      .setColor(settings.discordbot.color)
      .setTimestamp()
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Updated phrases to look for:\n${settings.minecraftbot.phrasestotrack.join(`\n`) || "None!"}`)
      .setAuthor("Key Phrases")
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