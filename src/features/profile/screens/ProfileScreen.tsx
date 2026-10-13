import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { mockProducts } from '../../../mock/data';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { supabase } from '../../../core/supabase';
import { 
  ShieldCheck, 
  Star, 
  MapPin, 
  TrendingUp, 
  Award, 
  Settings, 
  Edit3,
  LogOut,
  Trash2,
  RefreshCw,
  X,
  Check,
  Camera
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
];

export const ProfileScreen: React.FC = () => {
  const { currentUser, setCurrentUser, setUserRole, setActiveScreen } = useAppState();
  const { speakText, settings } = useAccessibility();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState(currentUser.name || '');
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editLocation, setEditLocation] = useState(currentUser.location || 'Colombo, Sri Lanka');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || AVATAR_OPTIONS[0]);
  const [editAccommodations, setEditAccommodations] = useState({
    visual: Boolean(currentUser.accommodations?.visual),
    motor: Boolean(currentUser.accommodations?.motor),
    hearing: Boolean(currentUser.accommodations?.hearing),
    cognitive: Boolean(currentUser.accommodations?.cognitive),
  });

  // Read Profile from Supabase
  const syncProfile = async () => {
    setSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const isValidUUID = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      const sessionUserId = sessionData?.session?.user?.id;
      const userEmail = sessionData?.session?.user?.email || currentUser.email;

      let query = supabase.from('users').select('*');
      if (isValidUUID(sessionUserId)) {
        query = query.eq('id', sessionUserId);
      } else if (isValidUUID(currentUser.id)) {
        query = query.eq('id', currentUser.id);
      } else if (userEmail) {
        query = query.eq('email', userEmail);
      } else {
        setSyncing(false);
        return;
      }

      const { data, error } = await query.maybeSingle();

        if (!error && data) {
          setCurrentUser((prev) => ({
            ...prev,
            id: data.id,
            name: data.name || prev.name,
            email: data.email || prev.email,
            role: data.role || prev.role,
            avatar: data.avatar || prev.avatar,
            bio: data.bio || prev.bio,
            location: data.location || prev.location,
            accommodations: data.accommodations || prev.accommodations,
          }));
          if (settings.screenReader) speakText('Profile synced with cloud.');
        }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    syncProfile();
  }, []);

  const openEditModal = () => {
    setEditName(currentUser.name || '');
    setEditBio(currentUser.bio || '');
    setEditLocation(currentUser.location || 'Colombo, Sri Lanka');
    setEditAvatar(currentUser.avatar || AVATAR_OPTIONS[0]);
    setEditAccommodations({
      visual: Boolean(currentUser.accommodations?.visual),
      motor: Boolean(currentUser.accommodations?.motor),
      hearing: Boolean(currentUser.accommodations?.hearing),
      cognitive: Boolean(currentUser.accommodations?.cognitive),
    });
    setIsEditing(true);
    if (settings.screenReader) speakText('Opened edit profile modal');
  };

  // Update Profile (CRUD - Update)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const targetId = sessionData?.session?.user?.id || currentUser.id;

      const payload = {
        id: targetId,
        name: editName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        avatar: editAvatar,
        accommodations: editAccommodations,
        email: currentUser.email,
        role: currentUser.role,
      };

      await supabase.from('users').upsert(payload, { onConflict: 'id' });

      setCurrentUser((prev) => ({
        ...prev,
        ...payload,
      }));

      setIsEditing(false);
      if (settings.screenReader) speakText('Profile updated successfully.');
    } catch (err) {
      console.warn('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete Profile (CRUD - Delete)
  const handleDeleteAccount = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const targetId = sessionData?.session?.user?.id || currentUser.id;

      if (targetId) {
        await supabase.from('users').delete().eq('id', targetId);
      }

      await supabase.auth.signOut();
      setUserRole('customer');
      setCurrentUser((prev) => ({ ...prev, role: 'customer' }));
      setIsDeleting(false);
      setActiveScreen('auth');
      if (settings.screenReader) speakText('Account deleted permanently.');
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignore
    }
    setUserRole('customer');
    setCurrentUser((prev) => ({ ...prev, role: 'customer' }));
    if (settings.screenReader) {
      speakText('Logged out successfully');
    }
    setActiveScreen('auth');
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="My Profile 👤" />

      <div className="space-y-4 pb-8">
        
        {/* Cover Image & Avatar Header */}
        <div className="relative">
          <div className="w-full h-36 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-700 relative">
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <button
                onClick={syncProfile}
                disabled={syncing}
                title="Sync from Database"
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="px-4 flex items-end justify-between -mt-10 relative z-10">
            <div className="relative">
              <img 
                src={currentUser.avatar || AVATAR_OPTIONS[0]} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
              />
              <button
                onClick={openEditModal}
                className="absolute bottom-0 right-0 bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-full text-xs shadow-md"
                title="Change Avatar"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setActiveScreen('settings')}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={openEditModal}
                className="px-3.5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md flex items-center space-x-1 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 space-y-1">
          <div className="flex items-center space-x-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{currentUser.name}</h2>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              {currentUser.role?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">
            ✉️ {currentUser.email || 'Email verified on Supabase'}
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            "{currentUser.bio || 'Member of AccessHub inclusive community.'}"
          </p>
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 pt-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.location || 'Colombo, Sri Lanka'}</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{currentUser.rating || 4.9} ({currentUser.reviewsCount || 12} reviews)</span>
            </span>
          </div>
        </div>

        {/* Accommodations & Accessibility Tags */}
        <div className="px-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">♿ Active Accommodations</span>
              <button onClick={openEditModal} className="text-[11px] font-bold text-teal-600 hover:underline">Edit</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentUser.accommodations?.visual && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  👁️ Visual Assist
                </span>
              )}
              {currentUser.accommodations?.motor && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ♿ Wheelchair Accessible
                </span>
              )}
              {currentUser.accommodations?.hearing && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  🦻 Hearing Support
                </span>
              )}
              {currentUser.accommodations?.cognitive && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🧠 Simple UI
                </span>
              )}
              {!currentUser.accommodations?.visual &&
                !currentUser.accommodations?.motor &&
                !currentUser.accommodations?.hearing &&
                !currentUser.accommodations?.cognitive && (
                  <span className="text-xs text-slate-400 italic">No special accommodations set</span>
                )}
            </div>
          </div>
        </div>

        {/* Income Analytics Card */}
        <div className="px-4">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Total Sales & Earnings</span>
              <TrendingUp className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold">LKR {(currentUser.totalEarnings || 48500).toLocaleString()}</span>
              <span className="text-xs text-teal-200">({currentUser.totalOrders || 14} Completed Orders)</span>
            </div>
            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-bold">
              <span>Payout Status: Bank Direct Deposit Active</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20">Monthly Auto-Transfer</span>
            </div>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="px-4 pt-2">
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
            <h4 className="font-extrabold text-xs text-rose-700 dark:text-rose-400">⚠️ Account Management</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Delete your account and all associated profile records from the database permanently.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => setIsDeleting(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-teal-500" />
                <span>Edit Profile</span>
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Avatar Preset</label>
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditAvatar(a)}
                      className={`relative shrink-0 rounded-2xl overflow-hidden p-0.5 border-2 ${editAvatar === a ? 'border-teal-500' : 'border-transparent'}`}
                    >
                      <img src={a} alt="preset" className="w-10 h-10 rounded-xl object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Bio / About</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">Accessibility Accommodations</span>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAccommodations.visual}
                    onChange={(e) => setEditAccommodations((p) => ({ ...p, visual: e.target.checked }))}
                    className="rounded text-teal-600"
                  />
                  <span>👁️ Visual Assistance</span>
                </label>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAccommodations.motor}
                    onChange={(e) => setEditAccommodations((p) => ({ ...p, motor: e.target.checked }))}
                    className="rounded text-teal-600"
                  />
                  <span>♿ Mobility / Wheelchair</span>
                </label>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAccommodations.hearing}
                    onChange={(e) => setEditAccommodations((p) => ({ ...p, hearing: e.target.checked }))}
                    className="rounded text-teal-600"
                  />
                  <span>🦻 Hearing Assistance</span>
                </label>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAccommodations.cognitive}
                    onChange={(e) => setEditAccommodations((p) => ({ ...p, cognitive: e.target.checked }))}
                    className="rounded text-teal-600"
                  />
                  <span>🧠 Cognitive / Simplified UI</span>
                </label>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-3 border-2 border-rose-500">
            <span className="text-3xl block">🚨</span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Delete Profile?</h3>
            <p className="text-xs text-slate-500">
              This action will permanently delete your user profile and database records. It cannot be undone.
            </p>
            <div className="pt-2 flex space-x-2">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
