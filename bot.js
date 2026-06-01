const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    ChannelType
} = require('discord.js');

// ========== EXPRESS (dla Render 24/7) ==========
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot TitanLAND jest online! 🌴');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

// ========== KONFIGURACJA ==========
const CONFIG = {
    guildID: '1510692131948466296',
    memberRoleID: '1510696852524240996',
    ownerRoleID: '1510698368286986482',
    legitCategoryID: '1510698503914131472',
    legitPanelChannelID: '1510734576459321496',
    legitResultChannelID: '1510698531068051610',
    adminChannelID: '1510794054814662727',
    konkursChannelID: '1510697605938544752'
};

const TOKEN = process.env.BOT_TOKEN;

const activeContests = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot TitanLAND jest online!`);
    console.log(`👤 Zalogowano jako: ${client.user.tag}`);
    console.log(`👀 Nasłuchuję na nowych członków...`);

    // Sprawdź czy kanał powitalny istnieje
    const welcomeChannel = client.channels.cache.get('1510833999159890161');
    if (welcomeChannel) {
        console.log(`✅ Kanał powitalny znaleziony: #${welcomeChannel.name}`);
    } else {
        console.log(`❌ KANAŁ POWITALNY NIE ZNALEZIONY! Sprawdź ID: 1510833999159890161`);
    }
});

// ========== POWITANIE NOWYCH UŻYTKOWNIKÓW (NAPRAWIONE) ==========
client.on('guildMemberAdd', async (member) => {
    console.log(`🔔 Nowy użytkownik dołączył: ${member.user.tag} (ID: ${member.id})`);
    
    // ID kanału "Witaj" - PODANE PRZEZ CIEBIE
    const welcomeChannelID = '1510833999159890161';
    
    try {
        const welcomeChannel = client.channels.cache.get(welcomeChannelID);
        
        if (!welcomeChannel) {
            console.error(`❌ NIE ZNALEZIONO KANAŁU POWITALNEGO! ID: ${welcomeChannelID}`);
            return;
        }

        console.log(`✅ Wysyłam powitanie dla ${member.user.tag} na 
