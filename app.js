const bodyParser = require("body-parser");
const express = require("express");
const fs = require("fs");
const app = express();

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
app.post("/", (req, res) => {
  const content = req.body;
  const fileName = req.query.filename;
  if (!fileName) {
    res.status(400).send("Filename is required");
  } else {
    const jsonString = JSON.stringify(content);
    fs.writeFile(fileName, jsonString, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error writing to file");
      } else {
        res.send("Successfully wrote to file");
      }
    });
  }
});

// GET endpoint to read data from file
app.get("/", (req, res) => {
  const fileName = req.query.filename;
  if (!fileName) {
    res.status(400).send("Filename is required");
  } else {
    fs.readFile(fileName, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading file");
      } else {
        res.set("Content-Type", "application/json+ld");
        res.send(data);
      }
    });
  }
});

app.listen(3000, () => {
  console.log("API running on port 3000");
});
