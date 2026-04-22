/* eslint-disable no-console */
// Render an HTML file to PNG using puppeteer (bundled with @mermaid-js/mermaid-cli).
// Usage: node scripts/render-html-to-png.js <input.html> <output.png> [width] [height] [dpr]

const fs = require('fs');
const path = require('path');

const PUPPETEER_PATH = 'C:/Users/alexl/AppData/Roaming/npm/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer';
const puppeteer = require(PUPPETEER_PATH);

async function main() {
  const [input, output, w = '1200', h = '900', dpr = '2'] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node render-html-to-png.js <input.html> <output.png> [width] [height] [dpr]');
    process.exit(1);
  }
  const width = parseInt(w, 10);
  const height = parseInt(h, 10);
  const deviceScaleFactor = parseFloat(dpr);

  const abs = path.resolve(input);
  const url = 'file:///' + abs.replace(/\\/g, '/');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor });
    await page.goto(url, { waitUntil: 'networkidle0' });
    // Give fonts a tick to settle
    await new Promise(r => setTimeout(r, 400));
    const buffer = await page.screenshot({ type: 'png', omitBackground: false, fullPage: false });
    fs.writeFileSync(output, buffer);
    console.log(`Wrote ${output} (${(buffer.length / 1024).toFixed(1)} KB, ${width}x${height} @ ${deviceScaleFactor}x)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
