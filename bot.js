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
    legitPanelChannelID: $'1510734576459321496',
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
    console.log(`👤 Zalogowano jako: \({client.user.tag}`);
});

function parseDuration(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])\)/i);
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
    return `\({minutes}m`;
}

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
                .setDescription(`⛔ \){message.author}, **nie możesz wysyłać linków!**\nTylko Administracja ma do tego uprawnienia.`)
                .setFooter({ text: '🌴 TitanLAND | Zakaz reklam' });
            const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            return;
        }
    }

    if (message.content === '!test') {
        await message.reply('✅ Test udany! Bot działa!');
        return;
    }

    if (message.content === '!cennik') {
        const embed = new EmbedBuilder()
            .setTitle('💰 TITANLAND - CENNIK')
            .setColor(0xFFD700)
            .setDescription(
                '**📦 CENY TITANÓW:**\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '📱 **CENA BLIK:**\n' +
                '🔹 1x Titan | **1,35 zł**\n' +
                '🔹 5x Titanów | **1,20 zł / sztuka**\n' +
                '🔹 10x+ Titanów | **1,10 zł / sztuka**\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '💳 **CENA PSC:**\n' +
                '✅ Stała cena: **1,70 zł / sztuka**\n' +
                'dla dowolnej ilości Titanów\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '**💳 METODY PŁATNOŚCI:**\n' +
                '📱 Blik | 💳 PaySafeCard'
            )
            .setFooter({ text: '🌴 TitanLAND | Najlepsze ceny!' });
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (message.content === '!metody-platnosci') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('💳 METODY PŁATNOŚCI')
            .setColor(0xFFD700)
            .setDescription('📱 **BLIK**\n\n💳 **PSC**');
        await message.channel.send({ embeds: [embed] });
    }

    if (message.content === '!regulamin') {
        const regulaminEmbed = new EmbedBuilder()
            .setTitle('📜 REGULAMIN SERWERA TITANLAND')
            .setColor(0xFF4444)
            .setDescription(
                '**Witaj na serwerze TitanLAND! 🌴**\n' +
                'Zapoznaj się z regulaminem przed korzystaniem z serwera.\n' +
                'Nieznajomość regulaminu nie zwalnia z jego przestrzegania!'
            )
            .addFields(
                {
                    name: '👥 ZASADY OGÓLNE',
                    value:
                        '**1.** Szanuj innych użytkowników\n' +
                        '**2.** Zakaz wyzywania i prowokowania\n' +
                        '**3.** Zakaz treści +18 / NSFW (porno, erotyka, linki)\n' +
                        '**4.** Nie spamuj wiadomościami ani emoji\n' +
                        '**5.** Nie nadużywaj pingów (@everyone, @here, administracja)\n' +
                        '**6.** Zakaz reklam bez zgody administracji\n' +
                        '**7.** Pisz na odpowiednich kanałach\n' +
                        '**8.** Słuchaj administracji',
                    inline: false
                },
                {
                    name: '🛒 ZAKUPY I USŁUGI',
                    value:
                        '**9.** Zakaz jakiejkolwiek sprzedaży na serwerze\n' +
                        '**10.** Nie zwracamy pieniędzy za zakupiony przedmiot\n' +
                        '**11.** Administratorzy mają **12h** aby dostarczyć zamówienie\n' +
                        '**12.** Nie odpowiadamy za zbanowane konto Roblox lub włamanie',
                    inline: false
                },
                {
                    name: '⚠️ KARY',
                    value:
                        'Nieprzestrzeganie zasad = **mute / kick / ban**\n' +
                        'Administracja ma prawo do dania **mute bez podania powodu**',
                    inline: false
                }
            )
            .setFooter({ text: '🌴 TitanLAND | Korzystając z serwera akceptujesz regulamin' });
        await message.channel.send({ embeds: [regulaminEmbed] });
    }

    if (message.content === '!weryfikacja-panel') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('✅ WERYFIKACJA TITANLAND')
            .setColor(0x00FF00)
            .setDescription(
                '**🌴 Witaj na serwerze TitanLAND!**\n\n' +
                'Kliknij przycisk poniżej, aby się zweryfikować.\n' +
                'Po weryfikacji otrzymasz dostęp do wszystkich kanałów!\n\n' +
                '✅ *Zweryfikuj się teraz!*'
            )
            .setFooter({ text: 'TitanLAND | Weryfikacja' });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('✅ Zweryfikuj się')
                    .setStyle(ButtonStyle.Success)
            );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!zakup-panel') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('🛒 TITANLAND - ZAKUP TITANÓW')
            .setColor(0xFFD700)
            .setDescription(
                '**💎 Chcesz kupić Titana?**\n\n' +
                'Kliknij przycisk poniżej, aby rozpocząć zakup.\n' +
                'Wybierz metodę płatności i ilość Titanów!\n\n' +
                '🛒 *Rozpocznij zakup teraz!*'
            )
            .setFooter({ text: '🌴 TitanLAND | Zakup' });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_titan')
                    .setLabel('🛒 Kup Titana')
                    .setStyle(ButtonStyle.Primary)
            );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!legitcheck-panel') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('✅ TITANLAND - LEGITCHECK')
            .setColor(0x00FF00)
            .setDescription(
                '**🔒 Potwierdź swój zakup!**\n\n' +
                'Kliknij przycisk poniżej, aby utworzyć LegitCheck.\n' +
                'Podaj metodę płatności i ilość zakupionych Titanów.\n\n' +
                '✅ *Utwórz LegitCheck teraz!*'
            )
            .setFooter({ text: '🌴 TitanLAND | LegitCheck' });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_legitcheck')
                    .setLabel('✅ Utwórz LegitCheck')
                    .setStyle(ButtonStyle.Success)
            );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content.startsWith('!konkurs')) {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');

        const args = message.content.split(' ').slice(1);
        if (args.length < 3) {
            return message.reply('❌ **Nieprawidłowe użycie!**\n\nUżyj: `!konkurs <czas> <ilość_titanów> <ilość_wygranych>`\n\nPrzykład: `!konkurs 1h 10 3`\n- `1h` = 1 godzina (może być: 30m, 2h, 1d)\n- `10` = 10 Titanów do wygrania\n- `3` = 3 osoby mogą wygrać');
        }

        const timeStr = args[0];
        const titans = parseInt(args[1]);
        const winners = parseInt(args[2]);

        if (isNaN(titans) || titans <= 0) return message.reply('❌ Nieprawidłowa ilość Titanów!');
        if (isNaN(winners) || winners <= 0) return message.reply('❌ Nieprawidłowa ilość wygranych!');

        const duration = parseDuration(timeStr);
        if (!duration) return message.reply('❌ Nieprawidłowy format czasu! Użyj: `30m` (minuty), `1h` (godziny), `1d` (dni)');

        const konkursChannel = client.channels.cache.get(CONFIG.konkursChannelID);
        if (!konkursChannel) return message.reply('❌ Nie znaleziono kanału konkursów! Sprawdź konfigurację bota.');

        const endTime = Date.now() + duration;
        const contestId = `contest_${Date.now()}`;

        activeContests.set(contestId, {
            id: contestId,
            titans: titans,
            winners: winners,
            endTime: endTime,
            duration: duration,
            participants: new Set(),
            mess$ageId: null,
            channelId: konkursChannel.id
        });

        const endDate = new Date(endTime);
        const endTimeFormatted = endDate.toLocale
