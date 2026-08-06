import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import elderRoutes from "./routes/elderRoutes.js";
import mealScheduleRoutes from "./routes/mealScheduleRoutes.js";
import moodCheckinRoutes from "./routes/moodCheckinRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import elderRecordsRoutes from "./routes/elderRecordsRoutes.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
dotenv.config();
console.log("Loaded database_url:", process.env.database_url);
const app = express();
const PORT = 5001;
 
connectDB();
 
// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
 
// Routes
app.use("/api/auth", authRoutes);
app.use("/api", elderRoutes);
app.use("/api", moodCheckinRoutes);
app.use("/api", mealScheduleRoutes);
app.use("/api", appointmentRoutes);
app.use("/api", elderRecordsRoutes);
 
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
 


// kKXXDAZnVHCm9HE5
//mongodb+srv://raitaluna_db_user:kKXXDAZnVHCm9HE5@cluster0.rkpnlbs.mongodb.net/?appName=Cluster0