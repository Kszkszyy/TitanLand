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

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot TitanHUB jest online!'));
app.listen(process.env.PORT || 3000, () => console.log('Serwer działa'));

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

const LEGIT_CHANNEL_BASE_NAME = '✅-𝐋𝐄𝐆𝐈𝐓𝐂𝐇𝐄𝐂𝐊_';
const TOKEN = process.env.BOT_TOKEN;
const activeContests = new Map();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences]
});

process.on('unhandledRejection', err => console.error('BŁĄD:', err));
process.on('uncaughtException', err => console.error('CRASH:', err));

async function getCategory(guild, name) {
    let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === name);
    if (!cat) cat = await guild.channels.create({ name, type: ChannelType.GuildCategory, permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }] });
    return cat;
}

client.once('ready', async () => {
    console.log(`✅ TitanHUB online jako ${client.user.tag}`);
    try {
        const ch = client.channels.cache.get(CONFIG.legitResultChannelID);
        if (ch) {
            let count = 0, last;
            while (true) {
                const msgs = await ch.messages.fetch({ limit: 100, before: last }).catch(() => null);
                if (!msgs || msgs.size === 0) break;
                count += msgs.filter(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes('LegitCheck')).size;
                last = msgs.last()?.id;
                if (msgs.size < 100) break;
            }
            const newName = `${LEGIT_CHANNEL_BASE_NAME}${count}`;
            if (ch.name !== newName) await ch.setName(newName).catch(() => {});
        }
    } catch (e) {}
});

function parseDuration(t) { const m = t.match(/^(\d+)([smhd])$/i); return m ? parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()] : null; }
function formatDuration(ms) { const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b; }

client.on('guildMemberAdd', member => {
    const ch = client.channels.cache.get(CONFIG.welcomeChannelID);
    if (ch) ch.send({ embeds: [new EmbedBuilder().setTitle('👋 Witaj na TitanHUB!').setColor(0x00FF00).setDescription(`**Cześć ${member}!**\nMiło Cię widzieć na **${member.guild.name}**!`).setFooter({ text: `Jesteś ${member.guild.memberCount} osobą!` })] });
});

client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;
    const admin = m.member.permissions.has(PermissionFlagsBits.Administrator) || m.member.roles.cache.has(CONFIG.ownerRoleID);
    
    if (!admin && /https?:\/\//i.test(m.content)) { await m.delete().catch(() => {}); const w = await m.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`⛔ ${m.author}, brak linków!`).setFooter({ text: '🌴 TitanHUB' })] }); setTimeout(() => w.delete().catch(() => {}), 5000); return; }

    if (m.content === '!test') return m.reply('✅ Działa!');
    
    if (m.content === '!aktualizuj-embedy' && admin) {
        await m.reply('🔄 Aktualizuję...');
        let u = 0;
        for (const [, ch] of m.guild.channels.cache.filter(c => c.type === ChannelType.GuildText)) {
            let last; while (true) {
                const msgs = await ch.messages.fetch({ limit: 100, before: last }).catch(() => null);
                if (!msgs || msgs.size === 0) break;
                for (const [, msg] of msgs) if (msg.author.id === client.user.id && msg.embeds[0]) {
                    const e = EmbedBuilder.from(msg.embeds[0]); let c = false;
                    if (e.data.title?.includes('TitanLAND')) { e.setTitle(e.data.title.replace(/TitanLAND/g, 'TitanHUB')); c = true; }
                    if (e.data.description?.includes('TitanLAND')) { e.setDescription(e.data.description.replace(/TitanLAND/g, 'TitanHUB')); c = true; }
                    if (e.data.footer?.text?.includes('TitanLAND')) { e.setFooter({ text: e.data.footer.text.replace(/TitanLAND/g, 'TitanHUB') }); c = true; }
                    const t = (e.data.title || '') + (e.data.description || '');
                    if (t.includes('KONKURS')) { e.setColor(0xFF0000); c = true; }
                    else if (t.includes('METODY')) { e.setColor(0x00FF00); c = true; }
                    else if (t.includes('ZAKUP') || t.includes('Zamówienie')) { e.setColor(0x800080); c = true; }
                    else if (t.includes('CENNIK')) { e.setColor(0x0000FF); c = true; }
                    else if (t.includes('LEGITCHECK')) { e.setColor(0x00FF00); c = true; }
                    if (c) { await msg.edit({ embeds: [e] }).catch(() => {}); u++; }
                }
                last = msgs.last().id; if (msgs.size < 100) break;
            }
        }
        return m.channel.send(`✅ Zaktualizowano ${u} embedów!`);
    }

    if (m.content === '!cennik') return m.channel.send({ embeds: [new EmbedBuilder().setTitle('💰 TITANHUB - CENNIK').setColor(0x0000FF).setDescription('Ceny Titanów:').addFields({ name: '📱 BLIK', value: '1x - 1,40 zł\n5x - 1,25 zł\n10x+ - 1,15 zł', inline: true }, { name: '💳 PSC', value: '1x - 1,70 zł\n5x - 1,55 zł\n10x+ - 1,45 zł', inline: true }).setFooter({ text: '🌴 TitanHUB' })] });
    if (m.content === '!metody-platnosci' && admin) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('💳 METODY PŁATNOŚCI').setColor(0x00FF00).setDescription('📱 **BLIK**\n\n💳 **PSC**')] });
    if (m.content === '!regulamin' && admin) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('📜 REGULAMIN TITANHUB').setColor(0xFF4444).setDescription('**Witaj na TitanHUB!**\nZapoznaj się z regulaminem!').addFields({ name: '👥 ZASADY', value: '**1.** Szanuj innych\n**2.** Zakaz wyzywania\n**3.** Zakaz +18\n**4.** Nie spamuj\n**5.** Nie pinguj\n**6.** Zakaz reklam\n**7.** Pisz gdzie trzeba\n**8.** Słuchaj adminów' }, { name: '🛒 ZAKUPY', value: '**9.** Zakaz sprzedaży\n**10.** Brak zwrotów\n**11.** Admin ma 12h\n**12.** Brak odp. za bany' }).setFooter({ text: '🌴 TitanHUB' })] });
    if (m.content === '!weryfikacja-panel' && admin) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('✅ WERYFIKACJA TITANHUB').setColor(0x00FF00).setDescription('**Witaj na TitanHUB!**\nKliknij poniżej aby się zweryfikować.')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify').setLabel('✅ Zweryfikuj').setStyle(ButtonStyle.Success))] });
    if (m.content === '!legitcheck-panel' && admin) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('✅ TITANHUB LEGITCHECK').setColor(0x00FF00).setDescription('Potwierdź zakup!')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_legitcheck').setLabel('Utwórz LegitCheck').setStyle(ButtonStyle.Success))] });
    
    if (m.content === '!ticket-panel' && admin) {
        const e = new EmbedBuilder().setTitle('🎫 TICKETY TITANHUB').setColor(0x5865F2).setDescription('**Wybierz typ ticketu:**\n\n🛒 **Zakup** - Kupno Titanów\n❓ **Pomoc** - Zgłoszenia i pytania\n🏆 **Odbierz Konkurs** - Odbiór nagrody').setFooter({ text: 'TitanHUB | Ticket' });
        const r = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_zakup').setLabel('Zakup').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
            new ButtonBuilder().setCustomId('t_pomoc').setLabel('Pomoc').setStyle(ButtonStyle.Danger).setEmoji('❓'),
            new ButtonBuilder().setCustomId('t_konkurs').setLabel('Odbierz Konkurs').setStyle(ButtonStyle.Success).setEmoji('🏆')
        );
        return m.channel.send({ embeds: [e], components: [r] });
    }

    if (m.content.startsWith('!konkurs') && admin) {
        const a = m.content.split(' '); const d = parseDuration(a[1]); const t = parseInt(a[2]); const w = parseInt(a[3]);
        if (!d) return m.reply('Użyj: !konkurs 1h 10 3');
        const ch = client.channels.cache.get(CONFIG.konkursChannelID); const id = Date.now();
        activeContests.set(id, { titans: t, winners: w, end: Date.now() + d, users: new Set() });
        const msg = await ch.send({ content: '@everyone', embeds: [new EmbedBuilder().setTitle('🎉 KONKURS TITANHUB!').setColor(0xFF0000).setDescription(`💎 **${t}x Titanów**\n👥 **${w} wygranych**\n⏰ Koniec <t:${Math.floor((Date.now() + d) / 1000)}:R>`)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`j_${id}`).setLabel('Dołącz').setStyle(ButtonStyle.Success))] });
        activeContests.get(id).msg = msg.id;
        setTimeout(async () => { const c = activeContests.get(id); const win = shuffle([...c.users]).slice(0, w); await ch.send({ embeds: [new EmbedBuilder().setTitle('🏆 WYNIKI').setColor(0xFF0000).setDescription(win.map((x, i) => `${i + 1}. <@${x}>`).join('\n') || 'Brak uczestników')] }); activeContests.delete(id); }, d);
        return m.reply('✅ Konkurs utworzony!');
    }
});

client.on('interactionCreate', async i => {
    try {
        // WERYFIKACJA - NAPRAWIONA
        if (i.customId === 'verify') {
            try {
                let role = i.guild.roles.cache.find(r => r.name.toLowerCase().includes('zweryfikowany') || r.name.toLowerCase().includes('członek') || r.name.toLowerCase().includes('member'));
                if (!role) role = i.guild.roles.cache.get(CONFIG.memberRoleID);
                if (!role) return i.reply({ content: '❌ Nie znaleziono roli! Skontaktuj się z adminem.', ephemeral: true });
                if (i.member.roles.cache.has(role.id)) return i.reply({ content: '✅ Już jesteś zweryfikowany!', ephemeral: true });
                await i.member.roles.add(role);
                return i.reply({ content: `✅ Zostałeś zweryfikowany na **${i.guild.name}**! Witaj na TitanHUB! 🌴`, ephemeral: true });
            } catch (e) { return i.reply({ content: '❌ Błąd weryfikacji - brak uprawnień bota!', ephemeral: true }); }
        }

        // TICKETY
        if (i.customId === 't_zakup') {
            return i.reply({ embeds: [new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x800080)], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('pay').setPlaceholder('Wybierz...').addOptions([{ label: 'BLIK', value: 'blik', emoji: '📱' }, { label: 'PSC', value: 'psc', emoji: '💳' }]))], ephemeral: true });
        }
        
        if (i.customId === 't_pomoc') {
            return i.reply({ embeds: [new EmbedBuilder().setTitle('❓ Wybierz typ pomocy').setColor(0xFF0000)], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('help').setPlaceholder('Wybierz...').addOptions([{ label: 'Zgłoś użytkownika', value: 'zglos', emoji: '🚨', description: 'Zgłoś łamanie regulaminu' }, { label: 'Znalazłem błąd', value: 'blad', emoji: '🐛', description: 'Zgłoś błąd na serwerze' }, { label: 'Potrzebuję pomocy', value: 'pomoc', emoji: '❓', description: 'Ogólna pomoc' }]))], ephemeral: true });
        }
        
        if (i.customId === 't_konkurs') {
            await i.deferReply({ ephemeral: true });
            const cat = await getCategory(i.guild, '🏆・odbiór-konkurs');
            const ch = await i.guild.channels.create({ name: `odbior-${i.user.username}`, parent: cat.id, type: ChannelType.GuildText, permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] });
            await ch.send({ content: `${i.user} <@&${CONFIG.ownerRoleID}>`, embeds: [new EmbedBuilder().setTitle('🏆 Odbiór Konkursu').setColor(0xFFD700).setDescription(`**Użytkownik:** ${i.user}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`).setFooter({ text: 'TitanHUB' })] });
            await i.editReply(`✅ Ticket utworzony: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        if (i.customId === 'pay') {
            const m = new ModalBuilder().setCustomId(`b_${i.values[0]}`).setTitle('Zakup Titanów');
            m.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ilosc').setLabel('Ilość Titanów').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('np. 5')),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nick').setLabel('Nick Roblox').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return i.showModal(m);
        }

        if (i.customId.startsWith('b_')) {
            await i.deferReply({ ephemeral: true });
            const cat = await getCategory(i.guild, '🎫・zakupy');
            const ch = await i.guild.channels.create({ name: `zakup-${i.user.username}`, parent: cat.id, type: ChannelType.GuildText, permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] });
            await ch.send({ content: `${i.user} <@&${CONFIG.ownerRoleID}>`, embeds: [new EmbedBuilder().setTitle('🛒 Nowe Zamówienie').setColor(0x800080).addFields({ name: '👤 Klient', value: `${i.user}`, inline: true }, { name: '📦 Ilość', value: `${i.fields.getTextInputValue('ilosc')}x`, inline: true }, { name: '🎮 Nick', value: i.fields.getTextInputValue('nick'), inline: true }, { name: '💳 Płatność', value: i.customId.split('_')[1].toUpperCase(), inline: true }).setFooter({ text: 'TitanHUB | Zakup' }).setTimestamp()] });
            await i.editReply(`✅ Ticket zakupowy: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        if (i.customId === 'help') {
            await i.deferUpdate();
            const types = { zglos: '🚨 Zgłoszenie użytkownika', blad: '🐛 Zgłoszenie błędu', pomoc: '❓ Prośba o pomoc' };
            const cat = await getCategory(i.guild, '🆘・pomoc');
            const ch = await i.guild.channels.create({ name: `pomoc-${i.user.username}`, parent: cat.id, type: ChannelType.GuildText, permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] });
            await ch.send({ content: `${i.user} <@&${CONFIG.ownerRoleID}>`, embeds: [new EmbedBuilder().setTitle(types[i.values[0]]).setColor(0xFF0000).setDescription(`**Użytkownik:** ${i.user}\n**Typ:** ${types[i.values[0]]}`).setFooter({ text: 'TitanHUB | Pomoc' }).setTimestamp()] });
            await i.editReply({ content: `✅ Ticket pomocy: ${ch}`, embeds: [], components: [] });
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        // STARE FUNKCJE (dla kompatybilności)
        if (i.customId === 'buy_titan') {
            return i.reply({ embeds: [new EmbedBuilder().setDescription('💳 Wybierz metodę:').setColor(0x800080)], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('payment_method').setPlaceholder('Metoda...').addOptions([{ label: 'BLIK', value: 'blik' }, { label: 'PSC', value: 'psc' }]))], ephemeral: true });
        }
        if (i.customId === 'payment_method') {
            const m = new ModalBuilder().setCustomId(`buy_modal_${i.values[0]}`).setTitle('Zakup');
            m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ilosc_titanow').setLabel('Ilość').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nick_roblox').setLabel('Nick').setStyle(TextInputStyle.Short).setRequired(true)));
            return i.showModal(m);
        }
        if (i.customId.startsWith('buy_modal_')) {
            await i.deferReply({ ephemeral: true });
            const cat = await getCategory(i.guild, '🎫・zakupy');
            const ch = await i.guild.channels.create({ name: `zakup-${i.user.username}`, parent: cat.id, type: ChannelType.GuildText, permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] });
            await ch.send({ embeds: [new EmbedBuilder().setTitle('🛒 Zamówienie').setColor(0x800080).addFields({ name: 'Ilość', value: i.fields.getTextInputValue('ilosc_titanow') }, { name: 'Nick', value: i.fields.getTextInputValue('nick_roblox') })] });
            await i.editReply(`✅ Ticket: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        if (i.customId.startsWith('j_')) { const c = activeContests.get(parseInt(i.customId.split('_')[1])); if (!c) return i.reply({ content: 'Zakończony', ephemeral: true }); c.users.add(i.user.id); return i.reply({ content: '✅ Dołączyłeś!', ephemeral: true }); }
        
        if (i.customId === 'create_legitcheck') { return i.reply({ components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('lp').setPlaceholder('Metoda').addOptions([{ label: 'BLIK', value: 'b' }, { label: 'PSC', value: 'p' }]))], ephemeral: true }); }
        if (i.customId === 'lp') { const m = new ModalBuilder().setCustomId('l').setTitle('LegitCheck'); m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i').setLabel('Ilość').setStyle(TextInputStyle.Short).setRequired(true))); return i.showModal(m); }
        if (i.customId === 'l') { await i.deferReply({ ephemeral: true }); const ch = client.channels.cache.get(CONFIG.legitResultChannelID); const msgs = await ch.messages.fetch({ limit: 100 }); const n = msgs.filter(x => x.author.id === client.user.id && x.embeds[0]?.title?.includes('LegitCheck')).size + 1; await ch.send({ embeds: [new EmbedBuilder().setTitle(`✅ TitanHUB LegitCheck #${n}`).setColor(0x00FF00).setDescription(`📦 ${i.fields.getTextInputValue('i')}x\n👤 ${i.user}`)] }); const lc = client.channels.cache.get(CONFIG.legitResultChannelID); if (lc) await lc.setName(`${LEGIT_CHANNEL_BASE_NAME}${n}`).catch(() => {}); await i.editReply(`✅ LegitCheck #${n}`); setTimeout(() => i.deleteReply().catch(() => {}), 10000); }

    } catch (e) { console.error(e); try { await i.reply({ content: '❌ Błąd', ephemeral: true }) } catch {} }
});

client.login(TOKEN);
