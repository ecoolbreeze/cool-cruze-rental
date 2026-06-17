console.log('Booting...');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('<h1>Cool Cruze</h1><p>If you see this, Express works.</p>'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('Listening on port', PORT);
});
