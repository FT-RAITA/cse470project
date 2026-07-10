import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";


const app = express();
const PORT = 5001;

connectDB();
dotenv.config();
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// kKXXDAZnVHCm9HE5
//mongodb+srv://raitaluna_db_user:kKXXDAZnVHCm9HE5@cluster0.rkpnlbs.mongodb.net/?appName=Cluster0