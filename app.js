const express = require("express");
const app = express();
require("./config/db"); // Running database
require('dotenv').config();

app.get("/", (req, res) => res.send("Hello, World!"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, (err) => {
    if (err) {
        console.err("Error in running server");
    }
    console.log(`Server is running on http://localhost:${PORT}`);
})