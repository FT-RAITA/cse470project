import mongoose from "mongoose";

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL?.trim() || process.env.database_url?.trim();
  if (!url) {
    const error = new Error(
      "MongoDB connection string is missing. Set DATABASE_URL or database_url in backend/.env."
    );
    error.code = "DATABASE_CONFIG_MISSING";
    throw error;
  }
  return url;
};

export const connectDB = async () => {
  try {
    const url = getDatabaseUrl();
    await mongoose.connect(url);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
