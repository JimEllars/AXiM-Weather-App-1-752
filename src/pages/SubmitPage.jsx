import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import OnyxPipeline from '../components/Submit/OnyxPipeline';

const SubmitPage = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > 1920 || height > 1920) {
            if (width > height) {
              height *= 1920 / width;
              width = 1920;
            } else {
              width *= 1920 / height;
              height = 1920;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              const resizedUrl = URL.createObjectURL(blob);
              setFile(resizedUrl);
              simulateUpload();
            }, selected.type);
          } else {
            setFile(URL.createObjectURL(selected));
            simulateUpload();
          }
        };
        img.src = URL.createObjectURL(selected);
      } else {
        setFile(URL.createObjectURL(selected));
        simulateUpload();
      }
    }
  };

  const simulateUpload = () => {
    setIsProcessing(true);
    setResult(null);
    // Simulation logic is handled inside OnyxPipeline component
  };

  const handlePipelineComplete = (outcome) => {
    setIsProcessing(false);
    setResult(outcome);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-axim-dark to-slate-900">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SafeIcon icon={FiIcons.FiCamera} className="text-axim-accent" />
            Media Submission
          </h1>
          <p className="text-slate-400 mt-2">
            Upload incident photos or video. Submissions are processed by Onyx AI for rapid verification and mapping.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-12 border-dashed border-2 border-slate-700 hover:border-axim-accent transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative"
            >
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <SafeIcon icon={FiIcons.FiUploadCloud} className="text-4xl text-axim-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tap to Upload Media</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Photos and short videos are auto-tagged with your exact location and timestamp.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="glass-panel p-4 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-slate-900 rounded-lg overflow-hidden relative border border-slate-700">
                  <img src={file} alt="Preview" className="w-full h-full object-cover opacity-60" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-axim-accent/10 flex items-center justify-center">
                      <div className="w-[120%] h-1 bg-axim-accent/50 shadow-[0_0_15px_#00E5FF] absolute top-1/2 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 w-full">
                  <OnyxPipeline 
                    isProcessing={isProcessing} 
                    onComplete={handlePipelineComplete} 
                  />
                </div>
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-panel p-6 border-l-4 ${result.success ? 'border-l-axim-success' : 'border-l-axim-danger'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${result.success ? 'bg-axim-success/20 text-axim-success' : 'bg-axim-danger/20 text-axim-danger'}`}>
                      <SafeIcon icon={result.success ? FiIcons.FiCheckCircle : FiIcons.FiAlertOctagon} className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{result.title}</h3>
                      <p className="text-slate-300 mt-1">{result.message}</p>
                      <button 
                        onClick={reset}
                        className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Submit Another
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SubmitPage;