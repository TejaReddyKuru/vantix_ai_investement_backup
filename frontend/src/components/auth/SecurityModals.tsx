import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Lock, ShieldCheck, Activity, LogOut, User as UserIcon } from "lucide-react";
import { apiClient } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";

const modalContentStyle = {
  position: 'fixed' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(7, 17, 31, 0.14)',
  zIndex: 100
};

// --- Change Password Modal ---
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change password. Please check your current password and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content className="cc-dialog" style={modalContentStyle}>
          <div className="cc-panel-heading sticky -top-6 bg-white z-10 pb-4 mb-2 border-b border-[#E3E2D9] flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2">
              <Lock size={16} className="text-[#2F78B7]" />
              Change Password
            </Dialog.Title>
            <Dialog.Close className="cc-icon-button">
              <X size={18} />
            </Dialog.Close>
          </div>

          {success ? (
            <div className="py-8 text-center text-[#18794E] flex flex-col items-center">
              <ShieldCheck size={48} className="mb-4" />
              <div className="font-extrabold text-lg">Password Changed Successfully</div>
              <p className="text-xs mt-2 text-[#66766B]">You can now use your new password to sign in.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-4 space-y-5">
              {error && (
                <div className="p-3 bg-[#FBF4F4] text-[#8B4545] border border-[#E5D2D2] rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
                <p className="mt-1 text-[10px] text-[#8A897F]">Minimum 8 characters, with uppercase, lowercase, number, and special character.</p>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#9A998F] mb-1.5">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#E3E2D9] bg-white px-3 py-2 text-sm text-[#07111F] outline-none focus:border-[#2F78B7]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#55554F] hover:bg-[#FAFAF7] transition-colors border border-[#E3E2D9]"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2F78B7] text-xs font-extrabold text-white shadow-md hover:bg-[#245F93] transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// --- Active Sessions Modal ---
interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  last_seen_at: string;
  created_at: string;
  current: boolean;
}

export function ActiveSessionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/v1/auth/sessions");
      setSessions(res.data.sessions || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const handleRevoke = async (id: string) => {
    if (!confirm("Log out this device? This will remove access to your account from this device.")) return;
    try {
      await apiClient.delete(`/api/v1/auth/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Failed to revoke session.");
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Log out of all other devices? All other active sessions will be signed out.")) return;
    try {
      await apiClient.delete("/api/v1/auth/sessions");
      fetchSessions();
    } catch (err: any) {
      alert("Failed to revoke other sessions.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content className="cc-dialog" style={modalContentStyle}>
          <div className="cc-panel-heading sticky -top-6 bg-white z-10 pb-4 mb-2 border-b border-[#E3E2D9] flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#2F78B7]" />
              Active Sessions
            </Dialog.Title>
            <Dialog.Close className="cc-icon-button">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="py-2">
            {error && (
              <div className="p-3 mb-4 bg-[#FBF4F4] text-[#8B4545] border border-[#E5D2D2] rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="text-center text-xs text-[#8A897F] py-8">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-xs text-[#8A897F] py-8">No active sessions found.</div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="p-4 border border-[#E3E2D9] rounded-xl flex items-center justify-between bg-[#FAFAF7]">
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2 text-[#07111F]">
                        {session.device_info}
                        {session.current && (
                          <span className="bg-[#18794E]/10 text-[#18794E] text-[10px] uppercase px-2 py-0.5 rounded font-extrabold tracking-wider">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8A897F] mt-1">
                        IP: {session.ip_address || "Unknown"} &bull; Last active: {session.last_seen_at ? formatDate(session.last_seen_at) : 'N/A'}
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => handleRevoke(session.id)}
                        className="text-[11px] font-extrabold text-[#8B4545] hover:bg-[#FBF4F4] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#E5D2D2] transition-colors"
                      >
                        Log out
                      </button>
                    )}
                  </div>
                ))}

                {sessions.length > 1 && (
                  <div className="pt-4 mt-2 border-t border-[#ECECE4] flex justify-end">
                    <button
                      onClick={handleRevokeAll}
                      className="text-[11px] font-extrabold text-[#55554F] hover:bg-[#FAFAF7] px-4 py-2 border border-[#E3E2D9] rounded-xl flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Log out all other sessions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// --- Login Activity Modal ---
interface AuditLog {
  id: string;
  action: string;
  ip_address: string;
  created_at: string;
  metadata: any;
}

export function LoginActivityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchActivity = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await apiClient.get("/api/v1/auth/activity");
          setActivity(res.data.activity || []);
        } catch (err: any) {
          setError(err.response?.data?.detail || "Failed to load activity.");
        } finally {
          setLoading(false);
        }
      };
      fetchActivity();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'login': return { label: 'Successful login', color: 'text-[#18794E]' };
      case 'failed_login': return { label: 'Failed login attempt', color: 'text-[#8B4545]' };
      case 'logout': return { label: 'Logged out', color: 'text-[#55554F]' };
      case 'password_change': return { label: 'Password changed', color: 'text-[#2F78B7]' };
      case 'session_revoked': return { label: 'Session revoked', color: 'text-[#55554F]' };
      case 'logout_all_other_sessions': return { label: 'Logged out other sessions', color: 'text-[#55554F]' };
      default: return { label: action.replace(/_/g, ' '), color: 'text-[#8A897F]' };
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content className="cc-dialog" style={modalContentStyle}>
          <div className="cc-panel-heading sticky -top-6 bg-white z-10 pb-4 mb-2 border-b border-[#E3E2D9] flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2">
              <Activity size={16} className="text-[#2F78B7]" />
              Login Activity
            </Dialog.Title>
            <Dialog.Close className="cc-icon-button">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="py-2">
            {error && (
              <div className="p-3 mb-4 bg-[#FBF4F4] text-[#8B4545] border border-[#E5D2D2] rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="text-center text-xs text-[#8A897F] py-8">Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-center text-xs text-[#8A897F] py-8">No recent security activity.</div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E3E2D9] before:to-transparent">
                {activity.map(log => {
                  const details = getActionDetails(log.action);
                  return (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-[#E3E2D9] group-[.is-active]:bg-[#2F78B7] text-white group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[9px] -translate-x-1/2 md:ml-0" />
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-[#E3E2D9] bg-white shadow">
                        <div className="flex items-center justify-between mb-1">
                          <div className={`font-extrabold text-sm ${details.color}`}>{details.label}</div>
                        </div>
                        <div className="text-xs text-[#8A897F] flex flex-col gap-0.5">
                          {log.created_at && <span>{formatDate(log.created_at)}</span>}
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                          {log.metadata?.device && <span>Device: {log.metadata.device}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// --- Avatar Selection Modal ---
const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Cleo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo"
];

export function AvatarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const selectAvatar = async (url: string) => {
    setLoading(true);
    try {
      await apiClient.put("/api/v1/auth/profile", { avatar_url: url });
      updateUser({ avatar_url: url });
      onClose();
    } catch (err: any) {
      alert("Failed to update avatar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content className="cc-dialog" style={modalContentStyle}>
          <div className="cc-panel-heading sticky -top-6 bg-white z-10 pb-4 mb-2 border-b border-[#E3E2D9] flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2">
              <UserIcon size={16} className="text-[#2F78B7]" />
              Choose Avatar
            </Dialog.Title>
            <Dialog.Close className="cc-icon-button">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="py-4">
            <div className="grid grid-cols-4 gap-4">
              {AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => selectAvatar(url)}
                  disabled={loading}
                  className="relative aspect-square overflow-hidden rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md disabled:opacity-50"
                  style={{
                    borderColor: user?.avatar_url === url ? '#2F78B7' : '#E3E2D9',
                    backgroundColor: '#FAFAF7'
                  }}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover p-2" />
                </button>
              ))}
            </div>
            {loading && (
              <div className="mt-4 text-center text-xs text-[#8A897F] font-semibold animate-pulse">
                Saving your avatar...
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
