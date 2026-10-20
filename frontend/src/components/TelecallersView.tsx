'use client';

import React, { useState, useEffect } from 'react';
import { User, apiRequest } from '@/lib/api';
import { 
  Users, UserPlus, Shield, Phone, Mail, CheckCircle2, XCircle, 
  Settings, Check, Trash2, Pencil, AlertTriangle, ArrowRight, UserCheck, Lock
} from 'lucide-react';

interface TelecallersViewProps {
  currentUser?: User | null;
  onUsersUpdated: () => void;
}

export default function TelecallersView({ currentUser, onUsersUpdated }: TelecallersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('+9715');
  const [newRole, setNewRole] = useState<'telecaller' | 'admin' | 'super_admin'>('telecaller');
  const [newTabs, setNewTabs] = useState<string[]>(['leads', 'followups', 'call_history']);
  const [addLoading, setAddLoading] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'telecaller' | 'admin' | 'super_admin'>('telecaller');
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editTabs, setEditTabs] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Delete User Modal State (Smart Lead Reassignment)
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteReassignChoice, setDeleteReassignChoice] = useState<'keep_name' | 'triage' | 'reassign'>('keep_name');
  const [deleteReassignTo, setDeleteReassignTo] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const availableTabs = [
    { id: 'dashboard', label: 'Dashboard & Metrics' },
    { id: 'leads', label: 'Assigned Leads' },
    { id: 'followups', label: "Today's Follow-ups" },
    { id: 'call_history', label: 'Call History Logs' },
    { id: 'import', label: 'CSV Import (Admin)' },
    { id: 'integrations', label: 'Google Sheets Studio (Admin)' },
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
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setAddLoading(true);

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          phone: newPhone.trim(),
          role: newRole,
          allowed_tabs: newTabs,
        }),
      });

      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('+9715');
      setNewRole('telecaller');
      setNewTabs(['leads', 'followups', 'call_history']);
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
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditActive(user.is_active ?? true);
    setEditTabs(user.allowed_tabs || (user.role === 'admin' ? ['dashboard', 'leads', 'followups', 'telecallers', 'import', 'integrations'] : ['leads', 'followups', 'call_history']));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);

    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
        is_active: editActive,
        allowed_tabs: editTabs,
      };

      if (editPassword && editPassword.trim() !== '') {
        if (editPassword.trim().length < 6) {
          alert('New password must be at least 6 characters.');
          setEditLoading(false);
          return;
        }
        payload.password = editPassword.trim();
      }

      await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      alert(`Team member "${editName}" updated successfully.`);
      setEditingUser(null);
      fetchUsers();
      onUsersUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteReassignChoice('keep_name');
    setDeleteReassignTo('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    if (deleteReassignChoice === 'reassign' && !deleteReassignTo) {
      alert('Please select another telecaller to reassign the leads, or choose another option.');
      return;
    }

    setDeleteLoading(true);
    try {
      let reassignPayload: string | number = 'keep_name';
      if (deleteReassignChoice === 'reassign') {
        reassignPayload = parseInt(deleteReassignTo);
      } else if (deleteReassignChoice === 'triage') {
        reassignPayload = 'unassigned';
      }

      const res = await apiRequest(`/users/${deletingUser.id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          reassign_to: reassignPayload,
        }),
      });

      alert(res.message || 'Team member deleted successfully.');
      setDeletingUser(null);
      fetchUsers();
      onUsersUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete team member');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleTab = (tabId: string, currentList: string[], setter: (v: string[]) => void) => {
    if (currentList.includes(tabId)) {
      setter(currentList.filter(t => t !== tabId));
    } else {
      setter([...currentList, tabId]);
    }
  };

  // Telecallers available to receive reassigned leads
  const otherActiveTelecallers = users.filter(
    (u) => deletingUser && u.id !== deletingUser.id && u.role === 'telecaller' && u.is_active
  );

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
            Manage your sales telecallers and admin users, edit login credentials, and configure allowed tab permissions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {users.map((user) => {
          // Check if current user has permission to delete this user
          const isSelf = user.id === currentUser?.id;
          const isTargetSuperAdmin = user.role === 'super_admin';
          const canDelete = !isSelf && !isTargetSuperAdmin && (isSuperAdmin || (currentUser?.role === 'admin' && user.role === 'telecaller'));

          return (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-2.5 hover:border-amber-300 transition flex flex-col justify-between">
              
              <div className="space-y-2.5">
                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                      user.role === 'super_admin'
                        ? 'bg-rose-100 text-rose-800'
                        : user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
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

                  <span 
                    className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                    title={user.is_active ? 'Account Active' : 'Account Deactivated'} 
                  />
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
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Allowed Tabs ({user.allowed_tabs?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(user.allowed_tabs || ['leads', 'followups', 'call_history']).map((tab) => (
                      <span key={tab} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(user)}
                    className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    title="Delete member and reassign working"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEdit(user)}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition cursor-pointer ml-auto"
                >
                  <Pencil className="w-3 h-3 text-amber-700" />
                  <span>Edit Profile &amp; Tabs</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password * (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+971501234567"
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
                    <option value="telecaller">Telecaller (Sales Agent)</option>
                    <option value="admin">Admin (Operational Manager)</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin (Full Access)</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Permitted Tabs Access:</label>
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {availableTabs.map((tab) => (
                    <label key={tab.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
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
                  {addLoading ? 'Creating...' : 'Create Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (Name, Email, Password, Phone, Role, Status, Tabs) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Edit Team Member: {editingUser.name}
              </h3>
              <p className="text-xs text-slate-500">
                Update name, email, password, phone, role, and tab permissions.
              </p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Change Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty to keep unchanged"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    disabled={editingUser.role === 'super_admin' && !isSuperAdmin}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="telecaller">Telecaller (Sales Agent)</option>
                    <option value="admin">Admin (Operational Manager)</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin (Full Access)</option>}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Account Status</span>
                  <span className="text-[11px] text-slate-500">Deactivated users cannot log into the CRM</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    editActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {editActive ? 'ACTIVE' : 'DEACTIVATED'}
                </button>
              </div>

              {/* Tabs */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Permitted Tabs Access:</label>
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 font-bold bg-amber-800 text-white rounded-xl hover:bg-amber-900 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal (Smart Lead Reassignment) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Team Member: {deletingUser.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this account? Choose what should happen to their assigned leads.
                </p>
              </div>
            </div>

            {/* Leads Count Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span>This member currently has <strong>{deletingUser.leads_count ?? 0} assigned lead(s)</strong>. Before deleting, select where their working should be assigned:</span>
            </div>

            {/* Options */}
            <div className="space-y-2.5 text-xs">
              
              {/* Option 1: Keep Name on Leads (Default & Safest) */}
              <label className={`p-3 rounded-xl border block cursor-pointer transition ${
                deleteReassignChoice === 'keep_name'
                  ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delete_reassign"
                    checked={deleteReassignChoice === 'keep_name'}
                    onChange={() => setDeleteReassignChoice('keep_name')}
                  />
                  <strong className="text-slate-900">Keep Member's Name on Leads (Recommended)</strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  All {deletingUser.leads_count ?? 0} leads will keep {deletingUser.name}'s name visible as <em>"{deletingUser.name} (Former Agent)"</em>. Historical call logs and assignments are 100% preserved. Admins can reassign them one-by-one anytime.
                </p>
              </label>

              {/* Option 2: Move to Unassigned Triage */}
              <label className={`p-3 rounded-xl border block cursor-pointer transition ${
                deleteReassignChoice === 'triage'
                  ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delete_reassign"
                    checked={deleteReassignChoice === 'triage'}
                    onChange={() => setDeleteReassignChoice('triage')}
                  />
                  <strong className="text-slate-900">Move Leads to Unassigned Triage Pool</strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  All {deletingUser.leads_count ?? 0} leads will be unassigned and placed into the Unassigned Pool for Admin &amp; Super Admin to review and distribute later.
                </p>
              </label>

              {/* Option 3: Reassign to Another Active Telecaller */}
              <label className={`p-3 rounded-xl border block cursor-pointer transition ${
                deleteReassignChoice === 'reassign'
                  ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delete_reassign"
                    checked={deleteReassignChoice === 'reassign'}
                    onChange={() => setDeleteReassignChoice('reassign')}
                  />
                  <strong className="text-slate-900">Reassign All Leads to Another Active Telecaller</strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Immediately transfer all {deletingUser.leads_count ?? 0} leads directly to another team member.
                </p>

                {deleteReassignChoice === 'reassign' && (
                  <div className="mt-2.5 pl-5">
                    {otherActiveTelecallers.length === 0 ? (
                      <p className="text-[11px] text-rose-600 font-semibold">
                        No other active telecallers found. Please select one of the options above.
                      </p>
                    ) : (
                      <select
                        value={deleteReassignTo}
                        onChange={(e) => setDeleteReassignTo(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">Select recipient telecaller...</option>
                        {otherActiveTelecallers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </label>

            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading || (deleteReassignChoice === 'reassign' && !deleteReassignTo)}
                className="px-4 py-2 font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Confirm & Delete Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
