import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
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
import taskRoutes from "./routes/taskRoutes.js";
import caregiverScheduleRoutes from "./routes/caregiverScheduleRoutes.js";
import caregiverSwapRequestRoutes from "./routes/caregiverSwapRequestRoutes.js";
import { startCaregiverScheduleScheduler } from "./services/caregiverScheduleService.js";
import messageRoutes from "./routes/messageRoutes.js";
import { connectDB } from "./config/db.js";
import {Server} from "socket.io";
import {initializeSocket} from "./socket/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env regardless of whether the server is started from
// the project root, the backend folder, VS Code, or another working directory.
// Then also load the current-working-directory .env as a backwards-compatible
// fallback. Existing variables are not overwritten.
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });
dotenv.config({ quiet: true });

const app = express();
const server = http.createServer(app);
const PORT = 5001;

await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);


app.use("/api", elderRoutes);
app.use("/api", mealScheduleRoutes);
app.use("/api", moodCheckinRoutes);
app.use("/api", elderRecordsRoutes);
app.use("/api", medicationManagementRoutes);
app.use("/api", activityRoutes);
app.use("/api", taskRoutes);
app.use("/api/caregiver-schedule", caregiverScheduleRoutes);
app.use("/api/caregiver-swap-requests", caregiverSwapRequestRoutes);
app.use("/api", doctorAppointmentRoutes);


app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  }
});

app.set("io", io);

initializeSocket(io);
startCaregiverScheduleScheduler();

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
