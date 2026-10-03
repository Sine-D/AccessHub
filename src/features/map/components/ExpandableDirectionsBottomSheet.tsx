import React, { useState } from 'react';
import type { AccessibleDirectionsResponse } from '../../../services/directionsController';
import { PolylineRenderer } from './PolylineRenderer';
import { startContinuousVoiceNavigation, stopContinuousVoiceNavigation, isNavigatingSpeaking } from '../../../services/navigationSpeechService';
import { Volume2, VolumeX, ChevronUp, ChevronDown, ShieldCheck, MapPin, AlertCircle, Compass } from 'lucide-react';

interface ExpandableDirectionsBottomSheetProps {
  directions: AccessibleDirectionsResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpandableDirectionsBottomSheet: React.FC<ExpandableDirectionsBottomSheetProps> = ({
  directions,
  isOpen,
  onClose,
}) => {
  const [expandedState, setExpandedState] = useState<'collapsed' | 'expanded' | 'full'>('expanded');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  if (!isOpen || !directions) return null;

  const toggleExpand = () => {
    if (expandedState === 'collapsed') setExpandedState('expanded');
    else if (expandedState === 'expanded') setExpandedState('full');
    else setExpandedState('collapsed');
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopContinuousVoiceNavigation();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      startContinuousVoiceNavigation(directions.steps, (_, idx) => {
        setActiveStepIndex(idx);
      });
    }
  };

  const heightClasses =
    expandedState === 'collapsed'
      ? 'h-24'
      : expandedState === 'expanded'
      ? 'h-[65vh]'
      : 'h-[92vh]';

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 flex flex-col rounded-t-3xl border-t border-blue-200 bg-white shadow-2xl transition-all duration-300 dark:border-blue-900 dark:bg-slate-900 ${heightClasses}`}
      role="region"
      aria-label="Expandable directions bottom sheet"
    >
      {/* Drag / Expand Handle Touch Target (Min height 48dp / 48px) */}
      <button
        type="button"
        onClick={toggleExpand}
        className="flex min-h-12 w-full items-center justify-center border-b border-slate-100 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800"
        aria-label={`Directions sheet ${expandedState}. Click to toggle expansion.`}
      >
        <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="sr-only">Toggle drawer size</span>
      </button>

      {/* Sheet Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header Title & Actions */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Step-Free Polyline Navigation
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distance: <span className="font-bold text-blue-600">{directions.totalDistanceMeters}m</span> • Est: <span className="font-bold text-emerald-600">~{directions.totalDurationMinutes} mins</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Continuous Voice Navigation Toggle */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`flex min-h-12 min-w-12 items-center justify-center rounded-2xl border px-3 text-xs font-extrabold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSpeaking
                  ? 'border-emerald-500 bg-emerald-600 text-white animate-pulse'
                  : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              aria-label={isSpeaking ? 'Stop continuous voice guidance' : 'Start continuous voice guidance'}
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-4 text-xs font-extrabold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Network Offline Graceful Fallback Banner */}
        {directions.isOfflineFallback && (
          <div className="flex items-center space-x-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Network coverage offline. Showing cached text directions fallback.</span>
          </div>
        )}

        {/* High-Contrast Polyline Canvas View */}
        {expandedState !== 'collapsed' && (
          <PolylineRenderer
            points={directions.polylinePoints}
            color={directions.profileFlags.wheelchairAccessible ? '#2563eb' : '#059669'}
          />
        )}

        {/* Closest Step-Free Transit Drop-offs & Parking Bays */}
        {expandedState !== 'collapsed' && directions.closestDropoffs.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 mb-2">
              🚗 Closest Step-Free Transit Drop-Offs & Parking:
            </p>
            <div className="space-y-2">
              {directions.closestDropoffs.map((drop) => (
                <div key={drop.id} className="flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-100">
                  <span className="font-bold">📍 {drop.name}</span>
                  <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                    {drop.distanceMeters}m away
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Directions Cards (AC-233 - Large Touch Targets >= 48dp) */}
        {expandedState !== 'collapsed' && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              Turn-by-Turn Accessible Text Steps:
            </p>

            {directions.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`min-h-12 rounded-2xl border p-4 transition-all ${
                  activeStepIndex === idx
                    ? 'border-blue-500 bg-blue-50/90 dark:border-blue-700 dark:bg-blue-950/50'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-850'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {step.instruction}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      📏 {step.distanceMeters}m • Incline Slope: {step.slopeGradientPercent}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

