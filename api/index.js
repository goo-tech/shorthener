// index.js atau api/index.js

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World! from Express on Vercel');
});

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export app untuk Vercel
module.exports = app;