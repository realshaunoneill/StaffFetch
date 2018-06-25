const config = require('../config');
const quotes = require('../data/quotes');

const Discord = require('discord.js');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');

const client = new Discord.Client();
const app = express();

let guild;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! Displaying ${[...config.ownerRoles, ...config.adminRoles, ...config.modRoles].length} roles publicly!`);

    if (client.guilds.get(config.guildID)) {
        guild = client.guilds.get(config.guildID);
    } else return console.error(`This discord bot is not in the guild *${config.guildID}*! Exiting..`);
});

client.on('message', message => {
    let allStaffRoles = [...config.ownerRoles, ...config.adminRoles, ...config.modRoles];

    if (message.isMentioned(client.user)) return message.reply('Do ```/staffquote <Your quote>``` to save your quote for the website!').delete(1000).catch(err => {
    });

    if (!message.content.startsWith('/staffquote ')) return;

    if (!message.member.roles.some(role => allStaffRoles.includes(role.id))) {
        return message.author.send(`Sorry but you don't appear to have any of the following staff roles: \`\`\`${allStaffRoles}\`\`\``).catch(err => {
        });
    }

    let msgSplit = message.content.split(' ').slice(1);

    let authorID = message.author.id;
    quotes[authorID] = msgSplit.join(' ');

    console.info(`Saved new quote for *${message.author.tag}* - ${msgSplit.join(' ')}`);

    saveQuotesToFile();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.get('*', (req, res) => {
    try {

        let owners = [];
        let admins = [];
        let mods = [];

        config.ownerRoles.forEach(roleID => {
            let role = guild.roles.get(roleID);
            owners = [...owners, ...role.members.map(m => {
                return {
                    id: m.user.id,
                    username: m.user.username,
                    tag: m.user.tag,
                    picture: m.user.displayAvatarURL,
                    quote: quotes[m.user.id] || `None supplied!`,
                    status: m.user.presence.status || 'offline'
                }
            })];
        });

        config.adminRoles.forEach(roleID => {
            let role = guild.roles.get(roleID);
            admins = [...admins, ...role.members.map(m => {
                return {
                    id: m.user.id,
                    username: m.user.username,
                    tag: m.user.tag,
                    picture: m.user.displayAvatarURL,
                    quote: quotes[m.user.id] || `None supplied!`,
                    status: m.user.presence.status || 'offline'
                }
            })];
        });

        config.modRoles.forEach(roleID => {
            let role = guild.roles.get(roleID);
            mods = [...mods, ...role.members.map(m => {
                return {
                    id: m.user.id,
                    username: m.user.username,
                    tag: m.user.tag,
                    picture: m.user.displayAvatarURL,
                    quote: quotes[m.user.id] || `None supplied!`
                }
            })];
        });

        // Filter roles
        mods = mods.filter(s => {
            return admins.every(staff => staff.id !== s.id)
        });
        admins = admins.filter(s => {
            return owners.every(staff => staff.id !== s.id)
        });

        let results = {owners: owners, admins: admins, mods: mods};

        res.status(200).json(results);

    } catch (err) {
        console.error(`Error fetching staff team, Error: ${err.stack}`);
    }
});

// Login to discord
if (config.discordToken) client.login(config.discordToken).catch(err => {
    console.error(`Unable to login to discord, Error: ${err.stack}`);
});

// Final webserver
const httpServer = http.createServer(app);
let port = config.port;
httpServer.listen(port, (err) => {
    if (err) {
        return console.error(`FAILED TO OPEN WEB SERVER, ERROR: ${err.stack}`);
    }
    console.info(`Successfully started webserver... listening on port: ${config.port}`);
});

function saveQuotesToFile() {
    try {
        fs.writeFileSync(path.join(__dirname, '../data/quotes.json'), JSON.stringify(quotes));
    } catch (err) {
        console.error(`Error saving quotes to file, Error: ${err.stack}`);
    }
}