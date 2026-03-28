import mongoose from "mongoose";

let activeConnectionAttempt: Promise<boolean> | null = null;

/**
 * Connects Mongoose to the configured MongoDB instance.
 */
export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MONGO_URI is not set; starting without database connectivity");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (activeConnectionAttempt) {
    return activeConnectionAttempt;
  }

  activeConnectionAttempt = mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
      return true;
    })
    .catch((error) => {
      console.error("DB connection failed", error);
      return false;
    })
    .finally(() => {
      activeConnectionAttempt = null;
    });

  return activeConnectionAttempt;
};

/**
 * Reports whether Mongoose currently has an active database connection.
 */
export const isDatabaseReady = (): boolean => mongoose.connection.readyState === 1;
