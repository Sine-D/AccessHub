import React from 'react';
import { ShieldAlert, RefreshCw, Inbox, AlertTriangle, Lock } from 'lucide-react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

interface LoadingStateProps {
  message?: string;
}

export const AdminLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Admin Hub data...',
}) => {
  const { settings } = useAccessibility();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`p-8 rounded-3xl text-center space-y-3 my-4 border ${
        settings.highContrast
          ? 'bg-black text-yellow-300 border-yellow-300'
          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 shadow-md'
      }`}
    >
      <div className="flex justify-center">
        <RefreshCw className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
      </div>
      <p className="text-sm font-extrabold tracking-tight">{message}</p>
      <span className="text-xs text-slate-400 block font-medium">
        Fetching latest database records and system telemetry...
      </span>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const AdminErrorState: React.FC<ErrorStateProps> = ({
  title = 'System Error Detected',
  message,
  onRetry,
}) => {
  const { settings, speakText } = useAccessibility();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-6 rounded-3xl space-y-3 my-4 border ${
        settings.highContrast
          ? 'bg-black text-red-400 border-red-500'
          : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900 shadow-md'
      }`}
    >
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
        <h4 className="font-extrabold text-sm">{title}</h4>
      </div>
      <p className="text-xs font-medium leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={() => {
            speakText('Retrying network request');
            onRetry();
          }}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all focus:ring-2 focus:ring-red-500"
          aria-label="Retry loading admin data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.FC<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminEmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Queue Items Pending',
  message = 'All administrative verification and moderation requests have been processed.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  const { settings } = useAccessibility();

  return (
    <div
      role="region"
      aria-label={title}
      className={`p-8 rounded-3xl text-center space-y-3 my-4 border border-dashed ${
        settings.highContrast
          ? 'bg-black text-yellow-300 border-yellow-300'
          : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const AdminUnauthorizedState: React.FC = () => {
  const { settings } = useAccessibility();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-8 rounded-3xl text-center space-y-4 my-8 border ${
        settings.highContrast
          ? 'bg-black text-red-400 border-red-500'
          : 'bg-slate-900 text-white border-slate-800 shadow-2xl'
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto ring-4 ring-red-500/10">
        <Lock className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-lg text-white">Access Restricted 🛡️</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          You must be authenticated as a verified Platform Administrator (`role === 'admin'`) to access the Admin Management Hub.
        </p>
      </div>
    </div>
  );
};

