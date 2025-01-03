require("dotenv").config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const mainRouter = require("./routes/index");
require("./config/db"); // Running database
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const cors = require('cors');

app.use(cors({
    origin: '*',
  }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Add Content Security Policy headers
    res.header("Content-Security-Policy", 
        "default-src 'self' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://video-hub-backend.onrender.com; " +
        "style-src 'self' 'unsafe-inline' https://video-hub-backend.onrender.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://video-hub-backend.onrender.com; " +
        "frame-src 'self' https:; " +
        "font-src 'self' https:;"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
});

// Parse JSON bodies
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", "./views");

// Make io accessible to our router
app.set('io', io);

app.use("/", mainRouter); // index.js

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('join-playlist', (playlistId) => {
        socket.join(`playlist-${playlistId}`);
    })

    socket.on('disconnet', () => {
        console.log('Client disconnected');
    })
})

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, (err) => {
    if (err) {
        console.error("\nError in running server");
    }
    console.log(`\nServer is running on http://localhost:${PORT}`);
});