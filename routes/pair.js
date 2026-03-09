const express = require('express');
const router = express.Router();
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info'
});

// Store active pairing sessions
const pairingSessions = new Map();
const SESSION_BASE_PATH = './session';

// Ensure session directory exists
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

/**
 * Enhanced pairing with faster connection
 * Supports both QR code and pairing code methods
 */
async function createPairingSession(phoneNumber, usePairingCode = true) {
    const sessionId = `session_${phoneNumber}`;
    const sessionPath = path.join(SESSION_BASE_PATH, sessionId);

    try {
        // Ensure session directory exists
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        // Get latest Baileys version for better compatibility
        const { version } = await fetchLatestBaileysVersion();
        
        // Load authentication state
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        // Create socket with optimized settings for faster connection
        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            printQRInTerminal: !usePairingCode,
            browser: Browsers.ubuntu('Chrome'),
            logger,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false, // Faster initial sync
            markOnlineOnConnect: false, // Don't mark online immediately
            getMessage: async (key) => {
                return { conversation: 'Hello!' };
            },
            // Optimizations for faster pairing
            connectTimeoutMs: 30000,
            defaultQueryTimeoutMs: 20000,
            keepAliveIntervalMs: 30000,
            retryRequestDelayMs: 250
        });

        // Store session
        pairingSessions.set(sessionId, {
            sock,
            phoneNumber,
            createdAt: Date.now(),
            paired: false
        });

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !usePairingCode) {
                logger.info('QR Code generated for:', phoneNumber);
                // QR code can be sent to frontend
            }

            if (connection === 'close') {
                const shouldReconnect = 
                    lastDisconnect?.error instanceof Boom &&
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

                logger.info('Connection closed, reconnecting:', shouldReconnect);

                if (shouldReconnect) {
                    await delay(3000);
                    // Reconnection will be handled by the caller
                }
            } else if (connection === 'open') {
                logger.info('✓ Connection opened successfully for:', phoneNumber);
                const session = pairingSessions.get(sessionId);
                if (session) {
                    session.paired = true;
                    session.connectedAt = Date.now();
                }
            }
        });

        // Credentials update handler
        sock.ev.on('creds.update', saveCreds);

        // Generate pairing code if requested
        if (usePairingCode && !sock.authState.creds.registered) {
            // Clean phone number
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // Request pairing code
            const code = await sock.requestPairingCode(cleanNumber);
            logger.info(`Pairing code generated for ${cleanNumber}: ${code}`);
            
            return {
                success: true,
                pairingCode: code,
                phoneNumber: cleanNumber,
                sessionId,
                message: 'Enter this code in WhatsApp: Link a Device > Link with Phone Number'
            };
        }

        return {
            success: true,
            sessionId,
            message: usePairingCode 
                ? 'Pairing code will be generated' 
                : 'Scan QR code in WhatsApp'
        };

    } catch (error) {
        logger.error('Pairing error:', error);
        throw error;
    }
}

/**
 * POST /api/pair/code
 * Generate pairing code for phone number
 */
router.post('/code', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate phone number format
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Check if session already exists
        const sessionId = `session_${cleanNumber}`;
        if (pairingSessions.has(sessionId)) {
            const session = pairingSessions.get(sessionId);
            if (session.paired) {
                return res.json({
                    success: true,
                    message: 'Already paired',
                    sessionId,
                    paired: true
                });
            }
        }

        // Create pairing session
        const result = await createPairingSession(cleanNumber, true);

        res.json(result);

    } catch (error) {
        logger.error('Pairing code generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate pairing code',
            error: error.message
        });
    }
});

/**
 * GET /api/pair/status/:sessionId
 * Check pairing status
 */
router.get('/status/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (!pairingSessions.has(sessionId)) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }

    const session = pairingSessions.get(sessionId);

    res.json({
        success: true,
        sessionId,
        paired: session.paired,
        phoneNumber: session.phoneNumber,
        createdAt: session.createdAt,
        connectedAt: session.connectedAt
    });
});

/**
 * DELETE /api/pair/session/:sessionId
 * Remove pairing session
 */
router.delete('/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    if (!pairingSessions.has(sessionId)) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }

    const session = pairingSessions.get(sessionId);
    
    try {
        // Close socket connection
        if (session.sock) {
            await session.sock.logout();
        }

        // Remove session
        pairingSessions.delete(sessionId);

        // Optionally delete session files
        const sessionPath = path.join(SESSION_BASE_PATH, sessionId);
        if (fs.existsSync(sessionPath)) {
            fs.removeSync(sessionPath);
        }

        res.json({
            success: true,
            message: 'Session removed successfully'
        });

    } catch (error) {
        logger.error('Session removal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove session',
            error: error.message
        });
    }
});

/**
 * GET /api/pair/qr
 * Generate QR code for pairing
 */
router.get('/qr', async (req, res) => {
    try {
        const phoneNumber = req.query.phone || 'default';
        const result = await createPairingSession(phoneNumber, false);

        res.json(result);

    } catch (error) {
        logger.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
});

/**
 * GET /api/pair/sessions
 * List all active sessions
 */
router.get('/sessions', (req, res) => {
    const sessions = Array.from(pairingSessions.entries()).map(([id, session]) => ({
        sessionId: id,
        phoneNumber: session.phoneNumber,
        paired: session.paired,
        createdAt: session.createdAt,
        connectedAt: session.connectedAt
    }));

    res.json({
        success: true,
        count: sessions.length,
        sessions
    });
});

// Cleanup old sessions (run every hour)
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of pairingSessions.entries()) {
        if (!session.paired && (now - session.createdAt) > maxAge) {
            logger.info('Removing old unpaired session:', sessionId);
            if (session.sock) {
                session.sock.end();
            }
            pairingSessions.delete(sessionId);
        }
    }
}, 60 * 60 * 1000);

module.exports = router;
