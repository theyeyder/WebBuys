import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/', (_, res) => res.json({ app: 'WebBuys API', status: 'OK' }));
app.use('/api/auth', authRoutes);

export default app;
