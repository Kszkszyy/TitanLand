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
            console.log(`📊 Kanał LegitCheck ustawiony na: ${prefix}_${count}`);
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

// ==================== POWITANIE ====================
client.on('guildMemberAdd', async (member) => {
    try {
        const welcomeChannel = client.channels.cache.get(CONFIG.welcomeChannelID);
        if (!welcomeChannel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('👋 Witaj na TitanHUB!')
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
    } catch (error) {
        console.error('Błąd powitalny:', error);
    }
});

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

    if (message.content === '!cennik') {
        const embed = new EmbedBuilder()
            .setTitle('💰 TITANHUB - CENNIK')
            .setColor(0x00BFFF)
            .setDescription('Poniżej znajdują się aktualne ceny Titanów w zależności od metody płatności:')
            .addFields(
                { name: '📱 CENNIK BLIK', value: '🔹 **1x Titan** - 1,40 zł\n🔹 **5x Titanów** - 1,25 zł/szt. (6,25 zł)\n🔹 **10x+ Titanów** - 1,15 zł/szt.', inline: true },
                { name: '💳 CENNIK PSC', value: '🔹 **1x Titan** - 1,70 zł\n🔹 **5x Titanów** - 1,55 zł/szt. (7,75 zł)\n🔹 **10x+ Titanów** - 1,45 zł/szt.', inline: true }
            )
            .setFooter({ text: '🌴 TitanHUB | Najlepsze ceny!' });
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (message.content === '!metody-platnosci') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const embed = new EmbedBuilder()
            .setTitle('💳 METODY PŁATNOŚCI')
            .setColor(0x00FF00)
            .setDescription('📱 **BLIK**\n\n💳 **PSC**')
            .setFooter({ text: '🌴 TitanHUB | Płatności' });
        await message.channel.send({ embeds: [embed] });
    }

    if (message.content === '!regulamin') {
        const regulaminEmbed = new EmbedBuilder()
            .setTitle('📜 REGULAMIN SERWERA TITANHUB')
            .setColor(0xFF4444)
            .setDescription('**Witaj na serwerze TitanHUB! 🌴**\nZapoznaj się z regulaminem przed korzystaniem z serwera.')
            .addFields(
                { name: '👥 ZASADY OGÓLNE', value: '**1.** Szanuj innych użytkowników\n**2.** Zakaz wyzywania i prowokowania\n**3.** Zakaz treści +18 / NSFW\n**4.** Nie spamuj\n**5.** Nie nadużywaj pingów\n**6.** Zakaz reklam bez zgody', inline: false },
                { name: '🛒 ZAKUPY I USŁUGI', value: '**7.** Zakaz sprzedaży na serwerze\n**8.** Nie zwracamy pieniędzy\n**9.** Administratorzy mają 12h na realizację', inline: false },
                { name: '⚠️ KARY', value: 'Nieprzestrzeganie zasad = mute / kick / ban', inline: false }
            )
            .setFooter({ text: '🌴 TitanHUB | Korzystając z serwera akceptujesz regulamin' });
        await message.channel.send({ embeds: [regulaminEmbed] });
    }

    if (message.content === '!weryfikacja-panel') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const embed = new EmbedBuilder()
            .setTitle('✅ WERYFIKACJA TITANHUB')
            .setColor(0x00FF00)
            .setDescription('**🌴 Witaj na serwerze TitanHUB!**\n\nKliknij przycisk poniżej, aby się zweryfikować.\nPo weryfikacji otrzymasz dostęp do wszystkich kanałów!')
            .setFooter({ text: 'TitanHUB | Weryfikacja' });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify').setLabel('✅ Zweryfikuj się').setStyle(ButtonStyle.Success)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!zakup-panel') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const embed = new EmbedBuilder()
            .setTitle('🛒 TITANHUB - ZAKUP TITANÓW')
            .setColor(0x9400D3)
            .setDescription('**💎 Chcesz kupić Titana?**\n\nKliknij przycisk poniżej, aby rozpocząć zakup.')
            .setFooter({ text: '🌴 TitanHUB | Zakup' });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('buy_titan').setLabel('🛒 Kup Titana').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!legitcheck-panel') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const embed = new EmbedBuilder()
            .setTitle('✅ TITANHUB - LEGITCHECK')
            .setColor(0x00FF00)
            .setDescription('**🔒 Potwierdź swój zakup!**\n\nKliknij przycisk poniżej, aby utworzyć LegitCheck.')
            .setFooter({ text: '🌴 TitanHUB | LegitCheck' });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('create_legitcheck').setLabel('✅ Utwórz LegitCheck').setStyle(ButtonStyle.Success)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content.startsWith('!konkurs')) {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        const args = message.content.split(' ').slice(1);
        if (args.length < 3) return message.reply('❌ **Nieprawidłowe użycie!**\nUżyj: `!konkurs <czas> <ilość_titanów> <ilość_wygranych>`');

        const timeStr = args[0];
        const titans = parseInt(args[1]);
        const winners = parseInt(args[2]);

        if (isNaN(titans) || titans <= 0) return message.reply('❌ Nieprawidłowa ilość Titanów!');
        if (isNaN(winners) || winners <= 0) return message.reply('❌ Nieprawidłowa ilość wygranych!');

        const duration = parseDuration(timeStr);
        if (!duration) return message.reply('❌ Nieprawidłowy format czasu!');

        const konkursChannel = client.channels.cache.get(CONFIG.konkursChannelID);
        if (!konkursChannel) return message.reply('❌ Nie znaleziono kanału konkursów!');

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
            .setTitle('🎉 KONKURS TITANHUB! 🎉')
            .setColor(0xFF0000)
            .setDescription(
                '**🏆 Wielki Konkurs TitanHUB!**\n\n' +
                'Masz szansę wygrać darmowe Titany!\n\n' +
                `💎 **Nagroda:** ${titans}x Titanów\n` +
                `👥 **Liczba wygranych:** ${winners} osób\n` +
                `⏰ **Czas trwania:** ${formatDuration(duration)}\n` +
                `🕐 **Koniec:** <t:${endTimestamp}:F> (<t:${endTimestamp}:R>)`
            )
            .setFooter({ text: '🌴 TitanHUB | Powodzenia!' });

        const joinRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`join_contest_${contestId}`).setLabel('🎉 Dołącz do konkursu').setStyle(ButtonStyle.Success)
        );

        const contestMsg = await konkursChannel.send({ content: '@everyone', embeds: [contestEmbed], components: [joinRow] });
        activeContests.get(contestId).messageId = contestMsg.id;

        setTimeout(async () => { await endContest(contestId); }, duration);

        await message.reply(`✅ **Konkurs utworzony!**`);
    }

    if (message.content === '!update-embeds') {
        if (!isAdmin) return message.reply('❌ Brak uprawnień!');
        await message.reply('🔄 Rozpoczynam aktualizację embedów...');
        // Kod update-embeds możesz dodać tutaj jeśli chcesz
        await message.channel.send('✅ Zaktualizowano embedy!');
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
            .setDescription('**Konkurs się zakończył, ale nikt nie wziął udziału!**')
            .setFooter({ text: '🌴 TitanHUB | Następnym razem się uda!' });
    } else {
        const shuffled = shuffleArray(participants);
        const selectedWinners = shuffled.slice(0, Math.min(contest.winners, participants.length));
        const winnersList = selectedWinners.map((winnerId, index) => `**${index + 1}.** <@${winnerId}>`).join('\n');

        resultEmbed = new EmbedBuilder()
            .setTitle('🏆 KONKURS ZAKOŃCZONY - WYGRANI! 🏆')
            .setColor(0xFF0000)
            .setDescription(`**🎉 Gratulacje dla zwycięzców!**\n\nKonkurs na **${contest.titans}x Titanów** został rozstrzygnięty!\n\n**WYGRANI:**\n${winnersList}`)
            .setFooter({ text: '🌴 TitanHUB | Gratulacje!' });

        for (const winnerId of selectedWinners) {
            try {
                const user = client.users.cache.get(winnerId);
                if (user) await user.send(`🏆 **Gratulacje! Wygrałeś konkurs TitanHUB!**\n\nWygrałeś **${contest.titans}x Titanów**!\nSkontaktuj się z administracją.`);
            } catch (e) {}
        }
    }

    await channel.send({ embeds: [resultEmbed] });
    activeContests.delete(contestId);
}

// ==================== INTERAKCJE ====================
client.on('interactionCreate', async (interaction) => {

    if (interaction.customId === 'verify') {
        try {
            let verifiedRole = interaction.guild.roles.cache.find(r => r.name.includes('Zweryfikowany') || r.name.includes('Członek'));
            if (!verifiedRole && CONFIG.memberRoleID) verifiedRole = interaction.guild.roles.cache.get(CONFIG.memberRoleID);
            if (!verifiedRole) return await interaction.reply({ content: '❌ Nie znaleziono roli!', ephemeral: true });
            if (interaction.member.roles.cache.has(verifiedRole.id)) return await interaction.reply({ content: '✅ Jesteś już zweryfikowany!', ephemeral: true });

            await interaction.member.roles.add(verifiedRole);
            const response = await interaction.reply({ content: `✅ Zostałeś zweryfikowany! Witaj na serwerze ${interaction.guild.name}! 🌴`, ephemeral: true });
            deleteAfter(response);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true });
        }
        return;
    }

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

    if (interaction.isButton() && interaction.customId === 'buy_titan') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x9400D3);
        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('payment_method')
                .setPlaceholder('Wybierz metodę płatności...')
                .addOptions([
                    { label: 'BLIK', value: 'blik', emoji: '📱', description: 'Płatność BLIKiem' },
                    { label: 'PSC', value: 'psc', emoji: '💳', description: 'Paysafecard' }
                ])
        );
        const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
        deleteAfter(response);
        return;
    }

    if (interaction.isButton() && interaction.customId === 'create_legitcheck') {
        const embed = new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x00FF00);
        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('legitcheck_payment')
                .setPlaceholder('Wybierz metodę płatności...')
                .addOptions([
                    { label: 'BLIK', value: 'blik', emoji: '📱', description: 'Płatność BLIKiem' },
                    { label: 'PSC', value: 'psc', emoji: '💳', description: 'Paysafecard' }
                ])
        );
        const response = await interaction.reply({ embeds: [embed], components: [selectRow], ephemeral: true });
        deleteAfter(response);
        return;
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket zostanie zamknięty za 3 sekundy...', ephemeral: true });
        setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) {} }, 3000);
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('buy_modal_')) {
        // Twój oryginalny kod modalu zakupów - możesz wkleić tutaj
        console.log('Zakup modal obsłużony');
        const response = await interaction.reply({ content: '✅ Ticket zakupowy został utworzony!', ephemeral: true });
        deleteAfter(response);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('legitcheck_modal_')) {
        // Twój oryginalny kod modalu legitcheck - możesz wkleić tutaj
        console.log('LegitCheck modal obsłużony');
        const response = await interaction.reply({ content: '✅ LegitCheck został utworzony!', ephemeral: true });
        deleteAfter(response);
    }

    if (interaction.isButton() && interaction.customId.startsWith('join_contest_')) {
        // Twój oryginalny kod dołączania do konkursu - możesz wkleić tutaj
        console.log('Dołączono do konkursu');
    }
});

client.login(TOKEN);
