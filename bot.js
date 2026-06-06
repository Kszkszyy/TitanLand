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
app.listen(process.env.PORT || 3000, () => console.log('Serwer dziala'));

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

const LEGIT_BASE = '✅-𝐋𝐄𝐆𝐈𝐓𝐂𝐇𝐄𝐂𝐊_';
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

client.once('ready', async () => {
    console.log(`✅ TitanHUB ${client.user.tag}`);
    const ch = client.channels.cache.get(CONFIG.legitResultChannelID);
    if (ch) {
        let n = 0, l;
        while (true) {
            const m = await ch.messages.fetch({ limit: 100, before: l }).catch(() => null);
            if (!m || !m.size) break;
            n += m.filter(x => x.author.id === client.user.id && x.embeds[0]?.title?.includes('LegitCheck')).size;
            l = m.last()?.id;
            if (m.size < 100) break;
        }
        const nn = `${LEGIT_BASE}${n}`;
        if (ch.name !== nn) await ch.setName(nn).catch(() => {});
    }
});

function parseDuration(t) { const m = t.match(/^(\d+)([smhd])$/i); return m ? parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()] : null; }
function formatDuration(ms) { const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b; }
async function getCat(g, n) { let c = g.channels.cache.find(x => x.type === ChannelType.GuildCategory && x.name === n); if (!c) c = await g.channels.create({ name: n, type: ChannelType.GuildCategory, permissionOverwrites: [{ id: g.id, deny: [PermissionFlagsBits.ViewChannel] }] }); return c; }

client.on('guildMemberAdd', m => {
    const c = client.channels.cache.get(CONFIG.welcomeChannelID);
    if (c) c.send({ embeds: [new EmbedBuilder().setTitle('👋 Witaj na TitanHUB!').setColor(0x00FF00).setDescription(`**Cześć ${m}!**\nMiło Cię widzieć na **${m.guild.name}**!`).setThumbnail(m.user.displayAvatarURL({ dynamic: true })).setFooter({ text: `Jesteś ${m.guild.memberCount} osobą!` })] });
});

client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;
    const a = m.member.permissions.has(PermissionFlagsBits.Administrator) || m.member.roles.cache.has(CONFIG.ownerRoleID);
    if (!a && /https?:\/\//i.test(m.content)) { await m.delete().catch(() => {}); const w = await m.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`⛔ ${m.author}, brak linków!`).setFooter({ text: '🌴 TitanHUB' })] }); setTimeout(() => w.delete().catch(() => {}), 5000); return; }
    
    if (m.content === '!test') return m.reply('✅ Działa!');
    if (m.content === '!cennik') return m.channel.send({ embeds: [new EmbedBuilder().setTitle('💰 TITANHUB - CENNIK').setColor(0x0000FF).setDescription('Ceny Titanów:').addFields({ name: '📱 BLIK', value: '1x - 1,40 zł\n5x - 1,25 zł\n10x+ - 1,15 zł', inline: true }, { name: '💳 PSC', value: '1x - 1,70 zł\n5x - 1,55 zł\n10x+ - 1,45 zł', inline: true }).setFooter({ text: '🌴 TitanHUB' })] });
    if (m.content === '!metody-platnosci' && a) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('💳 METODY PŁATNOŚCI').setColor(0x00FF00).setDescription('📱 **BLIK**\n\n💳 **PSC**')] });
    if (m.content === '!regulamin' && a) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('📜 REGULAMIN TITANHUB').setColor(0xFF4444).setDescription('**Witaj na TitanHUB!**\nZapoznaj się z regulaminem!').addFields({ name: '👥 ZASADY', value: '**1.** Szanuj innych\n**2.** Zakaz wyzywania\n**3.** Zakaz treści +18\n**4.** Nie spamuj\n**5.** Nie nadużywaj pingów\n**6.** Zakaz reklam\n**7.** Pisz na odpowiednich kanałach\n**8.** Słuchaj administracji', inline: false }, { name: '🛒 ZAKUPY', value: '**9.** Zakaz sprzedaży\n**10.** Nie zwracamy pieniędzy\n**11.** Admin ma 12h\n**12.** Nie odpowiadamy za bany', inline: false }).setFooter({ text: '🌴 TitanHUB' })] });
    if (m.content === '!weryfikacja-panel' && a) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('✅ WERYFIKACJA TITANHUB').setColor(0x00FF00).setDescription('**Witaj na TitanHUB!**\nKliknij przycisk poniżej, aby się zweryfikować.')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify').setLabel('✅ Zweryfikuj się').setStyle(ButtonStyle.Success))] });
    if (m.content === '!legitcheck-panel' && a) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('✅ TITANHUB - LEGITCHECK').setColor(0x00FF00).setDescription('**Potwierdź swój zakup!**')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_legitcheck').setLabel('✅ Utwórz LegitCheck').setStyle(ButtonStyle.Success))] });
    if (m.content === '!zakup-panel' && a) return m.channel.send({ embeds: [new EmbedBuilder().setTitle('🛒 TITANHUB - ZAKUP').setColor(0x800080).setDescription('**Chcesz kupić Titana?**')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('buy_titan').setLabel('🛒 Kup Titana').setStyle(ButtonStyle.Primary))] });
    
    if (m.content === '!ticket-panel' && a) {
        return m.channel.send({ 
            embeds: [new EmbedBuilder().setTitle('🎫 TICKETY TITANHUB').setColor(0x5865F2).setDescription('**Wybierz typ ticketu:**\n\n🛒 **Zakup** - Kupno Titanów\n❓ **Pomoc** - Zgłoszenia i pytania\n🏆 **Odbierz Konkurs** - Odbiór nagrody z konkursu').setFooter({ text: 'TitanHUB | Ticket' })], 
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_zakup').setLabel('Zakup').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                new ButtonBuilder().setCustomId('ticket_pomoc').setLabel('Pomoc').setStyle(ButtonStyle.Danger).setEmoji('❓'),
                new ButtonBuilder().setCustomId('ticket_konkurs').setLabel('Odbierz Konkurs').setStyle(ButtonStyle.Success).setEmoji('🏆')
            )] 
        });
    }

    if (m.content === '!aktualizuj-embedy' && a) {
        await m.reply('🔄 Aktualizuję embedy...');
        let updated = 0;
        for (const [, ch] of m.guild.channels.cache.filter(c => c.type === ChannelType.GuildText)) {
            let last; while (true) {
                const msgs = await ch.messages.fetch({ limit: 100, before: last }).catch(() => null);
                if (!msgs || msgs.size === 0) break;
                for (const [, msg] of msgs) {
                    if (msg.author.id === client.user.id && msg.embeds.length > 0) {
                        const oldEmbed = msg.embeds[0];
                        const newEmbed = EmbedBuilder.from(oldEmbed);
                        let needsUpdate = false;
                        if (oldEmbed.title?.includes('TitanLAND')) { newEmbed.setTitle(oldEmbed.title.replace(/TitanLAND/g, 'TitanHUB')); needsUpdate = true; }
                        if (oldEmbed.description?.includes('TitanLAND')) { newEmbed.setDescription(oldEmbed.description.replace(/TitanLAND/g, 'TitanHUB')); needsUpdate = true; }
                        if (oldEmbed.footer?.text?.includes('TitanLAND')) { newEmbed.setFooter({ text: oldEmbed.footer.text.replace(/TitanLAND/g, 'TitanHUB'), iconURL: oldEmbed.footer.iconURL }); needsUpdate = true; }
                        const fullText = (oldEmbed.title || '') + ' ' + (oldEmbed.description || '');
                        if (fullText.includes('KONKURS')) { newEmbed.setColor(0xFF0000); needsUpdate = true; }
                        else if (fullText.includes('METODY')) { newEmbed.setColor(0x00FF00); needsUpdate = true; }
                        else if (fullText.includes('ZAKUP') || fullText.includes('Zamówienie')) { newEmbed.setColor(0x800080); needsUpdate = true; }
                        else if (fullText.includes('CENNIK')) { newEmbed.setColor(0x0000FF); needsUpdate = true; }
                        else if (fullText.includes('LEGIT')) { newEmbed.setColor(0x00FF00); needsUpdate = true; }
                        if (needsUpdate) { await msg.edit({ embeds: [newEmbed] }).catch(() => {}); updated++; }
                    }
                }
                last = msgs.last().id;
                if (msgs.size < 100) break;
            }
        }
        return m.channel.send(`✅ Zaktualizowano ${updated} embedów!`);
    }

    if (m.content.startsWith('!konkurs') && a) {
        const args = m.content.split(' ').slice(1);
        const duration = parseDuration(args[0]); const titans = parseInt(args[1]); const winners = parseInt(args[2]);
        if (!duration) return m.reply('Użyj: !konkurs 1h 10 3');
        const ch = client.channels.cache.get(CONFIG.konkursChannelID);
        const endTime = Date.now() + duration;
        const id = Date.now();
        activeContests.set(id, { titans, winners, endTime, participants: new Set() });
        const msg = await ch.send({ content: '@everyone', embeds: [new EmbedBuilder().setTitle('🎉 KONKURS TITANHUB!').setColor(0xFF0000).setDescription(`**Wielki Konkurs!**\n\n💎 **Nagroda:** ${titans}x Titanów\n👥 **Wygranych:** ${winners}\n⏰ **Koniec:** <t:${Math.floor(endTime / 1000)}:R>`).setFooter({ text: '🌴 TitanHUB' })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`join_${id}`).setLabel('🎉 Dołącz').setStyle(ButtonStyle.Success))] });
        activeContests.get(id).messageId = msg.id;
        setTimeout(async () => {
            const c = activeContests.get(id);
            const winnersList = shuffle([...c.participants]).slice(0, Math.min(winners, c.participants.length));
            await ch.send({ embeds: [new EmbedBuilder().setTitle('🏆 KONKURS ZAKOŃCZONY').setColor(0xFF0000).setDescription(winnersList.length ? `**Wygrani:**\n${winnersList.map((w, i) => `${i + 1}. <@${w}>`).join('\n')}` : 'Brak uczestników').setFooter({ text: '🌴 TitanHUB' })] });
            activeContests.delete(id);
        }, duration);
        return m.reply('✅ Konkurs utworzony!');
    }
});

client.on('interactionCreate', async i => {
    try {
        // WERYFIKACJA
        if (i.customId === 'verify') {
            const role = i.guild.roles.cache.get(CONFIG.memberRoleID) || i.guild.roles.cache.find(r => r.name.includes('Zweryfikowany'));
            if (!role) return i.reply({ content: '❌ Brak roli!', ephemeral: true });
            if (i.member.roles.cache.has(role.id)) return i.reply({ content: '✅ Już zweryfikowany!', ephemeral: true });
            await i.member.roles.add(role);
            return i.reply({ content: `✅ Zweryfikowano na TitanHUB!`, ephemeral: true });
        }

        // TICKETY - NOWY SYSTEM
        if (i.customId === 'ticket_zakup') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_zakup_select').setPlaceholder('Wybierz metodę płatności...').addOptions([
                    { label: 'BLIK', value: 'blik', emoji: '📱', description: 'Płatność BLIK' },
                    { label: 'PSC', value: 'psc', emoji: '💳', description: 'Paysafecard' }
                ])
            );
            return i.reply({ embeds: [new EmbedBuilder().setTitle('💳 Wybierz metodę płatności').setColor(0x800080).setDescription('Wybierz z listy poniżej:')], components: [row], ephemeral: true });
        }

        if (i.customId === 'ticket_pomoc') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_pomoc_select').setPlaceholder('Wybierz typ pomocy...').addOptions([
                    { label: 'Zgłoś użytkownika', value: 'zglos', emoji: '🚨', description: 'Zgłoś łamanie regulaminu' },
                    { label: 'Znalazłem błąd', value: 'blad', emoji: '🐛', description: 'Zgłoś błąd na serwerze' },
                    { label: 'Potrzebuję pomocy', value: 'pomoc', emoji: '❓', description: 'Ogólna pomoc' }
                ])
            );
            return i.reply({ embeds: [new EmbedBuilder().setTitle('❓ Wybierz typ pomocy').setColor(0xFF0000).setDescription('Wybierz z listy poniżej:')], components: [row], ephemeral: true });
        }

        if (i.customId === 'ticket_konkurs') {
            await i.deferReply({ ephemeral: true });
            const cat = await getCat(i.guild, '🏆・odbiór-konkurs');
            const ch = await i.guild.channels.create({
                name: `odbior-${i.user.username}`,
                type: ChannelType.GuildText,
                parent: cat.id,
                permissionOverwrites: [
                    { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            await ch.send({ content: `${i.user} <@&${CONFIG.ownerRoleID}>`, embeds: [new EmbedBuilder().setTitle('🏆 Odbiór Nagrody z Konkursu').setColor(0xFFD700).setDescription(`**Użytkownik:** ${i.user}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`).setFooter({ text: 'TitanHUB | Konkurs' })] });
            await i.editReply(`✅ Ticket utworzony: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        // TICKET ZAKUP - SELECT
        if (i.customId === 'ticket_zakup_select') {
            const method = i.values[0];
            const modal = new ModalBuilder().setCustomId(`ticket_zakup_modal_${method}`).setTitle('🛒 Zakup Titanów');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ilosc').setLabel('Ilość Titanów').setStyle(TextInputStyle.Short).setPlaceholder('np. 5').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nick').setLabel('Nick Roblox').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return i.showModal(modal);
        }

        if (i.customId.startsWith('ticket_zakup_modal_')) {
            await i.deferReply({ ephemeral: true });
            const method = i.customId.split('_')[3];
            const ilosc = i.fields.getTextInputValue('ilosc');
            const nick = i.fields.getTextInputValue('nick');
            const cat = await getCat(i.guild, '🎫・zakupy');
            const ch = await i.guild.channels.create({
                name: `zakup-${i.user.username}`,
                type: ChannelType.GuildText,
                parent: cat.id,
                permissionOverwrites: [
                    { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            await ch.send({
                content: `${i.user} <@&${CONFIG.ownerRoleID}>`,
                embeds: [new EmbedBuilder().setTitle('🛒 Nowe Zamówienie').setColor(0x800080).addFields(
                    { name: '👤 Klient', value: `${i.user}`, inline: true },
                    { name: '📦 Ilość', value: `${ilosc}x`, inline: true },
                    { name: '🎮 Nick Roblox', value: nick, inline: true },
                    { name: '💳 Metoda', value: method.toUpperCase(), inline: true }
                ).setFooter({ text: 'TitanHUB | Zakup' }).setTimestamp()]
            });
            await i.editReply(`✅ Ticket zakupowy utworzony: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        // TICKET POMOC - SELECT
        if (i.customId === 'ticket_pomoc_select') {
            await i.deferUpdate();
            const type = i.values[0];
            const types = { zglos: '🚨 Zgłoszenie użytkownika', blad: '🐛 Zgłoszenie błędu', pomoc: '❓ Prośba o pomoc' };
            const cat = await getCat(i.guild, '🆘・pomoc');
            const ch = await i.guild.channels.create({
                name: `pomoc-${i.user.username}`,
                type: ChannelType.GuildText,
                parent: cat.id,
                permissionOverwrites: [
                    { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            await ch.send({
                content: `${i.user} <@&${CONFIG.ownerRoleID}>`,
                embeds: [new EmbedBuilder().setTitle(types[type]).setColor(0xFF0000).setDescription(`**Użytkownik:** ${i.user}\n**Typ:** ${types[type]}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`).setFooter({ text: 'TitanHUB | Pomoc' })]
            });
            await i.editReply({ content: `✅ Ticket pomocy utworzony: ${ch}`, embeds: [], components: [] });
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        // STARE PRZYCISKI - KOMPATYBILNOŚĆ WSTECZNA
        if (i.customId === 'buy_titan') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('payment_method').setPlaceholder('Wybierz metodę...').addOptions([
                    { label: 'BLIK', value: 'blik', emoji: '📱' },
                    { label: 'PSC', value: 'psc', emoji: '💳' }
                ])
            );
            return i.reply({ embeds: [new EmbedBuilder().setDescription('💳 **Wybierz metodę płatności:**').setColor(0x800080)], components: [row], ephemeral: true });
        }

        if (i.customId === 'payment_method') {
            const method = i.values[0];
            const modal = new ModalBuilder().setCustomId(`buy_modal_${method}`).setTitle('Zakup Titanów');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ilosc_titanow').setLabel('Ilość').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nick_roblox').setLabel('Nick Roblox').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return i.showModal(modal);
        }

        if (i.customId.startsWith('buy_modal_')) {
            await i.deferReply({ ephemeral: true });
            const ilosc = i.fields.getTextInputValue('ilosc_titanow');
            const nick = i.fields.getTextInputValue('nick_roblox');
            const cat = await getCat(i.guild, '🎫・zakupy');
            const ch = await i.guild.channels.create({
                name: `zakup-${i.user.username}`,
                type: ChannelType.GuildText,
                parent: cat.id,
                permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
            });
            await ch.send({ embeds: [new EmbedBuilder().setTitle('🛒 Zamówienie').setColor(0x800080).addFields({ name: 'Ilość', value: ilosc }, { name: 'Nick', value: nick })] });
            await i.editReply(`✅ Ticket: ${ch}`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        // KONKURS
        if (i.customId.startsWith('join_')) {
            const c = activeContests.get(parseInt(i.customId.split('_')[1]));
            if (!c) return i.reply({ content: 'Zakończony', ephemeral: true });
            c.participants.add(i.user.id);
            return i.reply({ content: '✅ Dołączyłeś!', ephemeral: true });
        }

        // LEGITCHECK
        if (i.customId === 'create_legitcheck') {
            return i.reply({
                embeds: [new EmbedBuilder().setDescription('💳 **Wybierz metodę:**').setColor(0x00FF00)],
                components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('legitcheck_payment').setPlaceholder('Metoda...').addOptions([{ label: 'BLIK', value: 'blik' }, { label: 'PSC', value: 'psc' }]))],
                ephemeral: true
            });
        }

        if (i.customId === 'legitcheck_payment') {
            const modal = new ModalBuilder().setCustomId(`legitcheck_modal_${i.values[0]}`).setTitle('LegitCheck');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ilosc_titanow_legit').setLabel('Ilość').setStyle(TextInputStyle.Short).setRequired(true)));
            return i.showModal(modal);
        }

        if (i.customId.startsWith('legitcheck_modal_')) {
            await i.deferReply({ ephemeral: true });
            const ilosc = i.fields.getTextInputValue('ilosc_titanow_legit');
            const ch = client.channels.cache.get(CONFIG.legitResultChannelID);
            const msgs = await ch.messages.fetch({ limit: 100 });
            const n = msgs.filter(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes('LegitCheck')).size + 1;
            await ch.send({ embeds: [new EmbedBuilder().setTitle(`✅ TitanHUB LegitCheck #${n}`).setColor(0x00FF00).setDescription(`📦 **${ilosc}x**\n👤 ${i.user}`).setFooter({ text: `TitanHUB | #${n}` })] });
            await ch.setName(`${LEGIT_CHANNEL_BASE_NAME}${n}`).catch(() => {});
            await i.editReply(`✅ LegitCheck #${n} utworzony!`);
            setTimeout(() => i.deleteReply().catch(() => {}), 10000);
            return;
        }

        if (i.customId === 'close_ticket') {
            await i.reply({ content: 'Zamykanie...', ephemeral: true });
            setTimeout(() => i.channel.delete().catch(() => {}), 3000);
        }

    } catch (e) {
        console.error('Interaction error:', e);
        try { await i.reply({ content: '❌ Wystąpił błąd!', ephemeral: true }); } catch {}
    }
});

client.login(TOKEN);
