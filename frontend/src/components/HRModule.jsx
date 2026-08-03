import React, { useState } from "react";
import { UserCheck, Upload, Download, UserPlus, Edit, X, Key, Shield } from "lucide-react";
import { authApi } from "../api/authApi";

export default function HRModule({
  db,
  setDb,
  sessionToken,
  addNotification,
  activeBusinessId,
  triggerImportExport
}) {
  const activeUsers = (db?.users || []).filter((u) => u.businessId === activeBusinessId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "Staff",
    phone: "",
    email: "",
    salary: 25000
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      name: "",
      username: "",
      password: "",
      role: "Staff",
      phone: "",
      email: "",
      salary: 25000
    });
    setShowPassword(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name || "",
      username: u.username || "",
      password: "",
      role: u.role || "Staff",
      phone: u.phone || "",
      email: u.email || "",
      salary: u.salary || 0
    });
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      if (addNotification) addNotification("Full Name, Username, and Access Password are required.", "error");
      return;
    }

    setLoading(true);
    try {
      let createdUser = null;
      if (sessionToken) {
        const res = await authApi.addEmployee(sessionToken, {
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role,
          phone: form.phone,
          email: form.email,
          salary: Number(form.salary) || 0
        });

        if (res.success) {
          createdUser = res.user;
        } else if (res.error) {
          if (addNotification) addNotification(res.error, "error");
          setLoading(false);
          return;
        }
      }

      if (!createdUser) {
        createdUser = {
          id: "user-" + Date.now(),
          username: form.username.trim(),
          name: form.name.trim(),
          role: form.role,
          businessId: activeBusinessId,
          phone: form.phone ? form.phone.trim() : "+91 98765 43210",
          email: form.email ? form.email.trim() : `${form.username}@${activeBusinessId}.com`,
          salary: Number(form.salary) || 0,
          attendanceRate: 100,
          incentiveEarned: 0
        };
      }

      if (setDb) {
        setDb(prev => ({
          ...prev,
          users: [...(prev.users || []).filter(u => u.username !== createdUser.username), {
            ...createdUser,
            attendanceRate: createdUser.attendanceRate || 100,
            incentiveEarned: createdUser.incentiveEarned || 0
          }]
        }));
      }

      if (addNotification) {
        addNotification(`Member ${createdUser.name} (@${createdUser.username}) added with role '${createdUser.role}'!`, "success");
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      if (addNotification) addNotification("Error adding workspace member.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    if (!editingUser || !form.name) return;

    setLoading(true);
    try {
      if (sessionToken) {
        await authApi.updateUser(sessionToken, editingUser.username, {
          name: form.name,
          role: form.role,
          phone: form.phone,
          email: form.email,
          salary: Number(form.salary) || 0,
          password: form.password ? form.password : undefined
        });
      }

      if (setDb) {
        setDb(prev => ({
          ...prev,
          users: (prev.users || []).map(u => {
            if (u.id === editingUser.id || u.username === editingUser.username) {
              return {
                ...u,
                name: form.name,
                role: form.role,
                phone: form.phone,
                email: form.email,
                salary: Number(form.salary) || 0
              };
            }
            return u;
          })
        }));
      }

      if (addNotification) {
        addNotification(`Member ${form.name} updated with role '${form.role}'!`, "success");
      }

      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
    } catch (err) {
      console.error(err);
      if (addNotification) addNotification("Error updating member details.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#0F172A]">
      
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
              <UserCheck className="text-[#5C52FB] w-4 h-4" />
              Employee Attendance & System Roster Directory
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">Manage workspace members, assign 4 core authentication roles (Owner, Admin, Staff, Finance), and configure credentials</p>
          </div>

          <div className="flex gap-2 flex-wrap self-start sm:self-center">
            <button
              type="button"
              onClick={openAddModal}
              className="bg-[#5C52FB] hover:bg-[#4C42E0] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Member</span>
            </button>

            {triggerImportExport && (
              <>
                <button
                  type="button"
                  onClick={() => triggerImportExport("employees")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Import Employee Directory spreadsheet"
                >
                  <Upload className="w-4 h-4 text-[#5C52FB]" />
                  <span>Import Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerImportExport("employees")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Export Employee Directory spreadsheet"
                >
                  <Download className="w-4 h-4 text-[#5C52FB]" />
                  <span>Export Staff</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeUsers.map((u) => (
            <div key={u.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between h-52 relative overflow-hidden group hover:border-[#5C52FB]/40 transition-all shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border ${
                    u.role === "Owner" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    u.role === "Admin" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    u.role === "Finance" || u.role === "Accountant" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {u.role === "Accountant" ? "Finance" : u.role}
                  </span>
                  
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#5C52FB] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
                    title="Edit Member Details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="font-extrabold text-[#0F172A] text-sm mt-3">{u.name}</h4>
                <p className="text-xs text-slate-500 font-medium">@{u.username} · {u.phone || "No phone"}</p>
              </div>

              <div className="space-y-2 mt-3 pt-2 border-t border-[#E2E8F0]/60">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Salary: ₹{(u.salary || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[#5C52FB]">Incentive: ₹{u.incentiveEarned || 0}</span>
                </div>
                
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[#94A3B8]">Attendance:</span>
                  <span className="text-[#0F172A]">{u.attendanceRate || 100}% Rate</span>
                </div>
              </div>

              {/* Log simulated attendance */}
              <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    if (addNotification) addNotification(`Attendance marked present for ${u.name} today.`, "success");
                  }}
                  className="text-[9px] bg-[#5C52FB]/10 text-[#5C52FB] hover:bg-[#5C52FB] hover:text-white font-extrabold px-2 py-1 rounded border border-[#5C52FB]/20 transition-all cursor-pointer"
                >
                  ✓ Mark Present
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5C52FB]/10 rounded-xl text-[#5C52FB]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A]">Add Workspace Member</h3>
                  <p className="text-[11px] text-[#64748B]">Set member credentials with one of 4 system authentication roles</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A] block">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Subhash Chandra"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Username *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. subhash_c"
                    value={form.username}
                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">System Role *</label>
                  <select 
                    value={form.role}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#5C52FB] focus:outline-none focus:border-[#5C52FB]"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A] block">Login Password / PIN *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-[#5C52FB] font-bold hover:underline cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-semibold pr-10 focus:outline-none focus:border-[#5C52FB]"
                  />
                  <div className="absolute right-3 top-2.5 text-[#94A3B8]">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B]">Member can log in directly using this password on the Portal</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Monthly Salary (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 25000"
                    value={form.salary}
                    onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#5C52FB] hover:bg-[#4C42E0] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-200">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A]">Edit Member Details</h3>
                  <p className="text-[11px] text-[#64748B]">Update profile name, role permissions, or reset access key</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A] block">Full Name *</label>
                <input 
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Username (Login Key)</label>
                  <input 
                    type="text"
                    disabled
                    value={`@${form.username}`}
                    className="w-full px-3 py-2 bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">System Role *</label>
                  <select 
                    value={form.role === "Accountant" ? "Finance" : form.role}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#5C52FB] focus:outline-none focus:border-[#5C52FB]"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A] block">Reset Password (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-[#5C52FB] font-bold hover:underline cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono font-semibold pr-10 focus:outline-none focus:border-[#5C52FB]"
                  />
                  <div className="absolute right-3 top-2.5 text-[#94A3B8]">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Phone Number</label>
                  <input 
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A] block">Monthly Salary (₹)</label>
                  <input 
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5C52FB]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="px-4 py-2 border border-[#E2E8F0] text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#5C52FB] hover:bg-[#4C42E0] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? "Updating..." : "Update Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
