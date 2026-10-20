'use client';

import React, { useState, useEffect } from 'react';
import { User, apiRequest } from '@/lib/api';
import { Users, UserPlus, Shield, Phone, Mail, CheckCircle2, XCircle, Settings, Check } from 'lucide-react';

export default function TelecallersView({ onUsersUpdated }: { onUsersUpdated: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newPhone, setNewPhone] = useState('+9715');
  const [newRole, setNewRole] = useState<'telecaller' | 'admin'>('telecaller');
  const [newTabs, setNewTabs] = useState<string[]>(['leads', 'followups', 'call_history']);
  const [addLoading, setAddLoading] = useState(false);

  // Permissions Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editTabs, setEditTabs] = useState<string[]>([]);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editLoading, setEditLoading] = useState(false);

  const availableTabs = [
    { id: 'dashboard', label: 'Dashboard & Metrics' },
    { id: 'leads', label: 'Assigned Leads' },
    { id: 'followups', label: "Today's Follow-ups" },
    { id: 'call_history', label: 'Call History Logs' },
    { id: 'import', label: 'CSV Import (Admin)' },
    { id: 'integrations', label: 'Google Sheets & Webhooks (Admin)' },
    { id: 'telecallers', label: 'Manage Team & Permissions (Admin)' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          role: newRole,
          allowed_tabs: newTabs,
        }),
      });

      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('+9715');
      fetchUsers();
      onUsersUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditTabs(user.allowed_tabs || ['leads', 'followups', 'call_history']);
    setEditActive(user.is_active ?? true);
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setEditLoading(true);

    try {
      await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          allowed_tabs: editTabs,
          is_active: editActive,
        }),
      });

      setEditingUser(null);
      fetchUsers();
      onUsersUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleTab = (tabId: string, currentList: string[], setter: (v: string[]) => void) => {
    if (currentList.includes(tabId)) {
      setter(currentList.filter(t => t !== tabId));
    } else {
      setter([...currentList, tabId]);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-800" />
            Telecallers &amp; Multi-Role Permissions
          </h2>
          <p className="text-[11px] text-slate-500">
            Manage your telecalling sales team, customize allowed tabs, and toggle account statuses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add New Telecaller</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-2.5 hover:border-amber-300 transition">
            
            {/* User Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{user.name}</h3>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    user.role === 'super_admin' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {user.role === 'super_admin' ? 'Super Admin' : user.role}
                  </span>
                </div>
              </div>

              <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={user.is_active ? 'Active' : 'Inactive'} />
            </div>

            {/* Contact details */}
            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate text-[11px]">{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="text-[11px]">{user.phone || 'No phone'}</span>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Assigned Leads</span>
                <span className="font-black text-amber-900 text-sm">{user.leads_count ?? 0}</span>
              </div>
              <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Calls Logged</span>
                <span className="font-black text-emerald-900 text-sm">{user.call_logs_count ?? 0}</span>
              </div>
            </div>

            {/* Allowed Tabs Badges */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Allowed Tabs ({user.allowed_tabs?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1">
                {(user.allowed_tabs || ['leads', 'followups', 'call_history']).map((tab) => (
                  <span key={tab} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => handleOpenEdit(user)}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                Edit Tab Permissions
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add Telecaller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Team Member</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Khan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@goldenbloom.ae"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="telecaller">Telecaller (Sales)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Tab Permissions for this user */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Allowed Tabs Access</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {availableTabs.map((tab) => (
                    <label key={tab.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={newTabs.includes(tab.id)}
                        onChange={() => toggleTab(tab.id, newTabs, setNewTabs)}
                      />
                      <span>{tab.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 font-bold bg-amber-800 text-white rounded-xl hover:bg-amber-900"
                >
                  {addLoading ? 'Creating...' : 'Create Telecaller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Customize Tabs &amp; Access: {editingUser.name}
            </h3>
            <p className="text-xs text-slate-500">
              Configure which tabs and permissions are visible to this telecaller.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Account Active Status:</span>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    editActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {editActive ? 'ACTIVE' : 'DEACTIVATED'}
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Visible Tabs:</label>
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {availableTabs.map((tab) => (
                    <label key={tab.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={editTabs.includes(tab.id)}
                        onChange={() => toggleTab(tab.id, editTabs, setEditTabs)}
                      />
                      <span>{tab.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={editLoading}
                  className="px-5 py-2 font-bold bg-amber-800 text-white rounded-xl hover:bg-amber-900"
                >
                  {editLoading ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
