require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PASSWORD
);

// Status tracking
let isScrapingInProgress = false;
let lastScrapeTime = null;
let lastScrapeResult = null;

async function scrapeInstagramFollowers() {
  if (isScrapingInProgress) {
    throw new Error('Scraping is already in progress');
  }

  isScrapingInProgress = true;

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      `--proxy-server=${process.env.PROXY_SERVER}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    // ... existing scraping code ...
    const page = await browser.newPage();

    // Configure proxy authentication
    await page.authenticate({
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD
    });

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to Instagram login page
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // ... rest of your existing scraping code ...

    lastScrapeTime = new Date();
    lastScrapeResult = followers;
    return followers;

  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  } finally {
    isScrapingInProgress = false;
    await browser.close();
  }
}

// API Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Instagram Scraper API is running',
    lastScrapeTime,
    isScrapingInProgress
  });
});

app.post('/scrape', async (req, res) => {
  try {
    if (isScrapingInProgress) {
      return res.status(429).json({
        error: 'Scraping is already in progress',
        lastScrapeTime
      });
    }

    // Start scraping
    const followers = await scrapeInstagramFollowers();
    
    res.json({
      status: 'success',
      message: 'Scraping completed successfully',
      followerCount: followers.length,
      timestamp: lastScrapeTime
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/status', (req, res) => {
  res.json({
    isScrapingInProgress,
    lastScrapeTime,
    lastResultCount: lastScrapeResult ? lastScrapeResult.length : null
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});