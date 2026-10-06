import express from 'express';
import deliveryRoutes from '../routes/deliveryRoutes.js';
import http from 'http';

const app = express();
app.use(express.json());
app.use('/api/delivery', deliveryRoutes);

// 404 handler matching server.js
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

async function testRoutes() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server listening on port ${port}`);

  const endpoints = [
    { url: `/api/delivery/check?pincode=560001`, expectedDesc: 'Query param format' },
    { url: `/api/delivery/check/560001`, expectedDesc: 'Path param format (Contract 1 in PROJECT.md)' },
  ];

  for (const ep of endpoints) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}${ep.url}`);
      const body = await resp.json();
      console.log(`Endpoint ${ep.url} (${ep.expectedDesc}): status ${resp.status}`);
      console.log('Response body:', body);
    } catch (e) {
      console.error(`Endpoint ${ep.url} failed:`, e);
    }
  }

  server.close();
  process.exit(0);
}

testRoutes();
