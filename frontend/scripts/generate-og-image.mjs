import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '..', 'public');
const outputPath = path.join(outputDir, 'og-image.png');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      overflow: hidden;
      position: relative;
      display: flex; align-items: center;
    }
    .glow {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .glow-1 {
      width: 600px; height: 600px;
      top: -200px; right: -150px;
      background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
    }
    .glow-2 {
      width: 400px; height: 400px;
      bottom: -100px; left: -100px;
      background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
    }
    .grid {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image:
        linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 1;
      padding: 80px;
      width: 100%;
    }
    .top-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
    }
    .badge {
      width: 64px; height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 8px 32px rgba(14,165,233,0.35);
    }
    .badge svg { width: 34px; height: 34px; }
    .title {
      font-size: 52px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      line-height: 1.1;
    }
    .tagline {
      font-size: 22px;
      font-weight: 400;
      color: #38bdf8;
      margin-bottom: 40px;
      letter-spacing: -0.3px;
    }
    .flow {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .flow-dot {
      width: 40px; height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(56,189,248,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      color: #94a3b8;
    }
    .flow-dot.filled {
      border-color: #38bdf8;
      background: rgba(56,189,248,0.12);
      color: #ffffff;
    }
    .flow-arrow {
      color: rgba(56,189,248,0.3);
      font-size: 18px;
      font-weight: 300;
    }
    .url {
      position: absolute;
      bottom: 36px;
      left: 80px;
      font-size: 13px;
      font-weight: 400;
      color: rgba(100, 116, 139, 0.5);
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .accent-line {
      position: absolute;
      top: 0; left: 0;
      width: 8px; height: 100%;
      background: linear-gradient(180deg, #0ea5e9, #0284c7);
    }
  </style>
</head>
<body>
  <div class="accent-line"></div>
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>
  <div class="grid"></div>
  <div class="content">
    <div class="top-row">
      <div class="badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <span class="title">BillSplitter</span>
    </div>
    <div class="tagline">Split bills effortlessly</div>
    <div class="flow">
      <div class="flow-dot filled">A</div>
      <span class="flow-arrow">→</span>
      <div class="flow-dot filled">B</div>
      <span class="flow-arrow">→</span>
      <div class="flow-dot">C</div>
    </div>
  </div>
  <div class="url">groupbillsplit.me</div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log(`OG image generated: ${outputPath}`);
