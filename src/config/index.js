require('dotenv').config();
const express = require('express');
const messagesRoutes = require('./routes/messages.routes');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

// Health check route
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/messages', messagesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});