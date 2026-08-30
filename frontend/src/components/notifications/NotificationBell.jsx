import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCheck, Clock3, Pill, Stethoscope, Users, ListChecks } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const icons = { medication:Pill, doctor_appointment:Stethoscope, visitor:Users, emergency:AlertTriangle, caregiver_task:ListChecks };

export default function NotificationBell() {
  const [open,setOpen]=useState(false);
  const navigate=useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead }=useNotifications();

  const openNotification=async(n)=>{
    if(!n.isRead) await markRead(n._id);
    setOpen(false);
    if(n.actionUrl) navigate(n.actionUrl);
  };

  return <div className="relative">
    <button type="button" onClick={()=>setOpen(v=>!v)} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper hover:text-ink" aria-label="Notifications">
      <Bell size={18}/>
      {unreadCount>0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount>99?"99+":unreadCount}</span>}
    </button>
    {open && <div className="absolute left-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-paper-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div><p className="text-sm font-semibold text-ink">Care alerts</p><p className="text-xs text-ink-soft">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p></div>
        {unreadCount>0 && <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-primary"><CheckCheck size={14}/>Read all</button>}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length===0 ? <p className="p-5 text-center text-sm text-ink-soft">Loading alerts...</p> : notifications.length===0 ? <p className="p-5 text-center text-sm text-ink-soft">No notifications yet.</p> : notifications.map(n=>{
          const Icon=icons[n.type]||Bell;
          return <button key={n._id} onClick={()=>openNotification(n)} className={`w-full border-b border-border px-4 py-3 text-left hover:bg-paper ${!n.isRead?"bg-primary/5":""}`}>
            <div className="flex gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.severity==="critical"?"bg-red-100 text-red-600":"bg-primary/10 text-primary"}`}><Icon size={15}/></div>
            <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-ink">{n.title||"Notification"}</p>{!n.isRead&&<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"/>}</div><p className="mt-1 text-xs leading-5 text-ink-soft">{n.message}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-ink-soft"><Clock3 size={10}/>{n.createdAt?new Date(n.createdAt).toLocaleString():""}</p></div></div>
          </button>})}
      </div>
    </div>}
  </div>;
}
