#!/usr/bin/env node

/**
 * Test YouTube API key directly
 */

import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function testYouTubeAPI() {
  console.log('Testing YouTube API key:', YOUTUBE_API_KEY?.substring(0, 10) + '...');

  try {
    // Test with a simple search query
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=technology&maxResults=1&key=${YOUTUBE_API_KEY}`;

    const response = await axios.get(url);

    if (response.status === 200) {
      console.log('✅ YouTube API key is VALID');
      console.log('Response items:', response.data.items?.length || 0);
      return true;
    }
  } catch (error) {
    console.log('❌ YouTube API key is INVALID');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data?.error?.message || error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

testYouTubeAPI();