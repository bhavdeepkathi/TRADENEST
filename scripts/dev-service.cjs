const { spawn } = require('node:child_process');
const path = require('node:path');

const port = process.argv[2];
if (!/^\d+$/.test(port || '')) {
  console.error('Usage: node scripts/dev-service.cjs <port>');
  process.exit(1);
}

const cli = path.resolve(process.cwd(), '../../../node_modules/tsx/dist/cli.mjs');
const child = spawn(process.execPath, [cli, 'watch', 'src/main.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
  console.error('Failed to start the service:', error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
