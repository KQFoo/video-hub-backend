const express = require("express");
const app = express();
const mainRouter = require("./routes/index");
require("./config/db"); // Running database
require("dotenv").config();

app.use(express.json());

app.use("/", mainRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, (err) => {
    if (err) {
        console.err("Error in running server");
    }
    console.log(`Server is running on http://localhost:${PORT}`);
})