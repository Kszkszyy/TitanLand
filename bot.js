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
  res.send('Bot TitanZone jest online! 🌴');
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
    welcomeChannelID: '1510833999159890161'
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

async function countLegitChecks(channel) {
    let lastId = null;
    let total = 0;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        total += messages.filter(msg =>
            msg.embeds.length > 0 &&
            msg.embeds[0].title &&
            msg.embeds[0].title.includes('LegitCheck')
        ).size;

        lastId = messages.last().id;

        if (messages.size < 100) break;
    }

    return total;
}

client.once('ready', async () => {
    console.log(`✅ Bot TitanZone jest online!`);
    console.log(`👤 Zalogowano jako: ${client.user.tag}`);
    
    try {
        const legitChannel = client.channels.cache.get(CONFIG.legitResultChannelID);
        
        if (!legitChannel) {
            console.log('❌ Kanał LegitCheck nie znaleziony!');
            return;
        }
        
        console.log(`📌 Kanał znaleziony: ${legitChannel.name}`);
        
        const count = await countLegitChecks(legitChannel);
        
        const parts = legitChannel.name.split('_');
        const prefix = parts[0];
        const newName = `${prefix}_${count}`;
        
        await legitChannel.setName(newName);
        console.log(`🔄 Zmieniono nazwę kanału na: ${newName}`);
        
    } catch (error) {
        console.error('❌ Błąd:', error.message);
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

client.on('guildMemberAdd', async (member) => {
    try {
        const welcomeChannel = client.channels.cache.get(CONFIG.welcomeChannelID);
        if (!welcomeChannel) {
            console.error('❌ Nie znaleziono kanału powitalnego!');
            return;
        }

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('👋 Witaj na MarketZone!')
            .setColor(0x00FF00)
            .setDescription(
                `**Cześć ${member}!**\n\n` +
                `Miło Cię widzieć na serwerze **${member.guild.name}**! 🌴\n\n` +
                'Zapoznaj się z regulaminem oraz zweryfikuj się, aby uzyskać pełny dostęp!'
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Jesteś ${member.guild.memberCount} osobą na serwerze!` })
            .setTimestamp();

        await welcomeChannel.send({ embeds: [welcomeEmbed] });
        console.log(`👋 Wysłano wiadomość powitalną dla ${member.user.username}`);
    } catch (error) {
        console.error('Błąd podczas wysyłania wiadomości powitalnej:', error);
    }
});

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
                .setDescription(`⛔ ${message.author}, **nie możesz wysyłać linków!**\nTylko Administracja ma do tego uprawnienia.`)
                .setFooter({ text: '🌴 TitanZone | Zakaz reklam' });
            const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            return;
        }
    }

    // ========== KOMENDA UPDATE-EMBEDS ==========
    if (message.content === '!update-embeds') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        
        await message.reply('🔄 Rozpoczynam aktualizację wszystkich embedów...');
        
        const colors = {
            konkurs: 0xFF0000,
            metody: 0x00FF00,
            zakup: 0x9400D3,
            cennik: 0x00BFFF,
            legitcheck: 0x00FF00,
            regulamin: 0xFF4444,
            weryfikacja: 0x00FF00,
            welcome: 0x00FF00
        };
        
        const channelsToCheck = [
            CONFIG.legitResultChannelID,
            CONFIG.konkursChannelID,
            CONFIG.welcomeChannelID,
            CONFIG.legitPanelChannelID
        ];
        
        let updatedCount = 0;
        
        for (const channelID of channelsToCheck) {
            const channel = client.channels.cache.get(channelID);
            if (!channel) continue;
            
            try {
                const messages = await channel.messages.fetch({ limit: 100 });
                
                for (const msg of messages.values()) {
                    if (msg.embeds.length === 0) continue;
                    
                    const embed = msg.embeds[0];
                    let newTitle = embed.title || '';
                    let newDescription = embed.description || '';
                    let newFooter = embed.footer ? embed.footer.text : '';
                    
                    newTitle = newTitle.replace(/TitanLand|TitanLAND|TitanHUB|TitanHub/gi, 'TitanZone');
                    newDescription = newDescription.replace(/TitanLand|TitanLAND|TitanHUB|TitanHub/gi, 'TitanZone');
                    newFooter = newFooter.replace(/TitanLand|TitanLAND|TitanHUB|TitanHub/gi, 'TitanZone');
                    
                    // Zamień tytuły powitalne na MarketZone
                    if (newTitle.includes('Witaj')) {
                        newTitle = newTitle.replace(/TitanZone/gi, 'MarketZone');
                    }
                    
                    if (newTitle === embed.title && 
                        newDescription === embed.description && 
                        newFooter === (embed.footer ? embed.footer.text : '')) {
                        continue;
                    }
                    
                    let color = 0x00FF00;
                    if (newTitle.includes('KONKURS')) color = colors.konkurs;
                    else if (newTitle.includes('METODY')) color = colors.metody;
                    else if (newTitle.includes('ZAKUP') || newTitle.includes('Zamówienie')) color = colors.zakup;
                    else if (newTitle.includes('CENNIK')) color = colors.cennik;
                    else if (newTitle.includes('LEGITCHECK')) color = colors.legitcheck;
                    else if (newTitle.includes('REGULAMIN')) color = colors.regulamin;
                    else if (newTitle.includes('WERYFIKACJA')) color = colors.weryfikacja;
                    else if (newTitle.includes('Witaj')) color = colors.welcome;
                    
                    const newEmbed = new EmbedBuilder()
                        .setTitle(newTitle)
                        .setColor(color)
                        .setDescription(newDescription);
                    
                    if (embed.fields && embed.fields.length > 0) {
                        newEmbed.addFields(embed.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline })));
                    }
                    
                    if (newFooter) newEmbed.setFooter({ text: newFooter });
                    if (embed.thumbnail) newEmbed.setThumbnail(embed.thumbnail.url);
                    
                    await msg.edit({ embeds: [newEmbed] });
                    updatedCount++;
                }
            } catch (error) {
                console.error(`Błąd podczas aktualizacji kanału ${channelID}:`, error);
            }
        }
        
        await message.channel.send(`✅ Zaktualizowano **${updatedCount}** embedów!\n\n📋 Zmiany:\n- TitanHUB → TitanZone\n- Embedy powitalne → MarketZone\n- Nowe kolory według typu`);
        return;
    }
    // ========== KONIEC KOMENDY ==========

    if (message.content === '!test') {
        await message.reply('✅ Test udany! Bot działa!');
        return;
    }

    if (message.content === '!cennik') {
        const embed = new EmbedBuilder()
            .setTitle('💰 TITANZONE - CENNIK')
            .setColor(0x00BFFF)
            .setDescription('Poniżej znajdują się aktualne ceny Titanów w zależności od metody płatności:')
            .addFields(
                {
                    name: '📱 CENNIK BLIK',
                    value:
                        '🔹 **1x Titan** - 1,40 zł\n' +
                        '🔹 **5x Titanów** - 1,25 zł/szt. (6,25 zł)\n' +
                        '🔹 **10x+ Titanów** - 1,15 zł/szt.',
                    inline: true
                },
                {
                    name: '💳 CENNIK PSC',
                    value:
                        '🔹 **1x Titan** - 1,70 zł\n' +
                        '🔹 **5x Titanów** - 1,55 zł/szt. (7,75 zł)\n' +
                        '🔹 **10x+ Titanów** - 1,45 zł/szt.',
                    inline: true
                }
            )
            .setFooter({ text: '🌴 TitanZone | Najlepsze ceny!' });
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (message.content === '!metody-platnosci') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('💳 METODY PŁATNOŚCI')
            .setColor(0x00FF00)
            .setDescription('📱 **BLIK**\n\n💳 **PSC**')
            .setFooter({ text: '🌴 TitanZone | Płatności' });
        await message.channel.send({ embeds: [embed] });
    }

    if (message.content === '!regulamin') {
        const regulaminEmbed = new EmbedBuilder()
            .setTitle('📜 REGULAMIN SERWERA TITANZONE')
            .setColor(0xFF4444)
            .setDescription(
                '**Witaj na serwerze TitanZone! 🌴**\n' +
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
            .setFooter({ text: '🌴 TitanZone | Korzystając z serwera akceptujesz regulamin' });
        await message.channel.send({ embeds: [regulaminEmbed] });
    }

    if (message.content === '!weryfikacja-panel') {
        const isOwnerOrAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.roles.cache.has(CONFIG.ownerRoleID);
        if (!isOwnerOrAdmin) return message.reply('❌ Brak uprawnień do użycia tej komendy!');
        const embed = new EmbedBuilder()
            .setTitle('✅ WERYFIKACJA TITANZONE')
            .setColor(0x00FF00)
            .setDescription(
                '**🌴 Witaj na serwerze TitanZone!**\n\n' +
                'Kliknij przycisk poniżej, aby się zweryfikować.\n' +
                'Po weryfikacji otrzymasz dostęp do wszystkich kanałów!\n\n' +
                '✅ *Zweryfikuj się teraz!*'
            )
            .setFooter({ text: 'TitanZone | Weryfikacja' });
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
            .setTitle('🛒 TITANZONE - ZAKUP TITANÓW')
            .setColor(0x9400D3)
            .setDescription(
                '**💎 Chcesz kupić Titana?**\n\n' +
                'Kliknij przycisk poniżej, aby rozpocząć zakup.\n' +
                'Wybierz metodę płatności i ilość Titanów!\n\n' +
                '🛒 *Rozpocznij zakup teraz!*'
            )
            .setFooter({ text: '🌴 TitanZone | Zakup' });
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
            .setTitle('✅ TITANZONE - LEGITCHECK')
            .setColor(0x00FF00)
            .setDescription(
                '**🔒 Potwierdź swój zakup!**\n\n' +
                'Kliknij przycisk poniżej, aby utworzyć LegitCheck.\n' +
                'Podaj metodę płatności i ilość zakupionych Titanów.\n\n' +
                '✅ *Utwórz LegitCheck teraz!*'
            )
            .setFooter({ text: '🌴 TitanZone | LegitCheck' });
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
            messageId: null,
            channelId: konkursChannel.id
        });

        const endTimestamp = Math.floor(endTime / 1000);

        const contestEmbed = new EmbedBuilder()
            .setTitle('🎉 KONKURS TITANZONE! 🎉')
            .setColor(0xFF0000)
            .setDescription(
                '**🏆 Wielki Konkurs TitanZone!**\n\n' +
                'Masz szansę wygrać darmowe Titany!\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                `💎 **Nagroda:** ${titans}x Titanów\n` +
                `👥 **Liczba wygranych:** ${winners} osób\n` +
                `⏰ **Czas trwania:** ${formatDuration(duration)}\n` +
                `🕐 **Koniec:** <t:${endTimestamp}:F> (<t:${endTimestamp}:R>)\n\n` +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '**Jak wziąć udział?**\n' +
                'Kliknij przycisk poniżej, aby dołączyć do konkursu!\n' +
                'Wygrani zostaną wylosowani automatycznie po zakończeniu czasu.'
            )
            .setFooter({ text: '🌴 TitanZone | Powodzenia!' });

        const joinRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`join_contest_${contestId}`)
                    .setLabel('🎉 Dołącz do konkursu')
                    .setStyle(ButtonStyle.Success)
            );

        const contestMsg = await konkursChannel.send({ 
            content: '@everyone',
            embeds: [contestEmbed], 
            components: [joinRow] 
        });
        activeContests.get(contestId).messageId = contestMsg.id;

        setTimeout(async () => { await endContest(contestId); }, duration);

        await message.reply(`✅ **Konkurs utworzony!**\n\n💎 Nagroda: ${titans}x Titanów\n👥 Wygranych: ${winners} osób\n⏰ Czas: ${formatDuration(duration)}\n🕐 Koniec: <t:${endTimestamp}:F>\n\nKonkurs wysłany na kanał ${konkursChannel} z pingiem @everyone`);
        console.log(`🎉 Utworzono konkurs: ${contestId} - ${titans} Titanów, ${winners} wygranych, czas: ${formatDuration(duration)}`);
    }
});

async function endContest(contestId) {
    const contest = activeContests.get(contestId);
    if (!contest) return;
    const channel = client.channels.cache.get(contest.channelId);
    if (!channel) return;

    const participants = Array.from(contest.participants);
    let resultEmbed;

    if (participants.length === 0) {
        resultEmbed = new EmbedBuilder()
            .setTitle('❌ Konkurs Zakończony')
            .setColor(0xFF0000)
            .setDescription(
                '**Konkurs się zakończył, ale nikt nie wziął udziału!**\n\n' +
                'Nikt nie kliknął przycisku "Dołącz do konkursu".'
            )
            .setFooter({ text: '🌴 TitanZone | Następnym razem się uda!' });
    } else {
        const shuffled = shuffleArray(participants);
        const selectedWinners = shuffled.slice(0, Math.min(contest.winners, participants.length));
        const winnersList = selectedWinners.map((winnerId, index) => {
            const user = client.users.cache.get(winnerId);
            return `**${index + 1}.** <@${winnerId}> (${user ? user.username : 'Nieznany użytkownik'})`;
        }).join('\n');

        resultEmbed = new EmbedBuilder()
            .setTitle('🏆 KONKURS ZAKOŃCZONY - WYGRANI! 🏆')
            .setColor(0xFF0000)
            .setDescription(
                `**🎉 Gratulacje dla zwycięzców!**\n\n` +
                `Konkurs na **${contest.titans}x Titanów** został rozstrzygnięty!\n\n` +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                `👥 **Łączna liczba uczestników:** ${participants.length}\n` +
                `🏆 **Liczba wygranych:** ${selectedWinners.length}\n\n` +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                `**🎊 WYGRANI:**\n${winnersList}\n\n` +
                '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '📩 **Zwycięzcy:** Skontaktujcie się z administracją w celu odbioru nagrody!\n' +
                '⏰ Macie na to **24 godziny** od tej wiadomości.'
            )
            .setFooter({ text: '🌴 TitanZone | Gratulacje!' });

        for (const winnerId of selectedWinners) {
            try {
                const user = client.users.cache.get(winnerId);
                if (user) {
                    await user.send(`🏆 **Gratulacje! Wygrałeś konkurs TitanZone!**\n\nWygrałeś **${contest.titans}x Titanów**!\n\nSkontaktuj się z administracją na serwerze, aby odebrać nagrodę. Masz na to 24 godziny.`);
                }
            } catch (error) {
                console.error(`Nie udało się wysłać DM do ${winnerId}:`, error);
            }
        }
    }

    try {
        const contestMsg = await channel.messages.fetch(contest.messageId);
        await contestMsg.edit({ components: [] });
    } catch (error) {
        console.error('Nie udało się zaktualizować wiadomości konkursu:', error);
    }

    await channel.send({ embeds: [resultEmbed] });
    activeContests.delete(contestId);
    console.log(`🏆 Zakończono konkurs: ${contestId}`);
}

client.on('interactionCreate', async (interaction) => {

    if (interaction.customId === 'verify') {
        try {
            let verifiedRole = interaction.guild.roles.cache.find(r => r.name.includes('Zweryfikowany') || r.name.includes('Członek'));
            if (!verifiedRole && CONFIG.memberRoleID) verifiedRole = interaction.guild.roles.cache.get(CONFIG.memberRoleID);
            if (!verifiedRole) return await interaction.reply({ content: '❌ Nie znaleziono roli do nadania! Skontaktuj się z administracją.', ephemeral: true });
            if (interaction.member.roles.cache.has(verifiedRole.id)) return await interaction.reply({ content: '✅ Jesteś już zweryfikowany!', ephemeral: true });
            await interaction.member.roles.add(verifiedRole);
            await interaction.reply({ content: `✅ Zostałeś zweryfikowany! Witaj na serwerze ${interaction.guild.name}! 🌴`, ephemeral: true });
            console.log(`✅ ${interaction.user.username} został zweryfikowany!`);
        } catch (error) {
            console.error('Błąd podczas weryfikacji:', error);
            await interaction.reply({ content: '❌ Wystąpił błąd podczas weryfikacji! Spróbuj ponownie.', ephemeral: true });
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'buy_titan') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x9400D3);
        const selectRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('payment_method')
                    .setPlaceholder('Wybierz metodę płatności...')
                    .addOptions([
                        { label: 'BLIK', value: 'blik', emoji: '📱', description: 'Płatność BLIKiem' },
                        { label: 'PSC', value: 'psc', emoji: '💳', description: 'Paysafecard' }
                    ])
            );
        try {
            const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
            setTimeout(() => { response.delete().catch(() => {}); }, 10000);
        } catch (error) {
            await interaction.reply({ content: '❌ Nie udało się otworzyć formularza. Upewnij się, że bot ma odpowiednie uprawnienia.', ephemeral: true });
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'create_legitcheck') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x00FF00);
        const selectRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('legitcheck_payment')
                    .setPlaceholder('Wybierz metodę płatności...')
                    .addOptions([
                        { label: 'BLIK', value: 'blik', emoji: '📱', description: 'Płatność BLIKiem' },
                        { label: 'PSC', value: 'psc', emoji: '💳', description: 'Paysafecard' }
                    ])
            );
        try {
            const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
            setTimeout(() => { response.delete().catch(() => {}); }, 10000);
        } catch (error) {
            await interaction.reply({ content: '❌ Nie udało się otworzyć formularza. Upewnij się, że bot ma odpowiednie uprawnienia.', ephemeral: true });
        }
        return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('join_contest_')) {
        const contestId = interaction.customId.replace('join_contest_', '');
        const contest = activeContests.get(contestId);

        if (!contest) {
            return await interaction.reply({ content: '❌ Ten konkurs już się zakończył lub nie istnieje!', ephemeral: true });
        }

        if (Date.now() >= contest.endTime) {
            return await interaction.reply({ content: '⏰ Czas konkursu się skończył!', ephemeral: true });
        }

        if (contest.participants.has(interaction.user.id)) {
            return await interaction.reply({ content: '✅ Jesteś już uczestnikiem tego konkursu!', ephemeral: true });
        }

        contest.participants.add(interaction.user.id);

        try {
            const channel = client.channels.cache.get(contest.channelId);
            const contestMsg = await channel.messages.fetch(contest.messageId);
            
            const endTimestamp = Math.floor(contest.endTime / 1000);

            const updatedEmbed = new EmbedBuilder()
                .setTitle('🎉 KONKURS TITANZONE! 🎉')
                .setColor(0xFF0000)
                .setDescription(
                    '**🏆 Wielki Konkurs TitanZone!**\n\n' +
                    'Masz szansę wygrać darmowe Titany!\n\n' +
                    '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                    `💎 **Nagroda:** ${contest.titans}x Titanów\n` +
                    `👥 **Liczba wygranych:** ${contest.winners} osób\n` +
                    `⏰ **Czas trwania:** ${formatDuration(contest.duration)}\n` +
                    `🕐 **Koniec:** <t:${endTimestamp}:F> (<t:${endTimestamp}:R>)\n` +
                    `👥 **Uczestnicy:** ${contest.participants.size} osób\n\n` +
                    '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                    '**Jak wziąć udział?**\n' +
                    'Kliknij przycisk poniżej, aby dołączyć do konkursu!\n' +
                    'Wygrani zostaną wylosowani automatycznie po zakończeniu czasu.'
                )
                .setFooter({ text: '🌴 TitanZone | Powodzenia!' });
            await contestMsg.edit({ embeds: [updatedEmbed] });
        } catch (error) {
            console.error('Nie udało się zaktualizować embedu konkursu:', error);
        }

        const response = await interaction.reply({
            content: `✅ **Dołączyłeś do konkursu!**\n\n💎 Nagroda: ${contest.titans}x Titanów\n👥 Łącznie uczestników: ${contest.participants.size}\n🕐 Losowanie: <t:${Math.floor(contest.endTime / 1000)}:R>`,
            ephemeral: true
        });

        setTimeout(() => {
            response.delete().catch(() => {});
        }, 10000);

        console.log(`🎉 ${interaction.user.username} dołączył do konkursu ${contestId}`);
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'payment_method') {
        const method = interaction.values[0];
        const methodNames = { blik: 'BLIK', psc: 'PSC' };
        const modal = new ModalBuilder().setCustomId(`buy_modal_${method}`).setTitle(`🛒 Zakup Titanów — ${methodNames[method]}`);
        const iloscInput = new TextInputBuilder().setCustomId('ilosc_titanow').setLabel('Ilość Titanów').setStyle(TextInputStyle.Short).setPlaceholder('Wpisz ile Titanów chcesz kupić...').setRequired(true).setMinLength(1).setMaxLength(10);
        const nickInput = new TextInputBuilder().setCustomId('nick_roblox').setLabel('Twój nick Roblox').setStyle(TextInputStyle.Short).setPlaceholder('Wpisz swój nick z Roblox...').setRequired(true).setMinLength(2).setMaxLength(50);
        const infoInput = new TextInputBuilder().setCustomId('dodatkowe_info').setLabel('Dodatkowe informacje (opcjonalne)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Np. kod PSC, numer BLIK...').setRequired(false).setMinLength(0).setMaxLength(500);
        modal.addComponents(new ActionRowBuilder().addComponents(iloscInput), new ActionRowBuilder().addComponents(nickInput), new ActionRowBuilder().addComponents(infoInput));
        try {
            await interaction.showModal(modal);
        } catch (error) {
            await interaction.reply({ content: '❌ Nie udało się otworzyć formularza. Upewnij się, że bot ma odpowiednie uprawnienia.', ephemeral: true });
        }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'legitcheck_payment') {
        const method = interaction.values[0];
        const methodNames = { blik: 'BLIK', psc: 'PSC' };
        const modal = new ModalBuilder().setCustomId(`legitcheck_modal_${method}`).setTitle(`✅ LegitCheck — ${methodNames[method]}`);
        const iloscInput = new TextInputBuilder().setCustomId('ilosc_titanow_legit').setLabel('Ilość zakupionych Titanów').setStyle(TextInputStyle.Short).setPlaceholder('Wpisz ile Titanów kupiłeś...').setRequired(true).setMinLength(1).setMaxLength(10);
        modal.addComponents(new ActionRowBuilder().addComponents(iloscInput));
        try {
            await interaction.showModal(modal);
        } catch (error) {
            await interaction.reply({ content: '❌ Nie udało się otworzyć formularza. Upewnij się, że bot ma odpowiednie uprawnienia.', ephemeral: true });
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('buy_modal_')) {
        try {
            const method = interaction.customId.replace('buy_modal_', '');
            const methodNames = { blik: '📱 BLIK', psc: '💳 PSC' };

            const ilosc = interaction.fields.getTextInputValue('ilosc_titanow');
            const nick = interaction.fields.getTextInputValue('nick_roblox');
            const info = interaction.fields.getTextInputValue('dodatkowe_info');
            const iloscNum = parseInt(ilosc);

            let cenaJednostkowa = 1.40;
            if (method === 'psc') {
                if (iloscNum >= 10) cenaJednostkowa = 1.45;
                else if (iloscNum >= 5) cenaJednostkowa = 1.55;
                else cenaJednostkowa = 1.70;
            } else if (method === 'blik') {
                if (iloscNum >= 10) cenaJednostkowa = 1.15;
                else if (iloscNum >= 5) cenaJednostkowa = 1.25;
                else cenaJednostkowa = 1.40;
            }

            const cenaCalkowita = (iloscNum * cenaJednostkowa).toFixed(2);
            const guild = interaction.guild;
            let category = guild.channels.cache.find(ch => ch.name.includes('zakupy') && ch.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({ name: '🎫・zakupy', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }] });
            }
            const channelName = `zakup-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
            const ticketChannel = await guild.channels.create({
                name: channelName, type: ChannelType.GuildText, parent: category.id,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            const embed = new EmbedBuilder()
                .setTitle('🛒 Nowe Zamówienie')
                .setColor(0x9400D3)
                .addFields(
                    { name: '👤 Kupujący', value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: true },
                    { name: '🎮 Nick Roblox', value: `**${nick}**`, inline: true },
                    { name: '📦 Ilość Titanów', value: `**${ilosc}x**`, inline: true },
                    { name: '💳 Metoda Płatności', value: methodNames[method] || method, inline: true },
                    { name: '💰 Cena jednostkowa', value: `**${cenaJednostkowa.toFixed(2)} zł**`, inline: true },
                    { name: '💵 Do zapłaty', value: `**${cenaCalkowita} zł**`, inline: true },
                    { name: '📝 Status', value: '⏳ Oczekuje na płatność', inline: false },
                    { name: '🕐 Data złożenia', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setFooter({ text: '🌴 TitanZone | Zakup' })
                .setThumbnail(interaction.user.displayAvatarURL());
            if (info) embed.addFields({ name: '📝 Dodatkowe info', value: info, inline: false });
            const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Zamknij Ticket').setStyle(ButtonStyle.Danger));
            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [closeRow] });
            const response = await interaction.reply({ content: `✅ Ticket zakupowy został utworzony!\nTicket: ${ticketChannel}`, ephemeral: true });
            setTimeout(() => { response.delete().catch(() => {}); }, 10000);
            console.log(`✅ Zakup potwierdzony: ${interaction.user.username} kupił ${ilosc}x Titanów za ${cenaCalkowita} zł (${method})`);
        } catch (error) {
            console.error('Błąd przy tworzeniu zamówienia:', error);
            await interaction.reply({ content: '❌ Wystąpił błąd podczas tworzenia zamówienia!', ephemeral: true });
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('legitcheck_modal_')) {
        try {
            const method = interaction.customId.replace('legitcheck_modal_', '');
            const methodNames = { blik: '📱 BLIK', psc: '💳 PSC' };
            const ilosc = interaction.fields.getTextInputValue('ilosc_titanow_legit');
            const legitChannel = client.channels.cache.get(CONFIG.legitResultChannelID);
            
            if (!legitChannel) {
                return await interaction.reply({ content: '❌ Nie znaleziono kanału LegitCheck!', ephemeral: true });
            }

            const legitEmbed = new EmbedBuilder()
                .setTitle('✅ TitanZone LegitCheck')
                .setColor(0x00FF00)
                .setDescription(
                    `💳 **Metoda:** ${methodNames[method] || method}\n\n` +
                    `📦 **Ilość:** ${ilosc}x\n\n` +
                    `👤 **Osoba:** <@${interaction.user.id}> (${interaction.user.username})`
                )
                .setFooter({ text: '🌴 TitanZone | LegitCheck' })
                .setThumbnail(interaction.user.displayAvatarURL());

            await legitChannel.send({ embeds: [legitEmbed] });

            const legitCheckCount = await countLegitChecks(legitChannel);

            const parts = legitChannel.name.split('_');
            const prefix = parts[0];
            const newName = `${prefix}_${legitCheckCount}`;
            
            await legitChannel.setName(newName);

            const response = await interaction.reply({ 
                content: `✅ LegitCheck został utworzony!\nKanał: ${legitChannel}`, 
                ephemeral: true 
            });

            setTimeout(() => { response.delete().catch(() => {}); }, 10000);

        } catch (error) {
            console.error('Błąd przy tworzeniu LegitCheck:', error);
            await interaction.reply({ content: '❌ Wystąpił błąd podczas tworzenia LegitCheck!', ephemeral: true });
        }
        return;
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket zostanie zamknięty za 3 sekundy...', ephemeral: true });
        setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) { } }, 3000);
        return;
    }
});

client.login(TOKEN);
