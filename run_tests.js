import { spawn } from 'child_process';

async function runAll() {
  console.log('Starting Vite preview server on http://127.0.0.1:3000...');
  const server = spawn('npx.cmd', ['vite', 'preview', '--port', '3000', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    shell: true
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('\n==================================================');
  console.log(' 1. RUNNING MOBILE UI & SMS AUTO-DETECTION TESTS ');
  console.log('==================================================\n');

  const testUi = spawn('node', ['test_sms_and_mobile_ui.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  testUi.on('close', (code1) => {
    console.log(`\nMobile UI & SMS Test Exit Code: ${code1}`);

    console.log('\n==================================================');
    console.log(' 2. RUNNING STRICT PASSWORD & APK HEADER TESTS   ');
    console.log('==================================================\n');

    const testPass = spawn('node', ['test_password_and_apk.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    testPass.on('close', (code2) => {
      console.log(`\nPassword & APK Test Exit Code: ${code2}`);

      console.log('\n==================================================');
      console.log(' 3. RUNNING BACKEND & UNIT QA SUITE              ');
      console.log('==================================================\n');

      const testQa = spawn('node', ['test_qa_suite.js'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true
      });

      testQa.on('close', (code3) => {
        console.log(`\nQA Suite Exit Code: ${code3}`);
        server.kill();
        process.exit(code1 || code2 || code3 || 0);
      });
    });
  });
}

runAll();
