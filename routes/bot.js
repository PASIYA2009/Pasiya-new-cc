const express = require('express');
const router = express.Router();
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    Browsers,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info'
});

// Store active bot instances
const botInstances = new Map();
const SESSION_BASE_PATH = './session';

/**
 * Initialize bot instance
 */
async function initializeBot(sessionId) {
    const sessionPath = path.join(SESSION_BASE_PATH, sessionId);

    if (!fs.existsSync(sessionPath)) {
        throw new Error('Session not found');
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            logger,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                return { conversation: 'Hello!' };
            }
        });

        // Connection handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = 
                    lastDisconnect?.error instanceof Boom &&
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    logger.info('Reconnecting bot...');
                    setTimeout(() => initializeBot(sessionId), 3000);
                }
            } else if (connection === 'open') {
                logger.info('✓ Bot connected successfully');
            }
        });

        // Save credentials
        sock.ev.on('creds.update', saveCreds);

        // Message handler
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const message of messages) {
                try {
                    await handleMessage(sock, message);
                } catch (error) {
                    logger.error('Message handling error:', error);
                }
            }
        });

        botInstances.set(sessionId, {
            sock,
            sessionId,
            connectedAt: Date.now(),
            isActive: true
        });

        return sock;

    } catch (error) {
        logger.error('Bot initialization error:', error);
        throw error;
    }
}

/**
 * Handle incoming messages
 */
async function handleMessage(sock, message) {
    const from = message.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = message.key.fromMe ? sock.user.id : (isGroup ? message.key.participant : from);

    // Extract message content
    const messageContent = message.message;
    if (!messageContent) return;

    const textMessage = 
        messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        messageContent.videoMessage?.caption ||
        '';

    logger.info(`Message from ${sender}: ${textMessage}`);

    // Auto-reply example
    const prefix = process.env.PREFIX || '.';
    
    if (textMessage.startsWith(prefix)) {
        const command = textMessage.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = textMessage.slice(prefix.length + command.length).trim();

        switch (command) {
            case 'ping':
                await sock.sendMessage(from, {
                    text: '🏓 Pong! Bot is active and running.'
                });
                break;

            case 'help':
                await sock.sendMessage(from, {
                    text: `*Available Commands:*\n\n${prefix}ping - Check bot status\n${prefix}help - Show this message\n${prefix}about - About this bot`
                });
                break;

            case 'about':
                await sock.sendMessage(from, {
                    text: `*WhatsApp Bot - Clever Cloud Edition*\n\nVersion: ${process.env.BOT_VERSION || '2.0.0'}\nPrefix: ${prefix}\n\nEnhanced with:\n✓ Fast pairing\n✓ Business API ready\n✓ Multi-device support\n✓ Session persistence`
                });
                break;

            default:
                // Command not found
                break;
        }
    }
}

/**
 * POST /api/bot/start
 * Start bot instance
 */
router.post('/start', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        // Check if already running
        if (botInstances.has(sessionId)) {
            return res.json({
                success: true,
                message: 'Bot already running',
                sessionId
            });
        }

        // Initialize bot
        await initializeBot(sessionId);

        res.json({
            success: true,
            message: 'Bot started successfully',
            sessionId
        });

    } catch (error) {
        logger.error('Bot start error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start bot',
            error: error.message
        });
    }
});

/**
 * POST /api/bot/stop
 * Stop bot instance
 */
router.post('/stop', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!botInstances.has(sessionId)) {
            return res.status(404).json({
                success: false,
                message: 'Bot instance not found'
            });
        }

        const instance = botInstances.get(sessionId);
        await instance.sock.logout();
        botInstances.delete(sessionId);

        res.json({
            success: true,
            message: 'Bot stopped successfully'
        });

    } catch (error) {
        logger.error('Bot stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop bot',
            error: error.message
        });
    }
});

/**
 * GET /api/bot/status
 * Get bot status
 */
router.get('/status', (req, res) => {
    const instances = Array.from(botInstances.entries()).map(([id, instance]) => ({
        sessionId: id,
        isActive: instance.isActive,
        connectedAt: instance.connectedAt,
        uptime: Date.now() - instance.connectedAt
    }));

    res.json({
        success: true,
        count: instances.length,
        instances
    });
});

/**
 * POST /api/bot/send
 * Send message
 */
router.post('/send', async (req, res) => {
    try {
        const { sessionId, to, message, type = 'text' } = req.body;

        if (!sessionId || !to || !message) {
            return res.status(400).json({
                success: false,
                message: 'sessionId, to, and message are required'
            });
        }

        if (!botInstances.has(sessionId)) {
            return res.status(404).json({
                success: false,
                message: 'Bot instance not found'
            });
        }

        const instance = botInstances.get(sessionId);
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

        let result;
        switch (type) {
            case 'text':
                result = await instance.sock.sendMessage(jid, {
                    text: message
                });
                break;

            case 'image':
                result = await instance.sock.sendMessage(jid, {
                    image: { url: message },
                    caption: req.body.caption || ''
                });
                break;

            case 'video':
                result = await instance.sock.sendMessage(jid, {
                    video: { url: message },
                    caption: req.body.caption || ''
                });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message type'
                });
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: result.key.id
        });

    } catch (error) {
        logger.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

module.exports = router;
