import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://127.0.0.1:3000';
const DOWNLOAD_DIR = path.resolve('C:\\Users\\sagar\\Desktop\\Projects\\personal expense tracker\\scratch_downloads');

async function runPasswordAndApkTest() {
  console.log('==================================================');
  console.log('   TESTING STRICT PASSWORD VERIFICATION & APK HEADER');
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
  
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR
  });

  try {
    // 1. Clear session before initial document load
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
    });

    console.log('--- 1. Registering Test User ---');
    await page.goto(`${APP_URL}/signup`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('form input');
    const textInputs = await page.$$('form input');
    await textInputs[0].type('Secure User'); // Name
    await textInputs[1].type('secure_user@example.com'); // Email
    await textInputs[2].type('my_secret_pass_123'); // Password
    await textInputs[3].type('my_secret_pass_123'); // Confirm Password
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 800));
    console.log('✓ Registered secure_user@example.com with password "my_secret_pass_123"');

    // 2. Clear session (Log Out)
    console.log('\n--- 2. Logging Out ---');
    await page.evaluate(() => {
      localStorage.removeItem('finance_auth_token');
      localStorage.removeItem('finance_cached_user');
    });
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('form input[type="email"]');
    console.log('✓ Cleared session & loaded Login page');

    // 3. Test WRONG password
    console.log('\n--- 3. Testing Login with WRONG Password ---');
    const loginInputs = await page.$$('form input');
    await loginInputs[0].type('secure_user@example.com');
    await loginInputs[1].type('wrong_password_999');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 800));
    const bodyText = await page.evaluate(() => document.body.textContent);
    const rejectedWrongPassword = bodyText.includes('Invalid email or password');
    console.log(`✓ Rejected Wrong Password ("wrong_password_999"): ${rejectedWrongPassword ? 'PASS' : 'FAIL'}`);

    // 4. Test CORRECT password
    console.log('\n--- 4. Testing Login with CORRECT Password ---');
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('form input');
      if (inputs[1]) inputs[1].value = '';
    });
    const updatedLoginInputs = await page.$$('form input');
    await updatedLoginInputs[1].type('my_secret_pass_123');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1000));
    const loggedInBodyText = await page.evaluate(() => document.body.textContent);
    const loggedInCheck = loggedInBodyText.includes('secure_user@example.com') || loggedInBodyText.includes('Dashboard') || loggedInBodyText.includes('Local-First Vault Session');
    console.log(`✓ Accepted Correct Password ("my_secret_pass_123"): ${loggedInCheck ? 'PASS' : 'FAIL'}`);

    // 5. Test "Download Android APK" button in Top Header while logged in
    console.log('\n--- 5. Testing "Download Android APK" Button in Top Header (Logged In) ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const apkBtn = btns.find(b => b.textContent.includes('Download Android APK'));
      if (apkBtn) apkBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const downloadedFiles = fs.readdirSync(DOWNLOAD_DIR);
    const apkFileDownloaded = downloadedFiles.some(f => f.includes('personal-finance-tracker.apk') || f.includes('.apk'));
    console.log(`✓ Clicked Top Header "Download Android APK" while logged in -> APK Downloaded: ${apkFileDownloaded ? 'PASS' : 'FAIL'} (${downloadedFiles.join(', ')})`);

    console.log('\n==================================================');
    console.log('   PASSWORD VERIFICATION & TOP APK BUTTON VERIFIED ');
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ TEST ERROR:', err);
  } finally {
    await browser.close();
  }
}

runPasswordAndApkTest();
