import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import elderRoutes from "./routes/elderRoutes.js";
import mealScheduleRoutes from "./routes/mealScheduleRoutes.js";
import moodCheckinRoutes from "./routes/moodCheckinRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = 5001;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", elderRoutes);
app.use("/api", mealScheduleRoutes);
app.use("/api", moodCheckinRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// kKXXDAZnVHCm9HE5
//mongodb+srv://raitaluna_db_user:kKXXDAZnVHCm9HE5@cluster0.rkpnlbs.mongodb.net/?appName=Cluster0