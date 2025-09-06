const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Newsletter Creator in development mode...\n');

// Start the React dev server
const reactProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Start the Express server
const serverProcess = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  reactProcess.kill('SIGINT');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  reactProcess.kill('SIGTERM');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

reactProcess.on('close', (code) => {
  console.log(`React dev server exited with code ${code}`);
});

serverProcess.on('close', (code) => {
  console.log(`Express server exited with code ${code}`);
});
