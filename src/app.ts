import express from 'express';
import cors from 'cors';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './shared/middleware/error-middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'MTP Server is running' });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
