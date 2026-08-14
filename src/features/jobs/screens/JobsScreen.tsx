import React, { useState } from 'react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { mockJobs } from '../../../mock/data';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Search, 
  MapPin, 
  Bookmark, 
  CheckCircle2, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';

export const JobsScreen: React.FC = () => {
  const { speakText } = useAccessibility();
  const [search, setSearch] = useState('');
  const [appliedJob, setAppliedJob] = useState<string | null>(null);

  const handleApply = (jobTitle: string) => {
    setAppliedJob(jobTitle);
    speakText(`Application submitted for ${jobTitle}. Company recruiter has received your accessible profile.`);
    setTimeout(() => setAppliedJob(null), 2500);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Inclusive Job Portal 💼" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-sm">Equal Opportunity Workplace Portal</h3>
          </div>
          <p className="text-xs text-blue-100">
            Jobs verified for 100% barrier-free workstations, screen-reader software allowances, and flexible hours.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search remote jobs, software, marketing..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Job List */}
        <div className="space-y-3">
          {mockJobs.map((job) => (
            <div 
              key={job.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img src={job.companyLogo} alt={job.company} className="w-12 h-12 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{job.title}</h3>
                    <span className="text-xs font-medium text-slate-500">{job.company}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-500">
                  <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
                </button>
              </div>

              {/* Salary & Location */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold pt-1">
                <span className="text-blue-600 dark:text-blue-400 font-extrabold">{job.salary}</span>
                <span className="text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location}</span>
                </span>
              </div>

              {/* Accessibility Friendly Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.accessibilityBadges.map((badge, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-teal-500" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {job.description}
              </p>

              {/* Apply Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Posted {job.postedDate} • {job.applicantCount} applicants</span>
                <button
                  onClick={() => handleApply(job.title)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  1-Tap Apply
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Applied Modal Feedback */}
        {appliedJob && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-3 max-w-xs shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Application Submitted!</h4>
              <p className="text-xs text-slate-500">Your accessible profile & CV were transmitted to HR recruiters.</p>
            </div>
          </div>
        )}

      </div>

      <BottomNav />

    </div>
  );
};
