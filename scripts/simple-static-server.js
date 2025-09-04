#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const root = path.resolve(__dirname, "..", "public");

function serveFile(res, filePath, contentType = "text/html") {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(root, urlPath);

  // If requesting a file with extension, serve as-is
  if (path.extname(filePath)) {
    const ext = path.extname(filePath).slice(1);
    const type =
      ext === "js"
        ? "application/javascript"
        : ext === "css"
          ? "text/css"
          : "text/html";
    return serveFile(res, filePath, type);
  }

  // Otherwise serve index.html for any route
  return serveFile(res, path.join(root, "index.html"));
});

server.listen(port, () => {
  console.log(`[static] Serving ${root} at http://localhost:${port}`);
});
