const config = require('../config');

const Discord = require('discord.js');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');

const client = new Discord.Client();
const app = express();

let guild;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! Displaying ${config.staffRoles.length} roles publicly!`);

    if (client.guilds.get(config.guildID)) {
        guild = client.guilds.get(config.guildID);
    } else return console.error(`This discord bot is not in the guild *${config.guildID}*! Exiting..`);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.get('*', (req, res) => {
    try {
        let results = {};

        config.staffRoles.forEach(roleID => {
            let role = guild.roles.get(roleID);
            results[role.name] = role.members.map(m => m.tag);
        });

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
let port = exports.port;
httpServer.listen(port, (err) => {
    if (err) {
        return console.error(`FAILED TO OPEN WEB SERVER, ERROR: ${err.stack}`);
    }
    console.info(`Successfully started webserver... listening on port: ${config.port}`);
});