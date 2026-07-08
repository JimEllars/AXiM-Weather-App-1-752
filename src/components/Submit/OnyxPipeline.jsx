import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const PIPELINE_STEPS = [
  { id: 'ingest', label: 'Ingest & Metadata Strip', icon: FiIcons.FiShield },
  { id: 'safety', label: 'Safety & Guardrail Filter', icon: FiIcons.FiEye },
  { id: 'weather', label: 'Onyx Weather Classification', icon: FiIcons.FiCpu },
  { id: 'radar', label: 'Radar Cross-Verification', icon: FiIcons.FiMap },
];

const OnyxPipeline = ({ isProcessing, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (!isProcessing) return;

    let currentStep = 0;
    setCompletedSteps([]);

    const interval = setInterval(() => {
      setCompletedSteps(prev => [...prev, PIPELINE_STEPS[currentStep].id]);
      currentStep++;
      
      if (currentStep < PIPELINE_STEPS.length) {
        setActiveStep(currentStep);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // Simulate 80% approval rate
          const isApproved = Math.random() > 0.2;
          onComplete(
            isApproved 
              ? { 
                  success: true, 
                  title: 'Auto-Approved & Published', 
                  message: 'Onyx verified this submission (Confidence: 94%). It is now live on the Spotter Network map.'
                }
              : {
                  success: false,
                  title: 'Flagged for Human Review',
                  message: 'Radar cross-verification returned low confidence for this event. Placed in review queue.'
                }
          );
        }, 500);
      }
    }, 1200); // 1.2s per step to simulate processing

    return () => clearInterval(interval);
  }, [isProcessing, onComplete]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Onyx AI Workflow</h3>
        {isProcessing && <span className="text-xs text-axim-accent animate-pulse font-mono">Processing...</span>}
      </div>

      <div className="space-y-3">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = index === activeStep && isProcessing;
          const isPending = !isCompleted && !isActive;

          return (
            <div key={step.id} className={`
              flex items-center gap-4 p-3 rounded-lg border transition-all duration-300
              ${isCompleted ? 'bg-axim-success/10 border-axim-success/30' : ''}
              ${isActive ? 'bg-axim-accent/10 border-axim-accent shadow-[0_0_10px_rgba(0,229,255,0.2)]' : ''}
              ${isPending ? 'bg-slate-800/30 border-slate-700/50 opacity-50' : ''}
            `}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${isCompleted ? 'bg-axim-success text-slate-900' : ''}
                ${isActive ? 'bg-axim-accent text-slate-900' : ''}
                ${isPending ? 'bg-slate-700 text-slate-400' : ''}
              `}>
                {isCompleted ? <SafeIcon icon={FiIcons.FiCheck} /> : <SafeIcon icon={step.icon} />}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium text-sm ${isActive ? 'text-axim-accent' : 'text-slate-200'}`}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: 'linear' }}
                    className="h-1 bg-axim-accent mt-2 rounded-full"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnyxPipeline;