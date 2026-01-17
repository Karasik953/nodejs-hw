import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectMongoDB } from './db/connectMongoDB.js';
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./middleware/logger.js";
import noteRoutes from './routes/notesRoutes.js';


const app = express();
app.use(express.json({
  type: ['application/json', 'application/vnd.api+json'],
  limit: '100kb'
}));

const PORT = process.env.PORT ?? 3000;
app.use(logger);
app.use(express.json());
app.use(cors());



app.use(noteRoutes);


// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Error — якщо під час запиту виникла помилка
app.use(errorHandler);

await connectMongoDB();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
