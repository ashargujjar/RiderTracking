import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./db/connectDB";
import adminRoutes from "./routes/admin.routes";
import clientRoutes from "./routes/client.routes";
import complaintRoutes from "./routes/complaint.routes";
import coordinatesRoutes from "./routes/coordinates.routes";
import riderRoutes from "./routes/rider.routes";
import statsRoutes from "./routes/stats.routes";

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/admin", adminRoutes);
app.use("/clients", clientRoutes);
app.use("/complaints", complaintRoutes);
app.use("/coordinates", coordinatesRoutes);
app.use("/riders", riderRoutes);
app.use("/stats", statsRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
