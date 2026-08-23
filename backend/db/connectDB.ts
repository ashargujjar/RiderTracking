import mongoose from "mongoose";

import { seedAdmin } from "./seedAdmin";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/catkin";

  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (error) => console.error("MongoDB connection error:", error));

  await mongoose.connect(uri);
  await seedAdmin();
}
