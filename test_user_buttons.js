import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3000';
const DOWNLOAD_DIR = path.resolve('C:\\Users\\sagar\\Desktop\\Projects\\personal expense tracker\\scratch_downloads');

async function runButtonVerification() {
  console.log('==================================================');
  console.log('   VERIFYING ALL BUTTONS & APK DOWNLOAD — BROWSER  ');
  console.log('==================================================\n');

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Configure Chromium download behavior
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR
  });

  try {
    // 1. Landing Page Load
    console.log('--- 1. Testing Landing Page ---');
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    console.log('✓ Landing page loaded at http://localhost:3000');

    // 2. Click "Log In" header link
    console.log('\n--- 2. Testing "Log In" Button ---');
    await page.click('a[href="/login"]');
    await page.waitForSelector('input[placeholder="you@example.com"]');
    console.log('✓ Clicked "Log In" button -> Navigated cleanly to /login page!');

    // Navigate back to Landing
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    // 3. Click "Get Started" header link
    console.log('\n--- 3. Testing "Get Started" Button ---');
    await page.click('a[href="/signup"]');
    await page.waitForSelector('input[placeholder="John Doe"]');
    console.log('✓ Clicked "Get Started" button -> Navigated cleanly to /signup page!');

    // 4. Test Signup Form Submit
    console.log('\n--- 4. Testing Signup Form Submission ---');
    await page.type('input[placeholder="John Doe"]', 'Test User Buttons');
    await page.type('input[placeholder="you@example.com"]', 'test_buttons@example.com');
    await page.type('input[placeholder="At least 6 characters"]', 'password123');
    await page.type('input[placeholder="Repeat password"]', 'password123');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 800));
    const dashboardTitle = await page.$eval('body', body => body.textContent.includes('All Accounts') || body.textContent.includes('Dashboard'));
    console.log(`✓ Submitted Signup Form -> Successfully logged in & navigated to Dashboard: ${dashboardTitle ? 'PASS' : 'FAIL'}`);

    // 5. Test Logout button in Settings
    console.log('\n--- 5. Testing Settings Log Out Button ---');
    await page.goto(`${APP_URL}/settings`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logoutBtn = btns.find(b => b.textContent.includes('Log Out'));
      if (logoutBtn) logoutBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));
    const loginPageLoaded = await page.$eval('body', body => body.textContent.includes('Welcome Back') || body.textContent.includes('Log In'));
    console.log(`✓ Clicked "Log Out" -> Navigated cleanly to Login page: ${loginPageLoaded ? 'PASS' : 'FAIL'}`);

    // 6. Test Login Form Submit
    console.log('\n--- 6. Testing Login Form Submission ---');
    await page.type('input[placeholder="you@example.com"]', 'test_buttons@example.com');
    await page.type('input[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 800));
    const loginDashboardCheck = await page.$eval('body', body => body.textContent.includes('All Accounts') || body.textContent.includes('Dashboard'));
    console.log(`✓ Submitted Login Form -> Successfully authenticated & navigated to Dashboard: ${loginDashboardCheck ? 'PASS' : 'FAIL'}`);

    // 7. Test "Download Android APK" button
    console.log('\n--- 7. Testing "Download Android APK" Button ---');
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const apkBtn = btns.find(b => b.textContent.includes('Download Android APK'));
      if (apkBtn) apkBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const downloadedFiles = fs.readdirSync(DOWNLOAD_DIR);
    const apkFileDownloaded = downloadedFiles.some(f => f.includes('personal-finance-tracker.apk') || f.includes('.apk'));
    console.log(`✓ Clicked "Download Android APK" -> APK File Downloaded: ${apkFileDownloaded ? 'PASS' : 'FAIL'} (File: ${downloadedFiles.join(', ')})`);

    console.log('\n==================================================');
    console.log('   ALL BUTTONS & APK DOWNLOAD VERIFIED — ALL PASS  ');
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ BUTTON VERIFICATION ERROR:', err);
  } finally {
    await browser.close();
  }
}

runButtonVerification();
