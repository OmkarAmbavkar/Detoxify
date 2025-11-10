// backend/youtubeApi.js

// Loads environment variables (like YOUTUBE_API_KEY) from .env
require('dotenv').config(); 
const axios = require('axios');

const API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Fetches a list of relevant YouTube video IDs for a given search query.
 * It prioritizes 'long' videos (20+ minutes) for maximum algorithmic impact.
 * * @param {string} topic - The search term (e.g., "Rust programming").
 * @returns {Promise<string[]>} An array of video IDs.
 */
async function getCuratedVideoIds(topic) {
    if (!API_KEY) {
        throw new Error("ERROR: YOUTUBE_API_KEY is missing. Check your .env file.");
    }

    try {
        const response = await axios.get(YOUTUBE_SEARCH_URL, {
            params: {
                key: API_KEY,
                part: 'snippet',
                // Search query is enhanced to find tutorials and long-form content
                q: `${topic} tutorial long form`, 
                type: 'video',
                maxResults: 10, // Get 10 potential videos
                videoDuration: 'long', // Filter for videos 20 minutes or longer
                relevanceLanguage: 'en'
            }
        });

        // Map the results to just extract the video ID
        const videoIds = response.data.items
            .filter(item => item.id.videoId)
            .map(item => item.id.videoId);

        console.log(`[YouTube API] Found ${videoIds.length} long videos for topic "${topic}".`);
        return videoIds;

    } catch (error) {
        // Log detailed error information for debugging API failures
        const errorMessage = error.response ? error.response.data.error.message : error.message;
        console.error(`[YouTube API] FAILED: ${errorMessage}`);
        throw new Error(`Failed to fetch videos from YouTube. Check your API key or quota.`);
    }
}

module.exports = {
    getCuratedVideoIds
};
