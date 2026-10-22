const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const NIM_API_KEY = process.env.NIM_API_KEY;
const NIM_BASE = 'https://integrate.api.nvidia.com/v1';

app.get('/', (req, res) => {
  res.json({ status: 'NVIDIA NIM Proxy is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/v1/models', async (req, res) => {
  try {
    const response = await axios.get(`${NIM_BASE}/models`, {
      headers: { Authorization: `Bearer ${NIM_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    if (!NIM_API_KEY) {
      return res.status(500).json({ error: 'NIM_API_KEY is missing' });
    }

    const response = await axios.post(
      `${NIM_BASE}/chat/completions`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${NIM_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        responseType: req.body.stream ? 'stream' : 'json',
        timeout: 120000
      }
    );

    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
    } else {
      res.json(response.data);
    }
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
