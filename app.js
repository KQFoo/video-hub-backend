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

// Define allowed origins
const allowedOrigins = [
    'https://video-hub-frontend.onrender.com'
];

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Origin', 
        'X-Requested-With', 
        'Accept'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional headers middleware
app.use((req, res, next) => {
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.headers.origin || allowedOrigins[0]);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
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