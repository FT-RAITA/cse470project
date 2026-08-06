import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  UserPlus,
  LogOut,
  HeartHandshake,
  CalendarDays,
  CalendarPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isCaregiver = user?.role === "caregiver" || user?.role === "admin";

  const links = [
    ...(isCaregiver
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
          { to: "/elders/add", label: "Add Elder", icon: UserPlus },
        ]
      : []),
    { to: "/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/appointments/book", label: "Book Visit", icon: CalendarPlus },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-paper-card">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-paper-card">
          <HeartHandshake size={18} strokeWidth={2} />
        </div>
        <span className="font-display text-lg font-semibold text-primary">
          Elder Ease
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-paper-card"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-5">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-semibold text-primary-dark">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {user?.name || "User"}
            </p>
            <p className="truncate text-xs capitalize text-ink-soft">
              {user?.role === "family_member"
                ? "Visitor"
                : user?.role || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-rose-soft hover:text-rose"
        >
          <LogOut size={17} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
