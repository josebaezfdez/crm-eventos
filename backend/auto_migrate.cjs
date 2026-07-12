const { spawn } = require('child_process');

const child = spawn('npx.cmd', ['drizzle-kit', 'generate'], {
  cwd: 'c:/Users/Jose Baez - Vive Cod/Desktop/CRM Eventos/backend',
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

setTimeout(() => {
  child.stdin.write('\x1B[B');
  setTimeout(() => {
    child.stdin.write('\r\n');
    child.stdin.end();
  }, 1000);
}, 3000);

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
