import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { SRI_LANKA_DISTRICTS } from '../../../mock/data';
import { 
  X, 
  User, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Wrench,
  UserCheck,
  Upload
} from 'lucide-react';

export const FreelancerRegistrationModal: React.FC = () => {
  const { 
    freelancerModalOpen, 
    setFreelancerModalOpen, 
    addFreelancerServiceApplication, 
    setActiveScreen 
  } = useAppState();
  
  const { speakText } = useAccessibility();

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [isFreelancer, setIsFreelancer] = useState<boolean>(true);
  const [rating, setRating] = useState<number>(5);
  const [ratingImages, setRatingImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600'
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setRatingImages(prev => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Service Details
  const [serviceTitle, setServiceTitle] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [category, setCategory] = useState('Tech & Accessibility');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['Accessibility Audit', 'Sign Language']);
  const [disabilityBadge, setDisabilityBadge] = useState('Wheelchair User');

  const [submitted, setSubmitted] = useState(false);

  if (!freelancerModalOpen) return null;

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setRatingImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setRatingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPresetImage = (url: string) => {
    if (!ratingImages.includes(url)) {
      setRatingImages(prev => [...prev, url]);
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceTitle || !hourlyRate) return;

    addFreelancerServiceApplication({
      name,
      age: age ? Number(age) : 25,
      district,
      address,
      guardianName,
      guardianPhone,
      phone,
      isFreelancer,
      rating,
      ratingImages: ratingImages.length > 0 ? ratingImages : [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600'
      ],
      serviceTitle,
      hourlyRate: Number(hourlyRate),
      category,
      description: description || 'Professional freelancer service offered through AccessHub.',
      skills: skills.length > 0 ? skills : ['Freelancer', district],
      disabilityBadge
    });

    setSubmitted(true);
    speakText(`Service application submitted for ${name}! Sent to Admin Dashboard for approval.`);

    setTimeout(() => {
      setSubmitted(false);
      setFreelancerModalOpen(false);
      setActiveScreen('admin');
    }, 2000);
  };



  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white border-b border-teal-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Wrench className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">
                Freelancer Service Registration
              </h3>
              <p className="text-[11px] text-teal-100">Submit profile details for Admin Review</p>
            </div>
          </div>
          <button
            onClick={() => setFreelancerModalOpen(false)}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 overflow-y-auto space-y-5">
          
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Application Sent to Admin! 🛡️
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your freelancer details have been placed in the Admin Approval Queue. Once approved, it will immediately appear on the Navbar Services tab!
              </p>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block pt-2">
                Redirecting to Admin Dashboard...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Section 1: Personal Details */}
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Applicant Personal Details</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Perera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 26"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">District *</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {SRI_LANKA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Full Address</label>
                  <textarea
                    rows={2}
                    placeholder="No. 45, Temple Road, Colombo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Disability Badge / Accessibility Note</label>
                  <select
                    value={disabilityBadge}
                    onChange={(e) => setDisabilityBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Wheelchair User">♿ Wheelchair User</option>
                    <option value="Visually Impaired">👁️ Visually Impaired</option>
                    <option value="Hearing Impaired">🧏 Hearing Impaired</option>
                    <option value="Mobility Impaired">🦯 Mobility Impaired</option>
                    <option value="Verified Freelancer">✨ Verified Freelancer</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Guardian Details */}
              <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. Guardian Details (භාරකරුගේ විස්තර)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunil Perera (Father)"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Guardian Phone</label>
                    <input
                      type="text"
                      placeholder="+94 71 888 9900"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Freelancer Status Toggle */}
              <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                <label className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                  3. Freelancer Status (Freelancer Yes / No)
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFreelancer(true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                      isFreelancer
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-102'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>YES - Freelancer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFreelancer(false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                      !isFreelancer
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-102'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>NO - In-House Staff</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Rating Selector & Rating Proof Images */}
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* Rating Star Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>4. Rating Score (1 to 5 Stars)</span>
                    </label>
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      {rating}.0 / 5.0
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-xl transition-all flex items-center space-x-1 ${
                          star <= rating 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-300' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating & Work Proof Images Upload - ONLY LOCAL STORAGE */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
                      <span>Upload Photos from Local Storage</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">{ratingImages.length} Uploaded</span>
                  </div>

                  {/* Native File Upload Box for Local Storage */}
                  <div className="border-2 border-dashed border-teal-500/60 hover:border-teal-500 rounded-2xl p-4 bg-teal-50/50 dark:bg-teal-950/30 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Click to Choose Photos from Local Device / Storage
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Upload certificates, work samples, or rating proof files directly from your device
                      </span>
                    </div>
                  </div>

                  {/* Rating Images Preview Thumbnails */}
                  {ratingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {ratingImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group border border-slate-300 dark:border-slate-700 shadow-xs">
                          <img src={imgUrl} alt={`Uploaded proof ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-90 hover:opacity-100 shadow-md"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

              {/* Section 5: Service Offer Details */}
              <div className="space-y-3 p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200/60 dark:border-teal-900/40">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>5. Service Offer Details</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Service Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Accessibility UX Audit & VoiceOver Testing"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hourly Rate (LKR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Tech & Accessibility">Tech & Accessibility</option>
                      <option value="Translation & Media">Translation & Media</option>
                      <option value="Design & Creative">Design & Creative</option>
                      <option value="Handicrafts & Tailoring">Handicrafts & Tailoring</option>
                      <option value="Consulting & Support">Consulting & Support</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Service Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe your service expertise, experience, and accessibility qualifications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* Skills Tags */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Skills / Keywords</label>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center space-x-1">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveSkill(skill)}>
                          <X className="w-3 h-3 text-teal-600 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add skill tag (e.g. WCAG 2.1)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 text-white font-extrabold text-xs shadow-xl hover:opacity-95 transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Submit Application to Admin Dashboard</span>
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
