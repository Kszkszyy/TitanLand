const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
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
  res.send('Bot TitanHUB jest online! 🌴');
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
    konkursChannelID: '1510697605938544752',
    welcomeChannelID: '1510833999159890161',
    pomocCategoryID: '',
    konkursOdbiorCategoryID: ''
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

// Funkcja usuwająca ephemeral wiadomości po 10 sekundach
const deleteAfter = (response) => {
    if (response) setTimeout(() => response.delete().catch(() => {}), 10000);
};

client.once('ready', async () => {
    console.log(`✅ Bot TitanHUB jest online!`);
    console.log(`👤 Zalogowano jako: ${client.user.tag}`);
    
    try {
        const legitChannel = client.channels.cache.get(CONFIG.legitResultChannelID);
        if (legitChannel) {
            const messages = await legitChannel.messages.fetch({ limit: 100 });
            const count = messages.filter(msg => 
                msg.embeds.length > 0 && msg.embeds[0].title?.includes('LegitCheck')
            ).size;
            const parts = legitChannel.name.split('_');
            const prefix = parts[0];
            await legitChannel.setName(`${prefix}_${count}`);
        }
    } catch (error) {
        console.error('❌ Błąd przy ustawianiu nazwy LegitCheck:', error.message);
    }
});

function parseDuration(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

function formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==================== KOMENDY ====================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    message.member.roles.cache.has(CONFIG.ownerRoleID);

    if (!isAdmin) {
        const linkRegex = /https?:\/\/[^\s]+/i;
        if (linkRegex.test(message.content)) {
            await message.delete().catch(() => {});
            const warningEmbed = new EmbedBuilder()
                .setColor(0xFF4444)
                .setDescription(`⛔ ${message.author}, **nie możesz wysyłać linków!**`)
                .setFooter({ text: '🌴 TitanHUB | Zakaz reklam' });
            const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            return;
        }
    }

    if (message.content === '!ticket-panel') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const embed = new EmbedBuilder()
            .setTitle('🎫 TICKETY TITANHUB')
            .setColor(0x9400D3)
            .setDescription('**Wybierz typ ticketu:**\n\n🛒 **Zakup** — Kupno Titanów\n❓ **Pomoc** — Zgłoszenia i pytania\n🏆 **Odbierz Konkurs** — Odbiór nagrody z konkursu')
            .setFooter({ text: '🌴 TitanHUB | Ticket' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('buy_titan').setLabel('🛒 Zakup').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('pomoc_ticket').setLabel('❓ Pomoc').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('odbierz_konkurs').setLabel('🏆 Odbierz Konkurs').setStyle(ButtonStyle.Success)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    if (message.content === '!test') return message.reply('✅ Test udany! Bot działa!');
    if (message.content === '!cennik') { /* Twój oryginalny kod cennika */ }
    if (message.content === '!metody-platnosci') { /* Twój oryginalny kod */ }
    if (message.content === '!regulamin') { /* Twój oryginalny kod */ }
    if (message.content === '!weryfikacja-panel') { /* Twój oryginalny kod */ }
    if (message.content === '!zakup-panel') { /* Twój oryginalny kod */ }
    if (message.content === '!legitcheck-panel') { /* Twój oryginalny kod */ }
    if (message.content.startsWith('!konkurs')) { /* Twój oryginalny kod konkursu */ }
    if (message.content === '!update-embeds') { /* Twój oryginalny kod update-embeds */ }
});

// ==================== INTERAKCJE ====================
client.on('interactionCreate', async (interaction) => {

    if (interaction.customId === 'pomoc_ticket') {
        const embed = new EmbedBuilder().setDescription('**❓ Wybierz typ pomocy:**').setColor(0xFFA500);
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('pomoc_select')
                .setPlaceholder('Wybierz typ pomocy...')
                .addOptions([
                    { label: '🚫 Zgłoś użytkownika', value: 'zgłoszenie', description: 'Zgłoś nieodpowiednie zachowanie' },
                    { label: '🐛 Znalazłem błąd', value: 'błąd', description: 'Raportuj błąd' },
                    { label: '❓ Potrzebuje pomocy', value: 'pomoc', description: 'Ogólna pomoc' }
                ])
        );
        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        deleteAfter(response);
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'pomoc_select') {
        const typ = interaction.values[0];
        const typNames = { zgłoszenie: 'zgłoszenie', błąd: 'błąd', pomoc: 'pomoc' };

        try {
            let category = interaction.guild.channels.cache.find(c => c.name.includes('pomoc') && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await interaction.guild.channels.create({
                    name: '❓・pomoc',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
                });
            }

            const channelName = `${typNames[typ]}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);

            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle('❓ Ticket Pomocy')
                .setColor(0xFFA500)
                .addFields(
                    { name: '👤 Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📋 Typ', value: `**${typ}**`, inline: true },
                    { name: '🕐 Utworzono', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                )
                .setFooter({ text: '🌴 TitanHUB | Pomoc' });

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij Ticket').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [closeRow] });

            const response = await interaction.reply({ content: `✅ Ticket pomocy został utworzony!\nTicket: ${ticketChannel}`, ephemeral: true });
            deleteAfter(response);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'odbierz_konkurs') {
        try {
            let category = interaction.guild.channels.cache.find(c => c.name.includes('odbiór-konkurs') && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await interaction.guild.channels.create({
                    name: '🏆・odbiór-konkurs',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
                });
            }

            const channelName = `odbiór-konkurs-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);

            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle('🏆 Odbiór Nagrody z Konkursu')
                .setColor(0xFF0000)
                .addFields(
                    { name: '👤 Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📋 Typ', value: '**Odbiór Konkursu**', inline: true },
                    { name: '🕐 Utworzono', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                )
                .setFooter({ text: '🌴 TitanHUB | Odbiór Konkursu' });

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij Ticket').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [closeRow] });

            const response = await interaction.reply({ content: `✅ Ticket do odbioru konkursu został utworzony!\nTicket: ${ticketChannel}`, ephemeral: true });
            deleteAfter(response);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
        }
        return;
    }

    // Reszta interakcji (zakup, legitcheck, close_ticket, verify, join_contest, modale)
    if (interaction.isButton() && interaction.customId === 'buy_titan') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x9400D3);
        const selectRow = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('payment_method').setPlaceholder('Wybierz metodę płatności...').addOptions([{label:'BLIK',value:'blik',emoji:'📱'},{label:'PSC',value:'psc',emoji:'💳'}]));
        const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
        deleteAfter(response);
        return;
    }

    if (interaction.isButton() && interaction.customId === 'create_legitcheck') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x00FF00);
        const selectRow = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('legitcheck_payment').setPlaceholder('Wybierz metodę płatności...').addOptions([{label:'BLIK',value:'blik',emoji:'📱'},{label:'PSC',value:'psc',emoji:'💳'}]));
        const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
        deleteAfter(response);
        return;
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket zostanie zamknięty za 3 sekundy...', ephemeral: true });
        setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) {} }, 3000);
        return;
    }

    // Dodaj tutaj swoje pozostałe interakcje (modale, verify, join_contest itd.)
});

client.login(TOKEN);
