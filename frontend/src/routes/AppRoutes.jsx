import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Landing from "../pages/Landing";
import AddElder from "../pages/AddElder";
import ElderProfile from "../pages/ElderProfile";
import EditElder from "../pages/EditElder";
import CaregiverDashboard from "../pages/CaregiverDashboard";
import Appointments from "../pages/Appointments";
import BookAppointment from "../pages/BookAppointment";
import ElderRecordsPortal from "../pages/ElderRecordsPortal";
import MedicationDashboard from "../pages/MedicationDashboard";
import FamilyDashboard from "../pages/FamilyDashboard";
import FamilyElderView from "../pages/FamilyElderView";
import ActivityDashboard from "../pages/ActivityDashboard";
import DoctorAppointments from "../pages/DoctorAppointments";
import Tasks from "../pages/Tasks";
import CaregiverSchedule from "../pages/CaregiverSchedule";
import CaregiverSwapRequestNotifier from "../components/CaregiverSwapRequestNotifier";
import ChatPage from "../pages/ChatPage";
import CaregiverPerformanceReport from "../pages/CaregiverPerformanceReport";
import DailyRoutine from "../pages/dailyRoutine";
import WellnessProgress from "../pages/WellnessProgress";

export default function AppRoutes() {
  return (
    <>
      <CaregiverSwapRequestNotifier />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<CaregiverDashboard />} />
        <Route path="/elders/add" element={<AddElder />} />
        <Route path="/elders/:id" element={<ElderProfile />} />
        <Route path="/elders/:id/edit" element={<EditElder />} />
        <Route path="/elders/:id/records" element={<ElderRecordsPortal />} />
        <Route path="/elders/:id/medications" element={<MedicationDashboard />} />
        <Route path="/elders/:id/routine" element={<DailyRoutine />} />
        <Route path="/elders/:id/wellness-progress" element={<WellnessProgress />} />
        <Route path="/activities" element={<ActivityDashboard />} />
        <Route path="/doctor-appointments" element={<DoctorAppointments />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/schedule" element={<CaregiverSchedule />} />
        <Route path="/caregiver-performance" element={<CaregiverPerformanceReport />} />
        <Route path="/elders/:id/chat" element={<ChatPage />} />

        <Route path="/family/dashboard" element={<FamilyDashboard />} />
        <Route path="/family/elders/:id" element={<FamilyElderView />} />
        <Route path="/family/elders/:id/chat" element={<ChatPage />} />
      
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
      </Routes>
    </>
  );
}
