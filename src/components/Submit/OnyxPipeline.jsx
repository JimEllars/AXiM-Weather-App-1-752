import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STEPS = [
  { id: 'ingest', label: 'Ingest & Metadata Strip', icon: FiIcons.FiShield },
  { id: 'safety', label: 'Safety & Guardrail Filter', icon: FiIcons.FiEye },
  { id: 'weather', label: 'Onyx Weather Classification', icon: FiIcons.FiCpu },
  { id: 'radar', label: 'Radar Cross-Verification', icon: FiIcons.FiMap },
];

const OnyxPipeline = ({ isProcessing, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isProcessing) return;

    setCompletedSteps([]);
    setActiveStep(0);

    const runPipeline = async () => {
      // We will do a local mock animation to simulate the backend processing
      // and then wait for the supabase response to finish it off.
      let currentStep = 0;
      
      const interval = setInterval(() => {
        setCompletedSteps(prev => [...prev, PIPELINE_STEPS[currentStep].id]);
        currentStep++;
        if (currentStep < PIPELINE_STEPS.length) {
          setActiveStep(currentStep);
        } else {
          clearInterval(interval);
        }
      }, 800);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase.functions.invoke('onyx-pipeline', {
          body: { mediaUrl: 'uploaded-file-url-placeholder' },
          headers: session?.access_token ? {
            Authorization: `Bearer ${session.access_token}`
          } : undefined
        });

        clearInterval(interval);

        // Handle 401 Unauthorized explicitly
        if (error && error.context?.status === 401) {
          navigate('/login');
          return;
        }

        // Mark all steps complete
        setCompletedSteps(PIPELINE_STEPS.map(s => s.id));
        setActiveStep(PIPELINE_STEPS.length);

        if (error) throw error;

        // Wait a short moment for the animation before calling onComplete
        setTimeout(() => {
          onComplete({
            success: data?.approved || false,
            title: data?.approved ? 'Auto-Approved & Published' : 'Flagged for Human Review',
            message: data?.message || (data?.approved ? 'Onyx verified this submission. It is now live on the Spotter Network map.' : 'Radar cross-verification returned low confidence for this event. Placed in review queue.')
          });
        }, 500);

      } catch (err) {
        clearInterval(interval);

        if (err.status === 401 || err.message?.includes('Unauthorized')) {
          navigate('/login');
          return;
        }

        setCompletedSteps(PIPELINE_STEPS.map(s => s.id));
        setActiveStep(PIPELINE_STEPS.length);

        setTimeout(() => {
          onComplete({
            success: false,
            title: 'Processing Failed',
            message: 'Unable to connect to Onyx AI pipeline. Please try again later.'
          });
        }, 500);
      }
    };

    runPipeline();

  }, [isProcessing, onComplete, navigate]);

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
                    transition={{ duration: 0.8, ease: 'linear' }}
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
