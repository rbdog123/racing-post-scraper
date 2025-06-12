const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('Navigating to Racing Post...');
        await page.goto('https://www.racingpost.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for dynamic content
        console.log('Waiting for race cards...');
        await page.waitForSelector('.RC-runnerRow', { timeout: 15000 });
        
        // Extract race data
        console.log('Extracting data...');
        const data = await page.evaluate(() => {
            const races = [];
            
            // Adjust these selectors based on actual Racing Post structure
            document.querySelectorAll('.RC-runnerRow').forEach(row => {
                races.push({
                    horse: row.querySelector('.RC-runnerName')?.innerText.trim(),
                    odds: row.querySelector('.RC-runnerOdds')?.innerText.trim(),
                    time: row.closest('.RC-raceCard')?.querySelector('.RC-raceTime')?.innerText.trim(),
                    course: row.closest('.RC-raceCard')?.querySelector('.RC-courseHeader__name')?.innerText.trim(),
                    scraped_at: new Date().toISOString()
                });
            });
            
            return races;
        });

        // Save results
        const outputPath = path.join(dataDir, 'results.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Data saved to ${outputPath}`);
        
        await browser.close();
        
    } catch (error) {
        console.error('Scraping failed:', error);
        process.exit(1);
    }
})();
