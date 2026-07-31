import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", routes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

export default app;