const express = require('express');
const cors = require('cors');
const app = express();
const mainRouter = require("./routes/index");
require("./config/db"); // Running database
require("dotenv").config();
//123
// Hello World0
//123
// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", "./views");

app.use("/", mainRouter); // index.js

const PORT = process.env.PORT || 8080;
app.listen(PORT, (err) => {
    if (err) {
        console.err("Error in running server");
    }
    console.log(`Server is running on http://localhost:${PORT}`);
})