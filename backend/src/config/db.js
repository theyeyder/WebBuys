import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado: WebBuys');
  } catch (error) {
    console.error('Error MongoDB:', error.message);
    process.exit(1);
  }
}
