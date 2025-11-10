const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { getCuratedVideoIds } = require('./youtubeApi');
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
const PORT = 3000;
const MIN_WATCH_TIME_PER_VIDEO_MS = 30000; // 30 seconds minimum watch time per video

// ----------------------------------------------------
// SOCKET.IO SETUP
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: '*', // Allows connection from any origin
        methods: ["GET", "POST"]
    },
    transports: ['websocket'] // Force WebSocket transport
});

// Middleware to expose the socket.io instance
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Configuration
app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper function to emit logs
const emitLog = (socketId, message, type = 'status-in-progress') => {
    io.to(socketId).emit('log', { message, type });
};


/**
 * Core automation logic
 */
async function runDetoxAutomation(topic, totalDurationSeconds, rawCookies, socketId) {
    let browser;
    const log = (msg, type) => emitLog(socketId, msg, type);

    try {
        // --- 1. Validate and Parse Cookies ---
        log("Validating authentication data...");
        if (!rawCookies) {
             throw new Error("User authentication failed: Cookies were not provided.");
        }
        let cookies;
        try {
            cookies = JSON.parse(rawCookies);
        } catch (e) {
            throw new Error("User authentication failed: Cookies format is invalid JSON.");
        }
        
        // --- Cookie Normalization to prevent errors ---
        cookies = cookies.map(cookie => {
            const newCookie = { ...cookie };
            // Remove properties that can cause errors with puppeteer
            delete newCookie.storeId;
            delete newCookie.id; 
            if (newCookie.session) {
                delete newCookie.expirationDate;
            }
            // Handle invalid sameSite values, specifically 'no_restriction'
            if (newCookie.sameSite && typeof newCookie.sameSite === 'string') {
                const normalizedSameSite = newCookie.sameSite.toLowerCase();
                if (normalizedSameSite === 'no_restriction') {
                    newCookie.sameSite = 'None'; // Explicitly set to 'None' for Puppeteer compatibility
                } else if (normalizedSameSite !== 'strict' && normalizedSameSite !== 'lax' && normalizedSameSite !== 'none') {
                     // If it's an unrecognized string, delete it to let Puppeteer use default
                    delete newCookie.sameSite;
                }
            } else if (newCookie.sameSite === null || newCookie.sameSite === undefined) {
                delete newCookie.sameSite; // Let Puppeteer use its default
            }
            return newCookie;
        });

        log("Cookies parsed and normalized. Fetching video list...");

        // 2. Get Video List
        const videoIds = await getCuratedVideoIds(topic);
        if (videoIds.length === 0) {
            throw new Error('Could not find relevant long-form videos for this topic.');
        }
        log(`Found ${videoIds.length} videos. Initiating browser automation...`);

        // 3. Launch Browser
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 50,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );

        // --- 4. Login via Cookies ---
        log('Applying user session cookies...');
        await page.setCookie(...cookies);
        log('Cookies set. Navigating to YouTube...');
        
        await page.goto('https://www.youtube.com/', { waitUntil: 'networkidle0', timeout: 30000 });
        
        const isLoggedIn = await page.$('ytd-topbar-menu-button-renderer a[href*="channel"]');
        if (!isLoggedIn) {
            log("WARNING: Login verification failed. Cookies may be expired.", 'status-error');
        } else {
            log("SUCCESS: Login confirmed.", 'status-success');
        }

        // --- 5. Loop and Watch Videos ---
        let watchedTime = 0;
        const totalDurationMs = totalDurationSeconds * 1000;
        
        for (const [index, videoId] of videoIds.entries()) {
            if (watchedTime >= totalDurationMs) break;

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const remainingTime = totalDurationMs - watchedTime;
            const watchDuration = Math.min(MIN_WATCH_TIME_PER_VIDEO_MS, remainingTime); 
            const durationSeconds = (watchDuration / 1000).toFixed(1);

            log(`Watching video ${index + 1}/${videoIds.length} for ${durationSeconds}s.`);
            await page.goto(videoUrl, { waitUntil: 'networkidle0', timeout: 60000 }); 
            
            // FIX: Replaced deprecated page.waitForTimeout
            await new Promise(r => setTimeout(r, watchDuration)); 
            watchedTime += watchDuration;
        }

        const finalMessage = `Detox session finished. Total time simulated: ${(watchedTime / 1000).toFixed(1)}s.`;
        io.to(socketId).emit('detoxComplete', { success: true, message: finalMessage });

    } catch (error) {
        console.error('Puppeteer Automation Failed:', error);
        io.to(socketId).emit('detoxError', { message: error.message });
    } finally {
        if (browser) {
            await browser.close();
            console.log('[Puppeteer] Browser closed.');
        }
    }
}

// API Endpoint
app.post('/detox/start', async (req, res) => {
    const { topic, duration, userCookies, socketId } = req.body; 
    if (!topic || !userCookies || !socketId) {
        return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }
    console.log(`API Request received (Socket ID: ${socketId}). Starting detox for topic "${topic}".`);
    res.status(200).json({ success: true, message: 'Process initiated.' });
    runDetoxAutomation(topic, duration || 60, userCookies, socketId);
});

// Start Server
// Ensure the server binds to '0.0.0.0' to be accessible from 'localhost' or '127.0.0.1'
server.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Detoxify Backend running on http://localhost:${PORT}`);
});