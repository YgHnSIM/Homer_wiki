import fs from 'node:fs';
import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--no-sandbox',
  '--window-size=1280,900'
]);

let wsUrl = '';
for (let i = 0; i < 30; i++) {
  try {
    const resp = await fetch('http://127.0.0.1:9225/json/version');
    const data = await resp.json();
    wsUrl = data.webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!wsUrl) {
  console.error('Failed to connect to Chrome');
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 1;
const callbacks = new Map();

function send(method, params = {}) {
  return new Promise((resolve) => {
    const msgId = id++;
    callbacks.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && callbacks.has(msg.id)) {
    const cb = callbacks.get(msg.id);
    callbacks.delete(msg.id);
    cb(msg.result);
  }
};

await new Promise((r) => (ws.onopen = r));
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

function sendSession(method, params = {}) {
  return new Promise((resolve) => {
    const msgId = id++;
    callbacks.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
  });
}

await sendSession('Page.enable');
await sendSession('Runtime.enable');

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false
});

console.log('Navigating to http://localhost:3333/words/word-hector...');
await sendSession('Page.navigate', { url: 'http://localhost:3333/words/word-hector' });
await new Promise((r) => setTimeout(r, 3000));

const { result: heightResult } = await sendSession('Runtime.evaluate', {
  expression: 'document.documentElement.scrollHeight'
});
const totalHeight = heightResult.value;
console.log('Total document height:', totalHeight);

const step = 650;
let sliceIndex = 1;
for (let y = 0; y < totalHeight; y += step) {
  await sendSession('Runtime.evaluate', {
    expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`
  });
  await new Promise((r) => setTimeout(r, 400));

  const { data } = await sendSession('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });
  fs.writeFileSync(`screenshot-exact-slice-${sliceIndex}.png`, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot-exact-slice-${sliceIndex}.png at y=${y}`);
  sliceIndex++;
}

ws.close();
chrome.kill();
console.log('Inspection complete.');
process.exit(0);
