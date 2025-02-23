const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Supabase client initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PASSWORD
);

// Instagram credentials
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD;

// Proxy configuration
const PROXY_SERVER = process.env.PROXY_SERVER;
const PROXY_USERNAME = process.env.PROXY_USERNAME;
const PROXY_PASSWORD = process.env.PROXY_PASSWORD;

async function scrapeInstagramFollowers() {
  const browser = await puppeteer.launch({
    headless: false, // Set to true in production
    args: [
      `--proxy-server=${PROXY_SERVER}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();

    // Configure proxy authentication
    await page.authenticate({
      username: PROXY_USERNAME,
      password: PROXY_PASSWORD
    });

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to Instagram login page
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Accept cookies if prompt appears
    try {
      const cookieButton = await page.waitForSelector('button[type="button"]._a9--._a9_1');
      if (cookieButton) await cookieButton.click();
    } catch (e) {
      console.log('No cookie prompt found');
    }

    // Login
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', INSTAGRAM_USERNAME);
    await page.type('input[name="password"]', INSTAGRAM_PASSWORD);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Wait for home page to load
    await page.waitForTimeout(5000);

    // Navigate to profile page
    await page.goto(`https://www.instagram.com/chirala_zone_delivery_services/`, {
      waitUntil: 'networkidle0'
    });

    // Click on followers link
    await page.waitForSelector('a[href*="/followers/"]');
    await page.click('a[href*="/followers/"]');

    // Wait for followers modal to load
    await page.waitForTimeout(2000);

    // Scroll and collect followers
    const followers = await page.evaluate(async () => {
      const followersSet = new Set();
      const followersContainer = document.querySelector('._aano');
      
      // Scroll and collect for 30 seconds
      const endTime = Date.now() + 30000;
      
      while (Date.now() < endTime) {
        const followerElements = document.querySelectorAll('div._ab8w._ab94._ab97._ab9f._ab9k._ab9p._abcm');
        
        followerElements.forEach(element => {
          const username = element.querySelector('._aacl._aaco._aacw._aacx._aad7._aade')?.innerText;
          if (username) followersSet.add(username);
        });

        followersContainer.scrollTop = followersContainer.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return Array.from(followersSet);
    });

    // Upload results to Supabase
    const timestamp = new Date().toISOString();
    const fileName = `instagram_followers_${timestamp}.json`;
    const fileContent = JSON.stringify({
      timestamp,
      username: INSTAGRAM_USERNAME,
      followers
    }, null, 2);

    const { data, error } = await supabase.storage
      .from('scrapy')
      .upload(fileName, fileContent);

    if (error) {
      console.error('Error uploading to Supabase:', error);
    } else {
      console.log('Successfully uploaded followers to Supabase:', data);
    }

    console.log(`Scraped ${followers.length} followers`);
    return followers;

  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeInstagramFollowers()
  .then(followers => console.log('Scraping completed successfully'))
  .catch(error => console.error('Scraping failed:', error));