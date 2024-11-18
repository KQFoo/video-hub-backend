const express = require("express");
const app = express();
const dotenv = require('dotenv').config();

app.get("/", (req, res) => res.send("Hello, World!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        console.err("Error in running server");
    }
    console.log(`Server is running on http://localhost:${PORT}`);
})