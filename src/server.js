import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino-http";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cors());

app.use(
  pino({
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
);

// GET /notes
app.get("/notes", (req, res) => {
  res.status(200).json({ message: "Retrieved all notes" });
});

// GET /notes/:noteId
app.get("/notes/:noteId", (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({ message: `Retrieved note with ID: ${noteId}` });
});

// GET /test-error
app.get("/test-error", () => {
  throw new Error("Simulated server error");
});

// 404 middleware (после всех routes)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error middleware (последний)
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
