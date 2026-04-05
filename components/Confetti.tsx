import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Confetti = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-2 h-2 rounded-full"
          initial={{ x: Math.random() * windowSize.width, y: -20, opacity: 1 }}
          animate={{ y: windowSize.height + 20, rotate: 360 }}
          transition={{ duration: Math.random() * 2 + 3, delay: Math.random() * 2 }}
          style={{ backgroundColor: ['#FFC700', '#FF0000', '#2E3192', '#41BBC7'][Math.floor(Math.random() * 4)] }}
        />
      ))}
    </div>
  );
};