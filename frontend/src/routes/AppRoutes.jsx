import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AddElder from "../pages/AddElder";
import ElderProfile from "../pages/ElderProfile";
import EditElder from "../pages/EditElder";
import CaregiverDashboard from "../pages/CaregiverDashboard";
import Appointments from "../pages/Appointments";
import BookAppointment from "../pages/BookAppointment";
import ElderRecordsPortal from "../pages/ElderRecordsPortal";
import FamilyDashboard from "../pages/FamilyDashboard";
import FamilyElderView from "../pages/FamilyElderView";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Caregiver */}
      <Route path="/dashboard" element={<CaregiverDashboard />} />
      <Route path="/elders/add" element={<AddElder />} />
      <Route path="/elders/:id" element={<ElderProfile />} />
      <Route path="/elders/:id/edit" element={<EditElder />} />
      <Route path="/elders/:id/records" element={<ElderRecordsPortal />} />

      {/* Family member */}
      <Route path="/family/dashboard" element={<FamilyDashboard />} />
      <Route path="/family/elders/:id" element={<FamilyElderView />} />

      {/* Shared */}
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/appointments/book" element={<BookAppointment />} />
    </Routes>
  );
}
