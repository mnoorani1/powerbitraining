const express = require("express");
const app = express();
const PORT = process.env.PORT || 3030;

// Serve static files (like HTML, CSS, and JS) from the 'public' directory
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});