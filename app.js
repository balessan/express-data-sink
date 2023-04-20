const bodyParser = require("body-parser");
const express = require("express");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const ip = process.env.IP || "127.0.0.1";

// Middleware to parse request body as JSON or binary
app.use((req, res, next) => {
  if (req.headers["content-type"] === "application/octet-stream") {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      req.body = JSON.parse(buffer.toString());
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

// Middleware to validate request body as JSON
app.use((req, res, next) => {
  if (typeof req.body !== "object" || req.body === null) {
    res.status(400).send("Invalid request body. Must be a JSON object");
  } else {
    next();
  }
});

// Middleware to parse request body as JSON
app.use(bodyParser.json());

// POST endpoint to write data to file
app.post("/sink/:filename", (req, res) => {
  const content = req.body;
  const fileName = req.params.filename;
  const filePath = `./${fileName}`;
  if (!fileName) {
    res.status(400).send("Filename is required");
  } else {
    const jsonString = JSON.stringify(content);
    fs.writeFile(filePath, jsonString, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error writing to file");
      } else {
        res.send({ message: "success" }).json();
      }
    });
  }
});

// GET endpoint to read data from file
app.get("/sink/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = `./${fileName}`;
  if (!fileName) {
    res.status(400).send("Filename is required");
  } else {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading file");
      } else {
        res.set({
          "Content-Type": "application/json",
          "Content-Disposition": "inline",
        });
        res.send(data);
      }
    });
  }
});

// GET endpoint to read data from file and return HTML with solid-display web component
app.get("/directory/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = `./${fileName}`;
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Directory of users</title>
            <!-- Load styling framework used by orbit -->
            <link
            rel="stylesheet"
            href="https://cdn.startinblox.com/orbit-styling-framework/index.css"
            />
            <script src="https://cdn.skypack.dev/@startinblox/core"></script>
            <!-- Load core components -->
            <script
            type="module"
            src="https://cdn.skypack.dev/@startinblox/router"
            ></script>
            <script
            type="module"
            src="https://cdn.skypack.dev/@startinblox/component-directory@beta"
            ></script>
        </head>
        <body>
            <solid-directory 
                data-src="https://express.datasink.startinblox.com/sink/${fileName}"
                show-incomplete="true"
            ></solid-directory>
        </body>
        </html>
    `;
  res.send(html);
});

// Default catch-all route to present API information
app.use((req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, ip, () => {
  console.log(`API running at https://${ip}:${port}`);
});
