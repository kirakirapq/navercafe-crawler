const express = require('express');
const puppeteer = require('puppeteer');
const app = express()

app.use(async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.send('Please provide URL as GET parameter, for example: <a href="/?url=https://example.com">?url=https://example.com</a>');
    }

    console.info(`start job`);

    const browser = await puppeteer.launch({
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--use-gl=egl',
        '--no-sandbox',
        '-disable-setuid-sandbox'],
      // executablePath: '/usr/bin/chromium-browser'
      executablePath: '/usr/bin/google-chrome-stable'
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    // await page.waitForTimeout(3000); // ミリ秒
    await page.evaluate(_ => {
      window.scrollBy(0, window.innerHeight);
    });
    // await page.waitForTimeout(3000); // ミリ秒
    const imageBuffer = await page.screenshot({ fullPage: true });
    browser.close();

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (e) {
    console.error(e);
  }
});

const server = app.listen(process.env.PORT || 8080, err => {
  if (err) return console.error(err);
  const port = server.address().port;
  console.info(`App listening on port ${port}`);
});
