// File polyfill for Node.js
if (typeof File === 'undefined') {
    global.File = class File extends Blob {
        constructor(bits, name, options = {}) {
            super(bits, options);
            this.name = name;
            this.lastModified = options.lastModified || Date.now();
        }
    };
}

if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}

require("events").EventEmitter.defaultMaxListeners = 960;
require("./guru/gmdHelpers");

const {
    default: guruConnect,
    downloadContentFromMessage,
    getContentType,
    fetchLatestWaWebVersion,
} = require("gifted-baileys");

const {
    evt,
    logger,
    emojis,
    commands,
    setSudo,
    delSudo,
    GuruTechApi,
    GuruApiKey,
    GuruAutoReact,
    GuruAntiLink,
    GuruAntibad,
    GuruAutoBio,
    handleGameMessage,
    GuruChatBot,
    loadSession,
    useSQLiteAuthState,
    getMediaBuffer,
    getSudoNumbers,
    getFileContentType,
    bufferToStream,
    uploadToPixhost,
    uploadToImgBB,
    setCommitHash,
    getCommitHash,
    gmdBuffer,
    gmdJson,
    formatAudio,
    formatVideo,
    toAudio,
    uploadToGithubCdn,
    uploadToGuruCdn,
    uploadToCatbox,
    GuruAnticall,
    createContext,
    createContext2,
    verifyJidState,
    GuruAntiDelete,
    GuruAntiEdit,
    syncDatabase,
    initializeSettings,
    initializeGroupSettings,
    getAllSettings,
    DEFAULT_SETTINGS,
    standardizeJid,
    serializeMessage,
    loadPlugins,
    findCommand,
    findBodyCommand,
    createHelpers,
    getGroupInfo,
    buildSuperUsers,
    getGroupMetadata,
    createSocketConfig,
    safeNewsletterFollow,
    safeGroupAcceptInvite,
    setupConnectionHandler,
    setupGroupEventsListeners,
    initializeLidStore,
} = require("./guru");

const {
    saveAntiDelete,
    findAntiDelete,
    removeAntiDelete,
    startCleanup,
    SQLiteStore,
} = require('./guru/database/messageStore');

const config = require("./config");
const googleTTS = require("google-tts-api");
const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');
const express = require("express");

const BOT_CONFIG = {
    name: "ULTRA GURU",
    owner: "GuruTech",
    imageUrl: "https://files.catbox.moe/5evber.jpg",
    repo: "https://github.com/GuruhTech/ULTRA-GURU",
    newsletter: "120363406466294627@newsletter",
    version: "2.0.0"
};

const log = {
    info: (msg) => console.log(`🌿 ${msg}`),
    ok: (msg) => console.log(`🌻 ${msg}`),
    err: (msg) => console.log(`🍂 ${msg}`),
    connect: (msg) => console.log(`🍃 ${msg}`)
};

const PORT = process.env.PORT || 5000;
const app = express();
let Guru;
let store;

logger.level = "silent";
app.use(express.static("guru"));
app.get("/", (req, res) => res.sendFile(__dirname + "/guru/guruh.html"));
app.get("/health", (req, res) =>
    res.status(200).json({ status: "alive", uptime: process.uptime() })
);
app.listen(PORT, () => log.ok(`Server on port ${PORT}`));

const sessionDir = path.join(__dirname, "guru", "session");
const pluginsPath = path.join(__dirname, "guruh");

startCleanup();

async function startGuru() {
    log.info("Starting ULTRA GURU...");
    
    try {
        await syncDatabase();
        await initializeSettings();
        await initializeGroupSettings();
        log.ok("Database initialized");
        
        await loadSession();
        log.ok("Session loaded");
        
        const { version } = await fetchLatestWaWebVersion();
        const sessionDbPath = path.join(sessionDir, "session.db");
        const { state, saveCreds } = await useSQLiteAuthState(sessionDbPath);
        
        if (store) store.destroy();
        store = new SQLiteStore();

        const socketConfig = createSocketConfig(version, state, logger);
        socketConfig.getMessage = async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return { conversation: "Error occurred" };
        };

        Guru = guruConnect(socketConfig);
        store.bind(Guru.ev);

        Guru.ev.process(async (events) => {
            if (events["creds.update"]) await saveCreds();
        });

        setupAutoReact(Guru);
        setupAntiDelete(Guru);
        setupAutoBio(Guru);
        setupAntiCall(Guru);
        setupNewsletterReact(Guru);
        setupChatBotAndAntiLink(Guru);
        setupAntiEdit(Guru);
        setupStatusHandlers(Guru);
        setupGroupEventsListeners(Guru);

        loadPlugins(pluginsPath);
        setupCommandHandler(Guru);

        setupConnectionHandler(Guru, sessionDir, startGuru, {
            onOpen: async (Guru) => {
                log.ok("WhatsApp Connected! 🌿");
                const s = await getAllSettings();
                await safeNewsletterFollow(Guru, BOT_CONFIG.newsletter);
                await safeGroupAcceptInvite(Guru, s.GC_JID);
                await initializeLidStore(Guru);

                setTimeout(async () => {
                    try {
                        const totalCommands = commands.filter(
                            (c) => c.pattern && !c.dontAddCommandList,
                        ).length;
                        log.ok(`Ready with ${totalCommands} commands 🍃`);

                        if (s.STARTING_MESSAGE === "true") {
                            const d = DEFAULT_SETTINGS;
                            const md = s.MODE === "public" ? "public" : "private";
                            
                            const connectionMsg = `
┌─────────────────────────┐
│      🌿 ${BOT_CONFIG.name} 🌿      │
│         🌻 READY 🌻         │
├─────────────────────────┤
│ 🌱 Prefix : ${s.PREFIX || d.PREFIX} │
│ 🌿 Mode   : ${md} │
│ 🍃 Owner  : ${BOT_CONFIG.owner} │
└─────────────────────────┘
`;

                            await Guru.sendMessage(
                                Guru.user.id,
                                {
                                    text: connectionMsg,
                                    ...(await createContext(BOT_CONFIG.name, {
                                        title: "🌿 ULTRA GURU 🌿",
                                        body: "🌻 Ready to Serve 🌻",
                                    })),
                                },
                                {
                                    disappearingMessagesInChat: true,
                                    ephemeralExpiration: 300,
                                }
                            );
                        }
                    } catch (err) {
                        log.err(`Post-connection error: ${err.message}`);
                    }
                }, 5000);
            },
        });

        process.on("SIGINT", () => store?.destroy());
        process.on("SIGTERM", () => store?.destroy());
        
    } catch (error) {
        log.err(`Startup error: ${error.message}`);
        setTimeout(() => startGuru(), 5000);
    }
}

function setupAutoReact(Guru) {
    Guru.ev.on("messages.upsert", async (mek) => {
        try {
            const ms = mek.messages[0];
            const s = await getAllSettings();
            const autoReactMode = s.AUTO_REACT || "off";

            if (autoReactMode === "off" || autoReactMode === "false" || ms.key.fromMe || !ms.message) return;

            const from = ms.key.remoteJid;
            const isGroup = from?.endsWith("@g.us");
            const isDm = from?.endsWith("@s.whatsapp.net");

            let shouldReact = false;
            if (autoReactMode === "all" || autoReactMode === "true") shouldReact = true;
            else if (autoReactMode === "dm" && isDm) shouldReact = true;
            else if (autoReactMode === "groups" && isGroup) shouldReact = true;

            if (!shouldReact) return;

            const natureEmojis = ["🌿", "🍃", "🌱", "🍂", "🌻", "🌸", "🌺", "🍁", "🌾", "🌵"];
            const randomEmoji = natureEmojis[Math.floor(Math.random() * natureEmojis.length)];
            await GuruAutoReact(randomEmoji, ms, Guru);
        } catch (err) {}
    });
}

function setupAntiDelete(Guru) {
    const botJid = `${Guru.user?.id.split(":")[0]}@s.whatsapp.net`;
    const botOwnerJid = botJid;

    const getSender = (ms) => {
        const key = ms.key;
        const realJid = (j) => j && !j.endsWith('@lid') ? j : null;
        return (
            realJid(key.participantPn) ||
            realJid(key.senderPn) ||
            realJid(ms.senderPn) ||
            realJid(key.participant) ||
            realJid(ms.participant) ||
            key.participantPn ||
            key.participant ||
            ms.participant ||
            (key.remoteJid?.endsWith("@g.us") ? null : realJid(key.remoteJid) || key.remoteJid)
        );
    };

    const getPushName = (ms) => ms.pushName || ms.key?.pushName || ms.verifiedBizName || "Unknown";

    const getActualMessage = (ms) => {
        const msg = ms.message;
        if (!msg) return null;
        return (
            msg.ephemeralMessage?.message ||
            msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message ||
            msg.documentWithCaptionMessage?.message ||
            msg
        );
    };

    Guru.ev.on("messages.upsert", async ({ messages }) => {
        for (const ms of messages) {
            try {
                if (!ms?.message) continue;
                const { key } = ms;
                if (!key?.remoteJid || key.fromMe || key.remoteJid === "status@broadcast") continue;

                const actualMessage = getActualMessage(ms);
                if (!actualMessage) continue;

                const sender = getSender(ms);
                if (!sender || sender === botJid || sender === botOwnerJid) continue;

                const _jid = key.remoteJid;
                const _entry = { ...ms, message: actualMessage, originalSender: sender, originalPushName: getPushName(ms), timestamp: Date.now() };
                setImmediate(() => saveAntiDelete(_jid, _entry));
            } catch (error) {}
        }
    });
}

function setupAutoBio(Guru) {
    (async () => {
        const s = await getAllSettings();
        if (s.AUTO_BIO === "true") {
            setTimeout(() => GuruAutoBio(Guru), 1000);
            setInterval(() => GuruAutoBio(Guru), 1000 * 60);
        }
    })();
}

function setupAntiCall(Guru) {
    Guru.ev.on("call", async (json) => {
        await GuruAnticall(json, Guru);
    });
}

let _newsletterCache = null;
let _newsletterCacheAt = 0;
const NEWSLETTER_TTL = 2 * 60 * 1000;

async function _getNewsletters() {
    if (_newsletterCache && Date.now() - _newsletterCacheAt < NEWSLETTER_TTL) return _newsletterCache;
    _newsletterCache = [BOT_CONFIG.newsletter];
    _newsletterCacheAt = Date.now();
    return _newsletterCache;
}

function setupNewsletterReact(Guru) {
    const natureEmojis = ["🌿", "🍃", "🌱", "🍂", "🌻", "🌸", "🌺", "🍁", "🌾", "🌵"];
    Guru.ev.on("messages.upsert", async (mek) => {
        try {
            const msg = mek.messages[0];
            if (!msg?.message || !msg?.key?.server_id) return;
            const newsletters = await _getNewsletters();
            if (!newsletters.includes(msg.key.remoteJid)) return;
            const emoji = natureEmojis[Math.floor(Math.random() * natureEmojis.length)];
            if (typeof Guru.newsletterReactMessage === 'function') {
                await Guru.newsletterReactMessage(msg.key.remoteJid, msg.key.server_id.toString(), emoji);
            }
        } catch (err) {}
    });
}

function setupChatBotAndAntiLink(Guru) {
    Guru.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "append") return;

        const firstMsg = messages[0];
        if (firstMsg?.message) {
            const s = await getAllSettings();
            if (s.CHATBOT === "true" || s.CHATBOT === "audio") {
                GuruChatBot(Guru, s.CHATBOT, s.CHATBOT_MODE || "inbox", createContext, createContext2, googleTTS);
            }
        }

        for (const message of messages) {
            if (!message?.message) continue;
            const from = message.key?.remoteJid || "";
            if (message.key.fromMe && !from.endsWith("@g.us")) continue;

            if (from.endsWith("@g.us")) {
                if (typeof GuruAntiLink === 'function') {
                    await GuruAntiLink(Guru, message, getGroupMetadata);
                }
                if (typeof GuruAntibad === 'function') {
                    await GuruAntibad(Guru, message, getGroupMetadata);
                }
            }
            
            if (typeof handleGameMessage === 'function') {
                await handleGameMessage(Guru, message);
            }
        }
    });
}

function setupAntiEdit(Guru) {
    Guru.ev.on("messages.update", async (updates) => {
        for (const update of updates) {
            try {
                if (!update?.update?.message) continue;
                if (update.key?.fromMe) continue;
                if (update.key?.remoteJid === "status@broadcast") continue;
                if (typeof GuruAntiEdit === 'function') {
                    await GuruAntiEdit(Guru, update, findAntiDelete);
                }
            } catch (err) {}
        }
    });
}

function setupStatusHandlers(Guru) {
    Guru.ev.on("messages.upsert", async (mek) => {
        try {
            mek = mek.messages[0];
            if (!mek || !mek.message) return;

            mek.message = getContentType(mek.message) === "ephemeralMessage"
                ? mek.message.ephemeralMessage.message
                : mek.message;

            if (mek.key?.remoteJid !== "status@broadcast") return;

            const s = await getAllSettings();
            const shouldView = s.AUTO_READ_STATUS === "true";

            if (shouldView) {
                await Guru.readMessages([mek.key]);
            }
        } catch (error) {}
    });
}

const processedMessages = new Set();
const BOT_START_TIME = Date.now();

function setupCommandHandler(Guru) {
    Guru.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "append") return;

        const ms = messages[0];
        if (!ms?.message || !ms?.key) return;

        const messageId = ms.key.id;
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);
        setTimeout(() => processedMessages.delete(messageId), 60000);

        const messageTimestamp = (ms.messageTimestamp?.low || ms.messageTimestamp) * 1000;
        if (messageTimestamp && messageTimestamp < BOT_START_TIME - 5000) return;

        const settings = await getAllSettings();
        const botId = standardizeJid(Guru.user?.id);

        const serialized = await serializeMessage(ms, Guru, settings);
        if (!serialized) return;

        const { from, isGroup, body, isCommand, command, args, sender: rawSender, messageAuthor, user, pushName, quoted, repliedMessage, mentionedJid, tagged, quotedMsg, quotedKey, quotedUser } = serialized;

        const groupData = await getGroupInfo(Guru, from, botId, rawSender);
        const { groupInfo, groupName, participants, groupAdmins, groupSuperAdmins, isBotAdmin, isAdmin, isSuperAdmin, sender } = groupData;

        const superUser = await buildSuperUsers(settings, getSudoNumbers, botId, settings.OWNER_NUMBER || "");
        const isSuperUser = superUser.includes(sender);

        const autoReadMode = settings.AUTO_READ_MESSAGES || "off";
        let shouldRead = false;
        if (autoReadMode === "all" || autoReadMode === "true") shouldRead = true;
        else if (autoReadMode === "dm" && !isGroup) shouldRead = true;
        else if (autoReadMode === "groups" && isGroup) shouldRead = true;
        else if (autoReadMode === "commands" && isCommand) shouldRead = true;
        if (shouldRead) await Guru.readMessages([ms.key]);

        if (isCommand && command) {
            const gmd = findCommand(command);
            if (!gmd) return;

            if (settings.MODE?.toLowerCase() === "private" && !isSuperUser) return;

            try {
                const helpers = createHelpers(Guru, ms, from);

                if (settings.AUTO_REACT === "commands") {
                    const natureEmojis = ["🌿", "🍃", "🌱", "🍂", "🌻"];
                    const randomEmoji = natureEmojis[Math.floor(Math.random() * natureEmojis.length)];
                    await Guru.sendMessage(from, { react: { key: ms.key, text: randomEmoji } });
                } else if (gmd.react) {
                    await Guru.sendMessage(from, { react: { key: ms.key, text: gmd.react } });
                }

                setupGuruHelpers(Guru, from);

                const conText = buildContext(ms, settings, helpers, {
                    from, isGroup, groupInfo, groupName, participants, groupAdmins, groupSuperAdmins,
                    isBotAdmin, isAdmin, isSuperAdmin, sender, superUser, isSuperUser, messageAuthor,
                    user, pushName, args, quoted, repliedMessage, mentionedJid, tagged, quotedMsg,
                    quotedKey, quotedUser, Guru, botId, body, command
                });

                await gmd.function(from, Guru, conText);
            } catch (error) {
                try {
                    await Guru.sendMessage(from, { text: `🍂 ${error.message}` }, { quoted: ms });
                } catch (sendErr) {}
            }
        }
    });
}

function setupGuruHelpers(Guru, from) {
    let fileType;
    (async () => { fileType = await import("file-type"); })();

    Guru.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        try {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || "";
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];

            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let fileTypeResult;
            try { fileTypeResult = await fileType.fileTypeFromBuffer(buffer); } catch (e) {}

            const extension = fileTypeResult?.ext || mime.split("/")[1] || 
                (messageType === "image" ? "jpg" : messageType === "video" ? "mp4" : messageType === "audio" ? "mp3" : "bin");
            const trueFileName = attachExtension ? `${filename}.${extension}` : filename;

            await fs.writeFile(trueFileName, buffer);
            return trueFileName;
        } catch (error) { throw error; }
    };
}

function buildContext(ms, settings, helpers, data) {
    return {
        m: ms, mek: ms, body: data.body || "", edit: helpers.edit, react: helpers.react, del: helpers.del,
        args: data.args, arg: data.args, quoted: data.quoted, isCmd: true, command: data.command || "",
        isAdmin: data.isAdmin, isBotAdmin: data.isBotAdmin, sender: data.sender, pushName: data.pushName,
        setSudo, delSudo, q: data.args.join(" "), reply: helpers.reply, config, superUser: data.superUser,
        tagged: data.tagged, mentionedJid: data.mentionedJid, isGroup: data.isGroup, groupInfo: data.groupInfo,
        groupName: data.groupName, getSudoNumbers, authorMessage: data.messageAuthor, user: data.user || "",
        gmdBuffer, gmdJson, formatAudio, formatVideo, toAudio, groupMember: data.isGroup ? data.messageAuthor : "",
        from: data.from, groupAdmins: data.groupAdmins, participants: data.participants,
        repliedMessage: data.repliedMessage, quotedMsg: data.quotedMsg, quotedKey: data.quotedKey,
        quotedUser: data.quotedUser, isSuperUser: data.isSuperUser, botMode: settings.MODE,
        botPic: settings.BOT_PIC || BOT_CONFIG.imageUrl, botFooter: settings.FOOTER || "🌿 ULTRA GURU",
        botCaption: settings.CAPTION || "🌻 Powered by GuruTech",
        botVersion: BOT_CONFIG.version,
        ownerNumber: settings.OWNER_NUMBER, ownerName: BOT_CONFIG.owner, botName: BOT_CONFIG.name,
        guruhRepo: BOT_CONFIG.repo, packName: settings.PACK_NAME, packAuthor: settings.PACK_AUTHOR || BOT_CONFIG.owner,
        isSuperAdmin: data.isSuperAdmin, getMediaBuffer, getFileContentType, bufferToStream,
        uploadToPixhost, uploadToImgBB, setCommitHash, getCommitHash, uploadToGithubCdn,
        uploadToGuruCdn, uploadToCatbox, newsletterUrl: BOT_CONFIG.newsletter,
        newsletterJid: BOT_CONFIG.newsletter, GuruTechApi, GuruApiKey, botPrefix: settings.PREFIX,
        timeZone: settings.TIME_ZONE,
    };
}

async function resolveRealJid(Guru, jid) {
    if (!jid) return null;
    if (!jid.endsWith('@lid')) return jid;
    try {
        const { getLidMapping } = require('./guru/connection/groupCache');
        const cached = getLidMapping(jid);
        if (cached) return cached;
    } catch (_) {}
    try {
        const resolved = await Guru.getJidFromLid(jid);
        if (resolved && !resolved.endsWith('@lid')) return resolved;
    } catch (_) {}
    try {
        const { getLidMappingFromDb } = require('./guru/database/lidMapping');
        const fromDb = await getLidMappingFromDb(jid);
        if (fromDb) return fromDb;
    } catch (_) {}
    return jid;
}

// Start the bot
startGuru();
