import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { supabase } from '../../../core/supabase';
import { 
  ShieldCheck, 
  CheckCircle2,
  Wrench,
  Star,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Plus,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
  CreditCard,
  Building2,
  Check
} from 'lucide-react';

export const AdminScreen: React.FC = () => {
  const { 
    servicesList,
    pendingServiceApplications, 
    approveServiceApplication, 
    rejectServiceApplication,
    bookingRequests,
    approveBookingEscrow,
    acceptBookingByFreelancer,
    rejectBookingEscrow,
    setActiveScreen,
    setFreelancerModalOpen
  } = useAppState();

  const { speakText } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'freelancers' | 'bookings' | 'docs' | 'accounts'>('freelancers');
  const [justApprovedName, setJustApprovedName] = useState<string | null>(null);
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);

  const fetchSupabaseUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (data) {
        setRealUsers(data);
      }
    } catch (err) {
      console.warn('Error fetching Supabase users:', err);
    }
  };

  React.useEffect(() => {
    fetchSupabaseUsers();
  }, [activeTab]);

  useEffect(() => {
    fetchSupabaseUsers();
  }, []);

  const [verificationQueue, setVerificationQueue] = useState([
    { id: 'v1', name: 'Chamara Perera', type: 'Disability Certificate', status: 'Pending Verification', doc: 'Medical Board Cert #4521' },
    { id: 'v2', name: 'Hope Lanka NGO', type: 'NGO Charter', status: 'Pending Verification', doc: 'Reg #G-89512' }
  ]);

  const handleApproveDoc = (id: string, name: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
    speakText(`Approved verification for ${name}. Badge granted.`);
  };

  const handleApproveFreelancer = (id: string, name: string, serviceTitle: string) => {
    approveServiceApplication(id);
    setJustApprovedName(name);
    speakText(`OK confirmed! Approved freelancer application for ${name}. Published to Navbar Services.`);
    
    setTimeout(() => {
      setJustApprovedName(null);
    }, 4000);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Admin Dashboard 🛡️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Admin Header Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl space-y-2 border border-slate-700 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Management Hub</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Admin App
            </span>
          </div>

          <h3 className="font-extrabold text-base">Service Approvals & Verification Engine</h3>
          <p className="text-xs text-slate-300">
            Review freelancer applications (Name, District, Guardian, Phone, Rating, Images) and grant OK approval to publish to Navbar Services.
          </p>

          <div className="pt-1 flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('accounts');
                speakText('Navigating to Account Dashboard');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Account Dashboard</span>
            </button>

            <button
              onClick={() => {
                setSelectedUserProfile({
                  id: 'seller-kasun',
                  name: 'Kasun Kalhara',
                  email: 'kasun.seller@accesshub.lk',
                  role: 'seller',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
                  bio: 'Handicraft artisan specializing in custom tactile wooden products & accessible goods',
                  location: 'Kandy',
                  rating: 5.0,
                  reviews_count: 12
                });
                speakText('Opening profile view for Kasun Kalhara');
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center space-x-1 shadow-md"
            >
              <User className="w-3.5 h-3.5" />
              <span>🛍️ View Seller (Kasun) Profile</span>
            </button>

            <button
              onClick={() => {
                setSelectedUserProfile({
                  id: 'freelancer-randi',
                  name: 'Randi Thathsarani',
                  email: 'randi.freelancer@accesshub.lk',
                  role: 'freelancer',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
                  bio: 'Professional Video Editor & Audio Subtitler for Assistive Content',
                  location: 'Colombo',
                  rating: 5.0,
                  reviews_count: 18
                });
                speakText('Opening profile view for Randi Thathsarani');
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center space-x-1 shadow-md"
            >
              <User className="w-3.5 h-3.5" />
              <span>🛠️ View Freelancer (Randi) Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('bookings');
                speakText('Navigating to Orders Sent to Freelancers Queue');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center space-x-1 shadow-md transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>📦 Orders ({bookingRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('freelancers')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'freelancers'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Freelancers ({pendingServiceApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'bookings'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>📦 Freelancer Orders ({bookingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Certs ({verificationQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'accounts'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Account Dashboard</span>
          </button>
        </div>

        {/* Success Approval Notification Alert */}
        {justApprovedName && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Approved <strong>{justApprovedName}</strong>! OK confirmed & added to Navbar Services.</span>
            </div>
            <button
              onClick={() => setActiveScreen('services')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shrink-0 flex items-center space-x-1"
            >
              <span>View Services</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* FREELANCER MANAGEMENT TAB */}
        {activeTab === 'freelancers' && (
          <div className="space-y-4">
            {/* PENDING APPLICATIONS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                  Pending Freelancer Approvals ({pendingServiceApplications.length})
                </h3>
              </div>

              {pendingServiceApplications.length === 0 ? (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-1 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="font-extrabold text-xs">All Registration Applications Reviewed!</h4>
                  <p className="text-[11px] text-slate-400">No pending freelancer registration requests in queue.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingServiceApplications.map((app) => (
                    <div key={app.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
                      
                      {/* Header: Name, Age, Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{app.name}</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Age: {app.age}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 pt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{app.district} District</span>
                            {app.disabilityBadge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold">
                                ♿ {app.disabilityBadge}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Freelancer Status Tag */}
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          app.isFreelancer 
                            ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300' 
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {app.isFreelancer ? '✓ Freelancer (YES)' : 'Staff (NO)'}
                        </span>
                      </div>

                      {/* Service Offer Info */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {app.serviceTitle}
                          </span>
                          <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                            LKR {Number(app.hourlyRate).toLocaleString()} / hr
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                          {app.description}
                        </p>
                      </div>

                      {/* Contact & Guardian Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[9px] block">Applicant Phone:</span>
                          <span className="font-extrabold text-slate-800 dark:text-amber-200 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-amber-500" />
                            <span>{app.phone}</span>
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[9px] block">Guardian Details:</span>
                          <span className="font-bold text-slate-800 dark:text-amber-200 block truncate">
                            {app.guardianName || 'N/A'}
                          </span>
                          {app.guardianPhone && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                              {app.guardianPhone}
                            </span>
                          )}
                        </div>

                        {app.address && (
                          <div className="col-span-2 pt-1 border-t border-amber-200/50 dark:border-amber-900/40">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Full Address:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{app.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Rating & Attached Rating Images */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-amber-500 font-extrabold text-xs">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span>Rating: {app.rating}.0 / 5.0</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {app.ratingImages.length} Proof Image(s)
                          </span>
                        </div>

                        {/* Images Gallery */}
                        {app.ratingImages.length > 0 && (
                          <div className="flex space-x-2 overflow-x-auto pt-0.5">
                            {app.ratingImages.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="Rating attachment proof"
                                className="w-16 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Approve (OK) vs Reject */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => handleApproveFreelancer(app.id, app.name, app.serviceTitle)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Add to Navbar Services (OK)</span>
                        </button>

                        <button
                          onClick={() => rejectServiceApplication(app.id)}
                          className="py-2.5 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs"
                        >
                          Reject
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REGISTERED & ACTIVE FREELANCERS SECTION */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-teal-500" />
                  <span>🛠️ Registered Freelancer Profiles ({realUsers.filter(u => ['freelancer', 'provider'].includes((u.role || '').toLowerCase())).length + servicesList.length})</span>
                </h3>
                <button
                  onClick={fetchSupabaseUsers}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center space-x-1"
                >
                  <span>🔄 Sync Database</span>
                </button>
              </div>

              {realUsers.filter(u => ['freelancer', 'provider'].includes((u.role || '').toLowerCase())).length === 0 && servicesList.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                  <Wrench className="w-8 h-8 text-teal-500 mx-auto" />
                  <h4 className="font-extrabold text-xs">No Freelancers Registered in Database</h4>
                  <p className="text-[11px] text-slate-400">
                    Run the SQL script provided in your Supabase SQL editor to add a freelancer profile, then click Sync Database!
                  </p>
                  <button
                    onClick={fetchSupabaseUsers}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs inline-flex items-center space-x-1"
                  >
                    <span>🔄 Sync Database Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Database Users with Freelancer Role */}
                  {realUsers.filter(u => ['freelancer', 'provider'].includes((u.role || '').toLowerCase())).map((freelancer, idx) => (
                    <div key={freelancer.id || idx} className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-teal-500/30 space-y-2 shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {freelancer.avatar ? (
                            <img src={freelancer.avatar} alt={freelancer.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/40" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-base uppercase">
                              {(freelancer.name || 'F').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{freelancer.name}</h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase">
                                ✓ Verified Freelancer
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              📍 {freelancer.location || 'Sri Lanka'} • {freelancer.email}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-amber-500 font-extrabold flex items-center justify-end space-x-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{freelancer.rating || 5.0}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">{freelancer.reviews_count || 0} reviews</span>
                        </div>
                      </div>

                      {freelancer.bio && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 italic">
                          "{freelancer.bio}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-teal-500 font-bold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Freelancer Profile</span>
                        </span>

                        <button 
                          onClick={() => {
                            setSelectedUserProfile({ ...freelancer, role: 'freelancer' });
                            speakText(`Opening profile and order acceptance center for ${freelancer.name}`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>View Profile & Accept Orders</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Published Services Items */}
                  {servicesList.map((service) => (
                    <div key={service.id} className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={service.providerAvatar} alt={service.providerName} className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/40" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{service.providerName}</h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase">
                                {service.disabilityBadge || 'Verified Freelancer'}
                              </span>
                            </div>
                            <span className="text-[10px] text-teal-500 font-bold block mt-0.5">
                              {service.title} • LKR {service.hourlyRate.toLocaleString()} / hr
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-amber-500 font-extrabold flex items-center justify-end space-x-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{service.rating}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">{service.reviewsCount} reviews</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">📍 {service.availability}</span>
                        <button 
                          onClick={() => setActiveScreen('services')}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold text-[10px]"
                        >
                          View Service
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ESCROW BOOKINGS / FREELANCER ORDERS QUEUE TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>📦 Client Orders Sent to Freelancers ({bookingRequests.length})</span>
              </h3>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No Orders Sent to Freelancers Yet</h4>
                <p className="text-xs text-slate-400">
                  When a client books a freelancer through the "Book Provider" form, the order details will be dispatched and shown here for freelancer acceptance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookingRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">
                          ● {req.status === 'in_progress' || req.status === 'accepted' ? '✓ Accepted by Freelancer & Work in Progress' : `Dispatched ➔ Awaiting Freelancer Acceptance (${req.providerName})`}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                          {req.projectTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Client: <strong className="text-slate-900 dark:text-white">{req.clientName}</strong> ➔ Target Freelancer: <strong className="text-teal-400">{req.providerName}</strong> ({req.serviceTitle})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-medium block">Total Budget</span>
                        <span className="font-extrabold text-sm text-amber-500">LKR {req.totalBudget.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Escrow Milestone Terms */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Payment Option: {req.paymentType === 'full_upfront' ? '100% Upfront' : 'Milestone Split'}</span>
                        <span className="font-extrabold text-emerald-500">💳 Initial Deposit Required: LKR {req.upfrontDeposit.toLocaleString()}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">Remaining Balance: LKR {req.remainingBalance.toLocaleString()}</span>
                    </div>

                    {req.description ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl italic">
                        "{req.description}"
                      </p>
                    ) : null}

                    {/* Freelancer Acceptance Controls */}
                    <div className="flex items-center space-x-2 pt-1">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => {
                              approveBookingEscrow(req.id);
                              speakText(`Freelancer ${req.providerName} accepted order for ${req.projectTitle}. Work started.`);
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Order as Freelancer ({req.providerName}) (OK)</span>
                          </button>
                          <button
                            onClick={() => {
                              rejectBookingEscrow(req.id);
                              speakText(`Freelancer declined order.`);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-200"
                          >
                            Decline Order
                          </button>
                        </>
                      ) : (
                        <div className="w-full p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✓ Order Accepted by Freelancer {req.providerName} & Funds Locked in Vault (In Progress)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Medical & NGO Documents Queue ({verificationQueue.length})
            </h3>

            {verificationQueue.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-xs">All Verifications Cleared!</h4>
                <p className="text-[11px] text-slate-400">Queue is completely up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationQueue.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">{item.type}</span>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        {item.doc}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => handleApproveDoc(item.id, item.name)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center space-x-1 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Badge</span>
                      </button>
                      <button
                        onClick={() => setVerificationQueue(prev => prev.filter(i => i.id !== item.id))}
                        className="py-2 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT DASHBOARD TAB */}
        {activeTab === 'accounts' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Account & Financial Management Dashboard</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                ● Live Supabase Data ({realUsers.length} Users)
              </span>
            </div>

            {/* Financials Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase">Total Buyers</span>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <p className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {realUsers.filter(u => (u.role || '').toLowerCase() === 'buyer').length || realUsers.length}
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">● Supabase Synced</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase">Verified Freelancers</span>
                  <Wrench className="w-4 h-4 text-teal-500" />
                </div>
                <p className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {servicesList.length}
                </p>
                <p className="text-[10px] text-teal-500 font-semibold">✔ Live Verified Services</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase">Escrow Volume</span>
                  <Wallet className="w-4 h-4 text-amber-500" />
                </div>
                <p className="font-extrabold text-base text-amber-500">
                  LKR {servicesList.reduce((acc, s) => acc + (s.hourlyRate * 3), 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">🔒 Protected in Vault</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase">Platform Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="font-extrabold text-base text-emerald-500">
                  LKR {Math.round(servicesList.reduce((acc, s) => acc + (s.hourlyRate * 3), 0) * 0.10).toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold">10% Service Fee</p>
              </div>
            </div>

            {/* Orders Sent to Freelancers Queue */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>📦 Orders Sent to Freelancers ({bookingRequests.length})</span>
                </h4>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-[10px] font-extrabold text-teal-500 hover:underline"
                >
                  View Freelancer Queue ➔
                </button>
              </div>

              {bookingRequests.length === 0 ? (
                <div className="p-4 text-center space-y-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">
                    No orders sent to freelancers yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Client form submissions from "Book Provider" will be dispatched here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">
                            ● {req.status === 'in_progress' || req.status === 'accepted' ? '✓ Accepted by Freelancer' : `Dispatched ➔ Awaiting Freelancer Acceptance (${req.providerName})`}
                          </span>
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">
                            {req.projectTitle}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Client: <strong className="text-slate-900 dark:text-white">{req.clientName}</strong> ➔ Target Freelancer: <strong className="text-teal-400">{req.providerName}</strong> ({req.serviceTitle})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Budget</span>
                          <span className="font-extrabold text-xs text-amber-500">LKR {req.totalBudget.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-[11px]">
                        <span>Upfront Deposit: <strong className="text-emerald-500">LKR {req.upfrontDeposit.toLocaleString()}</strong> ({req.paymentType === 'full_upfront' ? '100% Upfront' : 'Milestone Split'})</span>
                        <span className="text-slate-400">Remaining Balance: LKR {req.remainingBalance.toLocaleString()}</span>
                      </div>

                      {req.status === 'pending' ? (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => {
                              approveBookingEscrow(req.id);
                              speakText(`Freelancer ${req.providerName} accepted order for ${req.projectTitle}`);
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Order as Freelancer ({req.providerName}) (OK)</span>
                          </button>
                          <button
                            onClick={() => {
                              rejectBookingEscrow(req.id);
                            }}
                            className="py-2 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-bold text-center flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✓ Order Accepted by Freelancer {req.providerName} & Work Started</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registered Seller Profiles Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  <span>🛍️ Registered Sellers & Handicraft Creators ({realUsers.filter(u => (u.role || '').toLowerCase() === 'seller' || (u.role || '').toLowerCase() === 'creator').length})</span>
                </h4>
                <button
                  onClick={fetchSupabaseUsers}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center space-x-1"
                >
                  <span>🔄 Sync Database</span>
                </button>
              </div>

              {realUsers.filter(u => (u.role || '').toLowerCase() === 'seller' || (u.role || '').toLowerCase() === 'creator').length === 0 ? (
                <div className="p-4 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">
                    No Seller profiles found in Supabase <code className="text-amber-500">public.users</code> database.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Run the SQL Query in Supabase to insert a Seller, then click Sync Database!
                  </p>
                  <button
                    onClick={fetchSupabaseUsers}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs inline-flex items-center space-x-1"
                  >
                    <span>🔄 Sync Database Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {realUsers.filter(u => (u.role || '').toLowerCase() === 'seller' || (u.role || '').toLowerCase() === 'creator').map((seller, idx) => (
                    <div key={seller.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-purple-500/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {seller.avatar ? (
                            <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/40" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm uppercase">
                              {(seller.name || 'S').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{seller.name || 'Seller User'}</h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                                ✓ Verified Seller
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📍 {seller.location || 'Sri Lanka'} • {seller.email}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-amber-500 font-extrabold flex items-center justify-end space-x-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{seller.rating || 5.0}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">{seller.reviews_count || 0} reviews</span>
                        </div>
                      </div>

                      {seller.bio && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 italic">
                          "{seller.bio}"
                        </p>
                      )}

                      <div className="pt-1">
                        <button 
                          onClick={() => {
                            setSelectedUserProfile({ ...seller, role: 'seller' });
                            speakText(`Opening profile and order acceptance center for seller ${seller.name}`);
                          }}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <User className="w-4 h-4" />
                          <span>View Profile & Accept Orders</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registered Freelancer Profiles Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-teal-500" />
                  <span>🛠️ Registered Freelancer Profiles ({realUsers.filter(u => (u.role || '').toLowerCase() === 'freelancer' || (u.role || '').toLowerCase() === 'provider').length + servicesList.length})</span>
                </h4>
                <button
                  onClick={fetchSupabaseUsers}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center space-x-1"
                >
                  <span>🔄 Sync Freelancers</span>
                </button>
              </div>

              {realUsers.filter(u => (u.role || '').toLowerCase() === 'freelancer' || (u.role || '').toLowerCase() === 'provider').length === 0 && servicesList.length === 0 ? (
                <div className="p-4 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">
                    No Freelancer profiles found in Supabase database.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Run the SQL Query in Supabase to insert a Freelancer, then click Sync Database!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Render Freelancers from public.users */}
                  {realUsers.filter(u => (u.role || '').toLowerCase() === 'freelancer' || (u.role || '').toLowerCase() === 'provider').map((freelancer, idx) => (
                    <div key={freelancer.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-teal-500/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {freelancer.avatar ? (
                            <img src={freelancer.avatar} alt={freelancer.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/40" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm uppercase">
                              {(freelancer.name || 'F').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{freelancer.name}</h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase">
                                ✓ Verified Freelancer
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📍 {freelancer.location || 'Sri Lanka'} • {freelancer.email}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-amber-500 font-extrabold flex items-center justify-end space-x-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{freelancer.rating || 5.0}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">{freelancer.reviews_count || 0} reviews</span>
                        </div>
                      </div>

                      {freelancer.bio && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 italic">
                          "{freelancer.bio}"
                        </p>
                      )}

                      <div className="pt-1">
                        <button 
                          onClick={() => {
                            setSelectedUserProfile({ ...freelancer, role: 'freelancer' });
                            speakText(`Opening profile and order acceptance center for ${freelancer.name}`);
                          }}
                          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <User className="w-4 h-4" />
                          <span>View Profile & Accept Orders</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Render Published Services Providers */}
                  {servicesList.map((service) => (
                    <div key={service.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={service.providerAvatar} alt={service.providerName} className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/40" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{service.providerName}</h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase">
                                {service.disabilityBadge || 'Verified Freelancer'}
                              </span>
                            </div>
                            <span className="text-[10px] text-teal-500 font-bold block mt-0.5">
                              {service.title} • LKR {service.hourlyRate.toLocaleString()} / hr
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-amber-500 font-extrabold flex items-center justify-end space-x-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{service.rating}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">{service.reviewsCount} reviews</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">📍 {service.availability}</span>
                        <button 
                          onClick={() => setActiveScreen('services')}
                          className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                        >
                          View Service
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account List & Role Management */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                  👥 Registered User Accounts (Supabase Database)
                </h4>
                <span className="text-[10px] text-slate-400">Total: {realUsers.length} Users</span>
              </div>

              {realUsers.length === 0 ? (
                <div className="p-6 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">
                    No users registered in Supabase <code className="text-amber-500">public.users</code> table yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Run the SQL Query in Supabase or complete sign-up to populate real users.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {realUsers.map((user, idx) => (
                    <div key={user.id || idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
                          {(user.name || user.email || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{user.name || 'Registered User'}</span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase">
                              {user.role || 'Buyer'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{user.email || user.id}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedUserProfile(user);
                          speakText(`Opening profile and order acceptance center for ${user.name || user.email}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1 transition-all"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>View Profile & Accept Orders</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* USER PROFILE & ORDER ACCEPTANCE MODAL */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Profile View & Order Acceptance Center
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserProfile(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold text-xs flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Profile Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white space-y-3 border border-slate-700 shadow-lg">
              <div className="flex items-center space-x-3">
                {selectedUserProfile.avatar ? (
                  <img src={selectedUserProfile.avatar} alt={selectedUserProfile.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-400 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-xl flex items-center justify-center uppercase shrink-0">
                    {(selectedUserProfile.name || 'U').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-base text-white truncate">{selectedUserProfile.name}</h4>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase shrink-0">
                      ✓ Verified {selectedUserProfile.role || 'User'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 truncate">
                    📍 {selectedUserProfile.location || 'Sri Lanka'} • {selectedUserProfile.email}
                  </p>
                  <div className="flex items-center space-x-1 text-amber-400 font-extrabold text-xs mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{selectedUserProfile.rating || 5.0} / 5.0 Rating</span>
                  </div>
                </div>
              </div>

              {selectedUserProfile.bio && (
                <p className="text-xs text-slate-300 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-700/60 leading-snug">
                  "{selectedUserProfile.bio}"
                </p>
              )}
            </div>

            {/* Dispatched Orders & Client Booking Requests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>📦 Dispatched Orders for {selectedUserProfile.name} ({bookingRequests.length})</span>
                </h4>
              </div>

              {bookingRequests.length === 0 ? (
                <div className="p-5 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h5 className="font-extrabold text-xs text-slate-800 dark:text-white">No Client Orders Pending</h5>
                  <p className="text-[11px] text-slate-400">
                    When a buyer books a service targeting {selectedUserProfile.name}, the order details will be dispatched here for order acceptance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {bookingRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">
                            ● {req.status === 'in_progress' || req.status === 'accepted' ? '✓ Accepted & Work in Progress' : `Dispatched ➔ Awaiting Acceptance (${req.providerName})`}
                          </span>
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">
                            {req.projectTitle}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Client: <strong className="text-slate-900 dark:text-white">{req.clientName}</strong> ➔ Target: <strong className="text-teal-400">{req.providerName}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Budget</span>
                          <span className="font-extrabold text-xs text-amber-500">LKR {req.totalBudget.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-[11px]">
                        <span>Deposit Required: <strong className="text-emerald-500">LKR {req.upfrontDeposit.toLocaleString()}</strong> ({req.paymentType === 'full_upfront' ? '100% Upfront' : 'Milestone Split'})</span>
                        <span className="text-slate-400">Balance: LKR {req.remainingBalance.toLocaleString()}</span>
                      </div>

                      {req.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          "{req.description}"
                        </p>
                      )}

                      {/* Accept & Decline Controls */}
                      <div className="flex items-center space-x-2 pt-1">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                acceptBookingByFreelancer(req.id);
                                approveBookingEscrow(req.id);
                                speakText(`Order ${req.projectTitle} accepted by ${selectedUserProfile.name}. Work started.`);
                              }}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept Order as {selectedUserProfile.name} (OK)</span>
                            </button>

                            <button
                              onClick={() => {
                                rejectBookingEscrow(req.id);
                                speakText(`Order declined.`);
                              }}
                              className="py-2 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="w-full p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-bold text-center flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Order Accepted by {selectedUserProfile.name} & Funds Locked in Vault</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedUserProfile(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all"
            >
              Close Profile Window
            </button>

          </div>
        </div>
      )}

      <BottomNav />

    </div>
  );
};

