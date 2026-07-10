import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedUsuarios } from './seed/usuarios.seed.js';

const PORT = process.env.PORT || 5000;
await connectDB();
await seedUsuarios();
app.listen(PORT, () => console.log(`WebBuys API en http://localhost:${PORT}`));
