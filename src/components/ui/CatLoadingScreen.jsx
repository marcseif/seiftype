import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CatLoadingScreen() {
  const [loadingText, setLoadingText] = useState('Waking up the cats...');

  useEffect(() => {
    const texts = [
      'Waking up the cats...',
      'Pouring coffee...',
      'Loading themes...',
      'Preparing your keyboard...',
      'Almost there...',
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg, #0d0d0d)' }}
    >
      <div className="w-64 relative mb-4 h-16">
        {/* Cat walking animation */}
        <motion.div
          animate={{ 
            left: ["0%", "calc(100% - 36px)"]
          }}
          transition={{ 
            duration: 3, 
            ease: "linear"
          }}
          className="absolute bottom-4 z-10 text-4xl -ml-2"
          style={{ originX: 0.5, width: "max-content" }}
        >
          🐈
        </motion.div>
        
        {/* The loading bar track */}
        <div className="absolute bottom-0 w-full h-3 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: 'var(--color-surface, #262626)' }}>
          {/* Animated fill */}
          <motion.div 
            className="h-full absolute left-0 top-0"
            style={{ backgroundColor: 'var(--color-primary, #ff00ff)' }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 3,
              ease: "linear"
            }}
          />
        </div>
      </div>
      
      <div className="h-6 mt-4 flex items-center justify-center">
        <motion.p 
          key={loadingText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-sm font-medium tracking-wide" 
          style={{ color: 'var(--color-text-secondary, #b3b3b3)' }}
        >
          {loadingText}
        </motion.p>
      </div>
    </motion.div>
  );
}