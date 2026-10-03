import React, { useState, useEffect, useRef } from 'react';
import type { MapPin } from '../../../core/types/models';
import {
  calculateAccessibleRoute,
  RouteType,
  RoutePreviewResult,
} from '../../../services/routeService';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { Volume2, Navigation, ShieldCheck, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface StepFreeRouteModalProps {
  place: MapPin;
  isOpen: boolean;
  onClose: () => void;
}

export const StepFreeRouteModal: React.FC<StepFreeRouteModalProps> = ({
  place,
  isOpen,
  onClose,
}) => {
  const { speakText } = useAccessibility();
  const [routeMode, setRouteMode] = useState<RouteType>('step_free_wheelchair');
  const [routeResult, setRouteResult] = useState<RoutePreviewResult | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && place) {
      const result = calculateAccessibleRoute(place, routeMode);
      setRouteResult(result);
    }
  }, [isOpen, place, routeMode]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !routeResult) return null;

  const handleSpeakStep = (audioText: string, stepId: string) => {
    setActiveStepId(stepId);
    speakText(audioText);
  };

  const handleSpeakAll = () => {
    const fullText = `Route preview to ${place.title}. ${routeResult.summary.totalDistanceMeters} meters, estimated ${routeResult.summary.totalDurationMinutes} minutes. ${routeResult.steps.map((s) => s.audioCueText).join(' ')}`;
    speakText(fullText);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-blue-200 bg-white shadow-2xl focus:outline-none dark:border-blue-900 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h2 id="route-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                Step-Free & Tactile Route Preview (AC-230)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Destination: <span className="font-bold text-blue-600 dark:text-blue-400">{place.title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close route preview modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Route Mode Switcher Tabs */}
        <div className="bg-slate-50 p-4 dark:bg-slate-950/60">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/80 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setRouteMode('step_free_wheelchair')}
              className={`flex min-h-11 items-center justify-center space-x-2 rounded-xl px-4 text-xs font-extrabold transition-all ${
                routeMode === 'step_free_wheelchair'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-300/60 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              aria-selected={routeMode === 'step_free_wheelchair'}
              role="tab"
            >
              <span>♿ Step-Free Wheelchair Route</span>
            </button>

            <button
              type="button"
              onClick={() => setRouteMode('tactile_paving_audio')}
              className={`flex min-h-11 items-center justify-center space-x-2 rounded-xl px-4 text-xs font-extrabold transition-all ${
                routeMode === 'tactile_paving_audio'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-300/60 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              aria-selected={routeMode === 'tactile_paving_audio'}
              role="tab"
            >
              <span>🦯 Tactile & Audio Route</span>
            </button>
          </div>
        </div>

        {/* Route Summary Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Distance</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {routeResult.summary.totalDistanceMeters} m
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Est. Time</p>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              ~{routeResult.summary.totalDurationMinutes} mins
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Step-Free Score</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {routeResult.summary.stepFreeScorePercentage}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Tactile Coverage</p>
            <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">
              {routeResult.summary.tactileCoveragePercentage}%
            </p>
          </div>
        </div>

        {/* Voice Readout Banner Button */}
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={handleSpeakAll}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-xs font-extrabold text-white shadow-md transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Volume2 className="h-4 w-4 animate-pulse" />
            <span>Read Entire Route Directions (Voice Guidance)</span>
          </button>
        </div>

        {/* Turn-by-Turn Steps Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            Turn-by-Turn Navigation Steps ({routeResult.steps.length}):
          </p>

          {routeResult.steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 transition-all ${
                activeStepId === step.id
                  ? 'border-blue-500 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/40'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {step.stepNumber}
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {step.instruction}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        📏 {step.distanceMeters} m
                      </span>

                      {step.slopeGradientPercent !== undefined && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          📐 Slope: {step.slopeGradientPercent}%
                        </span>
                      )}

                      {step.hasRamp && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✓ Ramp Access
                        </span>
                      )}

                      {step.hasElevator && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          🛗 Elevator Node
                        </span>
                      )}

                      {step.tactileSurfaceType && (
                        <span className="rounded-md bg-teal-100 px-2 py-0.5 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          🦯 {step.tactileSurfaceType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeakStep(step.audioCueText, step.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                  aria-label={`Listen to step ${step.stepNumber} audio cue`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Accessible Route (AC-230)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

