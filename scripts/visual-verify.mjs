import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = 3333;
const PUBLIC_DIR = path.resolve(".quartz/public");

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath.endsWith("/")) reqPath += "index.html";
  let filePath = path.join(PUBLIC_DIR, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
    filePath += ".html";
  } else if (fs.existsSync(path.join(filePath, "index.html"))) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-translate",
    "--hide-scrollbars",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-sandbox",
    "--window-size=375,812"
  ]);

  let wsUrl = "";
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch("http://127.0.0.1:9222/json/version");
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome remote debugging");
    chrome.kill();
    server.close();
    process.exit(1);
  }

  console.log("Connected to Chrome via CDP:", wsUrl);

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

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });
  }

  await sendSession("Page.enable");
  await sendSession("DOM.enable");
  await sendSession("CSS.enable");
  // 1. Mobile Screenshot (Home)
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log("Navigating to http://localhost:3333/...");
  await sendSession("Page.navigate", { url: `http://localhost:${PORT}/` });
  await new Promise((r) => setTimeout(r, 2000));

  const mobileMetrics = await sendSession("Page.getLayoutMetrics");
  const mobileHeight = Math.ceil(mobileMetrics.contentSize.height);

  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: mobileHeight,
    deviceScaleFactor: 2,
    mobile: true
  });

  const { data: mobileData } = await sendSession("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true
  });
  fs.writeFileSync("screenshot-home-mobile.png", Buffer.from(mobileData, "base64"));
  console.log("Screenshot saved to screenshot-home-mobile.png (size:", mobileHeight, "px)");

  // 2. Desktop Screenshot (Home)
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  await sendSession("Page.navigate", { url: `http://localhost:${PORT}/` });
  await new Promise((r) => setTimeout(r, 2000));

  const desktopMetrics = await sendSession("Page.getLayoutMetrics");
  const desktopHeight = Math.ceil(desktopMetrics.contentSize.height);

  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: desktopHeight,
    deviceScaleFactor: 2,
    mobile: false
  });

  const { data: desktopData } = await sendSession("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true
  });
  fs.writeFileSync("screenshot-home-desktop.png", Buffer.from(desktopData, "base64"));
  console.log("Screenshot saved to screenshot-home-desktop.png (size:", desktopHeight, "px)");

  // 3. Desktop Screenshot (Epic Cycle)
  console.log("Navigating to http://localhost:3333/wiki/concepts/concept-epic-cycle...");
  await sendSession("Page.navigate", { url: `http://localhost:${PORT}/wiki/concepts/concept-epic-cycle` });
  await new Promise((r) => setTimeout(r, 2500));

  const epicMetrics = await sendSession("Page.getLayoutMetrics");
  const epicHeight = Math.ceil(epicMetrics.contentSize.height);

  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: epicHeight,
    deviceScaleFactor: 2,
    mobile: false
  });

  const { data: epicData } = await sendSession("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true
  });
  fs.writeFileSync("screenshot-epic-cycle-desktop.png", Buffer.from(epicData, "base64"));
  console.log("Screenshot saved to screenshot-epic-cycle-desktop.png (size:", epicHeight, "px)");

  // 4. Desktop Screenshot (Overview)
  console.log("Navigating to http://localhost:3333/wiki/overview...");
  await sendSession("Page.navigate", { url: `http://localhost:${PORT}/wiki/overview` });
  await new Promise((r) => setTimeout(r, 2500));

  const overviewMetrics = await sendSession("Page.getLayoutMetrics");
  const overviewHeight = Math.ceil(overviewMetrics.contentSize.height);

  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: overviewHeight,
    deviceScaleFactor: 2,
    mobile: false
  });

  const { data: overviewData } = await sendSession("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true
  });
  fs.writeFileSync("screenshot-overview-desktop.png", Buffer.from(overviewData, "base64"));
  console.log("Screenshot saved to screenshot-overview-desktop.png (size:", overviewHeight, "px)");

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});

