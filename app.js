const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const mainRouter = require("./routes/index");
require("./config/db"); // Running database
require("dotenv").config();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Enable CORS
app.use(cors());

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
        console.error("Error in running server");
    }
    console.log(`Server is running on http://localhost:${PORT}`);
});