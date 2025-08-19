const { startScheduler } = require('../lib/scheduler');

console.log('🚀 Starting tweet scheduler...');
startScheduler();

console.log('✅ Tweet scheduler initialized successfully!');
console.log('📅 Tweets will be generated and posted every 2 hours');
console.log('🔄 Use the web dashboard to manage tweets manually');

process.on('SIGINT', () => {
  console.log('👋 Shutting down tweet scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down tweet scheduler...');
  process.exit(0);
});