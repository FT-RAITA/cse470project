import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import elderRoutes from "./routes/elderRoutes.js";
import mealScheduleRoutes from "./routes/mealScheduleRoutes.js";
import moodCheckinRoutes from "./routes/moodCheckinRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import elderRecordsRoutes from "./routes/elderRecordsRoutes.js";
import medicationManagementRoutes from "./routes/medicationManagementRoutes.js";
import doctorAppointmentRoutes from "./routes/doctorAppointmentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
app.use("/api", mealScheduleRoutes);
app.use("/api", moodCheckinRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", elderRecordsRoutes);
app.use("/api", medicationManagementRoutes);
app.use("/api", activityRoutes);
app.use("/api", doctorAppointmentRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
