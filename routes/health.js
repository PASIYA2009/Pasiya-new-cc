const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs-extra');

/**
 * GET /health
 * Health check endpoint for Clever Cloud
 */
router.get('/', (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        server: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                processUsed: process.memoryUsage().heapUsed
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0].model
            }
        },
        sessions: {
            directory: './session',
            exists: fs.existsSync('./session')
        }
    };

    res.json(healthData);
});

/**
 * GET /health/ready
 * Readiness probe for Clever Cloud
 */
router.get('/ready', (req, res) => {
    const isReady = fs.existsSync('./session') && fs.existsSync('./public');

    if (isReady) {
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /health/live
 * Liveness probe for Clever Cloud
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
