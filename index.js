require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');

// Initialize logger
const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

// Initialize Express app
const app = express();
global.__path = process.cwd();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Static files
app.use(express.static('public'));

// Ensure necessary directories exist
const requiredDirs = ['./session', './sessions', './public', './logs'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
});

// Set max listeners
require('events').EventEmitter.defaultMaxListeners = 500;

// Import routes
const pairRouter = require('./routes/pair');
const botRouter = require('./routes/bot');
const healthRouter = require('./routes/health');

// Routes
app.use('/api/pair', pairRouter);
app.use('/api/bot', botRouter);
app.use('/health', healthRouter);

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__path, 'public', 'index.html'));
});

// Pairing page
app.get('/pair', (req, res) => {
    res.sendFile(path.join(__path, 'public', 'pair.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Application error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
    logger.info(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   WhatsApp Bot Server - Clever Cloud Ready       ║
║                                                   ║
║   🚀 Server Status: RUNNING                       ║
║   📡 Host: ${HOST.padEnd(40)}║
║   🔌 Port: ${String(PORT).padEnd(40)}║
║   🌐 URL: http://${HOST}:${PORT}${' '.repeat(Math.max(0, 25 - HOST.length - String(PORT).length))}║
║                                                   ║
║   📝 API Endpoints:                               ║
║   - GET  /health          (Health check)          ║
║   - POST /api/pair/code   (Get pairing code)      ║
║   - GET  /api/bot/status  (Bot status)            ║
║   - POST /api/bot/send    (Send message)          ║
║                                                   ║
║   💡 Features:                                    ║
║   ✓ Fast WhatsApp pairing                         ║
║   ✓ Business API ready                            ║
║   ✓ Multi-device support                          ║
║   ✓ Session persistence                           ║
║   ✓ Rate limiting                                 ║
║   ✓ Security headers                              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server gracefully...');
    server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
