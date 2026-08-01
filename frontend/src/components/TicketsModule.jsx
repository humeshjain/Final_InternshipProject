import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

export default function TicketsModule({
  db,
  setDb,
  addNotification,
  activeBusinessId
}) {
  const [ticketForm, setTicketForm] = useState({
    title: "",
    priority: "Medium",
    desc: ""
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const newT = {
      id: "t-" + Date.now(),
      tenant_id: activeBusinessId === "biz-1" ? "tenant-vishwa" : "tenant-bharat",
      business_id: activeBusinessId,
      created_by: "user-3",
      updated_by: "user-3",
      title: ticketForm.title,
      description: ticketForm.desc,
      priority: ticketForm.priority,
      status: "Open",
      assignedTo: "Amit Sharma (Support Engineer)",
      createdAt: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().slice(0, 5),
      slaHours: ticketForm.priority === "Critical" ? 1 : ticketForm.priority === "High" ? 6 : ticketForm.priority === "Medium" ? 12 : 24
    };

    setDb((prev) => ({
      ...prev,
      tickets: [newT, ...prev.tickets]
    }));

    addNotification(`Support Ticket #${newT.id.slice(-4)} created. Assignee notified.`, "success");
    setTicketForm({ title: "", priority: "Medium", desc: "" });
  };

  const activeTickets = db.tickets.filter((t) => t.business_id === activeBusinessId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#0F172A]">
      
      {/* Ticket list */}
      <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
            <HelpCircle className="text-[#5C52FB] w-4 h-4" />
            Internal Retail Operations SLA Support Tickets
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1">Log hardware failures or scanner calibration questions with real-time escalation timers</p>
        </div>

        <div className="divide-y divide-[#E2E8F0] space-y-4">
          {activeTickets.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8] text-xs">
              No outstanding tickets. All systems running at 100% capacity!
            </div>
          ) : (
            activeTickets.map((t) => (
              <div key={t.id} className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0F172A] text-xs">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      t.priority === "Critical" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                      t.priority === "High" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-slate-100 text-slate-600"
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === "Resolved" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-purple-50 text-[#5C52FB] border border-purple-200"
                  }`}>
                    {t.status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                
                <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <span>Assigned To: {t.assignedTo}</span>
                  <span>Logged: {t.createdAt} (SLA: {t.slaHours} hrs)</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log new ticket */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-xs border-b border-[#E2E8F0] pb-2">Log Internal Ticket</h3>
          
          <div className="space-y-1.5">
            <label className="label-elevate block">Ticket Title *</label>
            <input 
              type="text"
              required
              value={ticketForm.title}
              onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
              placeholder="e.g. Printer paper cutter jammed"
              className="input-elevate"
            />
          </div>

          <div className="space-y-1.5">
            <label className="label-elevate block">Priority SLA Level</label>
            <select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
              className="input-elevate font-semibold"
            >
              <option value="Low">Low (24 hrs resolution)</option>
              <option value="Medium">Medium (12 hrs resolution)</option>
              <option value="High">High (6 hrs resolution)</option>
              <option value="Critical">Critical (1 hr resolution)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label-elevate block">Issue Description *</label>
            <textarea 
              required
              value={ticketForm.desc}
              onChange={(e) => setTicketForm({...ticketForm, desc: e.target.value})}
              placeholder="Specify model numbers and terminal channels..."
              rows={4}
              className="input-elevate"
            />
          </div>

          <button 
            type="submit"
            className="btn-elevate-primary w-full text-xs font-extrabold py-2 flex items-center justify-center cursor-pointer"
          >
            Log Internal Issue
          </button>
        </form>
      </div>

    </div>
  );
}
