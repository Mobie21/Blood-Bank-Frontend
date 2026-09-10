import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<typeof mongoose> {
  const connection = await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`MongoDB connected: ${connection.connection.name}`);
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
