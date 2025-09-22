import { spawn } from 'child_process';
import path from 'path';

console.log('🧪 Running CLMS Test Suite...\n');

const tests = [
  'test-db.js',
  'test-user-model.js',
  'test-landplot-model.js',
  'test-transaction-model.js',
  'test-auth-service.js',
  'test-auth-middleware-simple.js',
  'test-land-service.js',
  'test-land-endpoints.js',
  'test-auth-endpoints.js'
];

let currentTest = 0;
let passedTests = 0;
let failedTests = 0;

function runNextTest() {
  if (currentTest >= tests.length) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test Suite Complete!');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Total: ${tests.length}`);
    console.log('='.repeat(60));
    process.exit(failedTests > 0 ? 1 : 0);
    return;
  }

  const testFile = tests[currentTest];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Running Test ${currentTest + 1}/${tests.length}: ${testFile}`);
  console.log('='.repeat(60));

  const testProcess = spawn('node', [path.join('tests', testFile)], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ ${testFile} - PASSED`);
      passedTests++;
    } else {
      console.log(`❌ ${testFile} - FAILED (exit code: ${code})`);
      failedTests++;
    }
    
    currentTest++;
    setTimeout(runNextTest, 1000); // Small delay between tests
  });

  testProcess.on('error', (error) => {
    console.error(`❌ Error running ${testFile}:`, error.message);
    failedTests++;
    currentTest++;
    setTimeout(runNextTest, 1000);
  });
}

// Start running tests
runNextTest();