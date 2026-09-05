#!/usr/bin/env node

/**
 * Script to start Expo web server for TestSprite testing
 * This ensures the server is running before tests execute
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 8081;
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // Check every second

/**
 * Check if server is running on the specified port
 */
function checkServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(port, maxWait = MAX_WAIT_TIME) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const isRunning = await checkServerRunning(port);
    if (isRunning) {
      console.log(`✅ Server is running on port ${port}`);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  return false;
}

/**
 * Start Expo web server
 */
function startServer() {
  console.log(`🚀 Starting Expo web server on port ${PORT}...`);
  
  const expoProcess = spawn('npx', ['expo', 'start', '--web', '--port', PORT.toString()], {
    stdio: 'inherit',
    shell: true
  });

  expoProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  expoProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Server process exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    expoProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping server...');
    expoProcess.kill('SIGTERM');
    process.exit(0);
  });

  return expoProcess;
}

/**
 * Main function
 */
async function main() {
  // Check if server is already running
  const isRunning = await checkServerRunning(PORT);
  
  if (isRunning) {
    console.log(`✅ Server is already running on port ${PORT}`);
    console.log(`🌐 Access your app at: http://localhost:${PORT}`);
    return;
  }

  // Start the server
  const serverProcess = startServer();

  // Wait for server to be ready
  console.log(`⏳ Waiting for server to start (max ${MAX_WAIT_TIME / 1000}s)...`);
  const serverReady = await waitForServer(PORT);

  if (!serverReady) {
    console.error(`❌ Server failed to start within ${MAX_WAIT_TIME / 1000} seconds`);
    serverProcess.kill();
    process.exit(1);
  }

  console.log(`\n✅ Server is ready!`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`\n📝 Keep this process running while executing tests.`);
  console.log(`   Press Ctrl+C to stop the server.\n`);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { startServer, checkServerRunning, waitForServer };
