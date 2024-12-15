const Parser = require('rss-parser'); // RSS parser for fetching feeds
const fs = require('fs'); // File system for basic storage (replace with a database)

const FEED_URLS = [
  'https://www.dndbeyond.com/rss/news', // Example RSS feed
  'https://www.tabletopgaming.co.uk/rss/' // Replace with relevant feeds
];

const STORAGE_FILE = './db.json'; // Simulated database for storing fetched posts

exports.handler = async function () {
  const parser = new Parser();
  let storedData = {};

  // Load existing data
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      storedData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading storage file:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Storage read error' }) };
  }

  const newPosts = [];

  // Loop through each feed URL
  for (const url of FEED_URLS) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        const postId = `${feed.title}-${item.guid || item.link}`;

        // If post is new, add it to the list and mark it as seen
        if (!storedData[postId]) {
          storedData[postId] = {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
          };
          newPosts.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching feed from ${url}:`, error);
      continue;
    }
  }

  // Save the updated stored data
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving storage file:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Storage write error' }) };
  }

  // Response: New posts (or message if no updates)
  if (newPosts.length > 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `${newPosts.length} new posts found.`,
        posts: newPosts
      })
    };
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No new posts found.' })
    };
  }
};