import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://raitaluna_db_user:kKXXDAZnVHCm9HE5@ac-qxupy4v-shard-00-00.rkpnlbs.mongodb.net:27017,ac-qxupy4v-shard-00-01.rkpnlbs.mongodb.net:27017,ac-qxupy4v-shard-00-02.rkpnlbs.mongodb.net:27017/?ssl=true&replicaSet=atlas-6wv26c-shard-0&authSource=admin&appName=Cluster0")
    console.log("MongoDB connected successfully")
}
    catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }};