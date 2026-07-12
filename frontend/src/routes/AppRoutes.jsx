import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AddElder from "../pages/AddElder";
import ElderProfile from "../pages/ElderProfile";
import EditElder from "../pages/EditElder";
import CaregiverDashboard from "../pages/CaregiverDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<CaregiverDashboard />} />
      <Route path="/elders/add" element={<AddElder />} />
      <Route path="/elders/:id" element={<ElderProfile />} />
      <Route path="/elders/:id/edit" element={<EditElder />} />
    </Routes>
  );
}
