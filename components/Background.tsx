
import { type FC } from 'react';
import { motion } from 'framer-motion';

export const Background: FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Light Mode Blobs */}
      <div className="absolute top-0 left-0 w-full h-full opacity-60 dark:opacity-[0.12] transition-opacity duration-700">
        {/* Mobile: w-32 h-32, Tablet: w-64 h-64, Desktop: w-96 h-96 */}
        <div className="absolute top-[-10%] left-[-10%] w-32 h-32 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-sand-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-32 h-32 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[10%] right-[10%] w-32 h-32 sm:w-56 sm:h-56 md:w-80 md:h-80 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000"></div>
      </div>

      {/* Dark Mode Specific Blobs (Subtle Cool Tones) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0 dark:opacity-[0.38] transition-opacity duration-700">
         <div className="absolute top-[20%] left-[10%] w-32 h-32 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-indigo-900 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
         <div className="absolute bottom-[20%] right-[10%] w-32 h-32 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-stone-800 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Noise Texture Overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};
