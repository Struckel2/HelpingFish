const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve game files
app.use(express.static(path.join(__dirname, 'public')));

// Serve image assets from root directory
app.use('/assets', express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🐟 Helping Fish is swimming on port ${PORT}!`);
});
