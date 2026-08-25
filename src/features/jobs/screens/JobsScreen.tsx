import React, { useState, useEffect } from 'react';
import { supabase } from '../../../core/supabase';
import { JobPosting } from '../../../core/types';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Search, 
  MapPin, 
  Bookmark, 
  CheckCircle2, 
  ShieldCheck, 
  Building2,
  Ear,
  Eye,
  Accessibility
} from 'lucide-react';

export const JobsScreen: React.FC = () => {
  const { speakText } = useAccessibility();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedJob, setAppliedJob] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase.from('jobs').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedJobs: JobPosting[] = data.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: 'Partner Company', 
            companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
            salary: 'Negotiable',
            location: 'Sri Lanka / Remote',
            accessibilityBadges: [job.category],
            eligible_for_wheelchair: job.eligible_for_wheelchair,
            eligible_for_deaf: job.eligible_for_deaf,
            eligible_for_blind: job.eligible_for_blind,
            description: `Job category: ${job.category}.`,
            postedDate: new Date(job.created_at).toLocaleDateString(),
            applicantCount: 0
          }));
          setJobs(formattedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = async (jobId: string, jobTitle: string) => {
    setAppliedJob(jobTitle);
    
    try {
      const { data: userData } = await (supabase.auth as any).getUser();
      if (userData?.user) {
        await supabase.from('job_applications').insert([
          {
            job_id: jobId,
            user_id: userData.user.id,
            status: 'PENDING'
          }
        ]);
      }
    } catch (err) {
      console.error('Application error:', err);
    }

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
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading inclusive jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">No inclusive jobs found.</p>
              <p className="text-xs mt-1">Please check back later for new opportunities.</p>
            </div>
          ) : jobs.map((job) => (
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
                {job.accessibilityBadges.map((badge: string, i: number) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-teal-500" />
                    <span>{badge}</span>
                  </span>
                ))}
                {job.eligible_for_wheelchair && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
                    <Accessibility className="w-3 h-3 text-blue-500" />
                    <span>Wheelchair Accessible</span>
                  </span>
                )}
                {job.eligible_for_deaf && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1">
                    <Ear className="w-3 h-3 text-purple-500" />
                    <span>Deaf Friendly</span>
                  </span>
                )}
                {job.eligible_for_blind && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-amber-500" />
                    <span>Blind Friendly</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {job.description}
              </p>

              {/* Apply Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Posted {job.postedDate} • {job.applicantCount} applicants</span>
                <button
                  onClick={() => handleApply(job.id, job.title)}
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
