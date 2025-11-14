import express from 'express';
import cors from 'cors';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './shared/middleware/error-middleware.js';
import router from './router.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
