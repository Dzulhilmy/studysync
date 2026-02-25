"use client";

import { useState, useEffect, SetStateAction } from 'react';
import { Accessibility, Type, Palette, BookOpen, Search } from 'lucide-react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Settings States
  const [textSize, setTextSize] = useState(100); // percentage
  const [contrast, setContrast] = useState('default'); // default, grayscale, invert
  const [readingGuide, setReadingGuide] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [mouseY, setMouseY] = useState(0);

  // 1. Handle "Light Laser" / Reading Guide Tracking
  useEffect(() => {
    const handleMouseMove = (e: { clientY: SetStateAction<number>; }) => setMouseY(e.clientY);
    if (readingGuide) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingGuide]);

  // 2. Apply Accessibility Styles to the DOM
  useEffect(() => {
    // Apply Text Size (Scales all Tailwind rem values!)
    document.documentElement.style.fontSize = `${textSize}%`;
    
    // Apply Dyslexia Font (Comic Sans is highly readable for dyslexia)
    if (dyslexiaFont) {
      document.body.style.fontFamily = '"Comic Sans MS", "Comic Sans", cursive';
    } else {
      document.body.style.fontFamily = ''; // Reverts to your default
    }

    // Apply Contrast/Color Blind Modes
    document.documentElement.classList.remove('grayscale', 'invert');
    if (contrast === 'grayscale') document.documentElement.classList.add('grayscale');
    if (contrast === 'invert') document.documentElement.classList.add('invert');

  }, [textSize, contrast, dyslexiaFont]);

  return (
    <>
      {/* --- THE READING GUIDE ("LIGHT LASER") --- */}
      {readingGuide && (
        <div 
          className="fixed left-0 w-full h-12 bg-yellow-300/20 pointer-events-none z-[9998] border-y-2 border-yellow-400 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all duration-75"
          style={{ top: `${mouseY - 24}px` }}
        />
      )}

      {/* --- THE FLOATING BUTTON --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-[#2c1810] text-[#faf6ee] p-4 rounded-full shadow-2xl hover:bg-orange-700 transition flex items-center justify-center outline-none focus:ring-4 focus:ring-orange-400 cursor-pointer"
        aria-label="Accessibility Menu"
      >
        <Accessibility size={28} />
      </button>

      {/* --- THE MENU PANEL --- */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] bg-white border-2 border-[#2c1810] rounded-2xl shadow-2xl w-80 p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Accessibility size={20} /> Accessibility
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-500 font-bold">X</button>
          </div>

          {/* Text Size Control */}
          <div>
            <label className="flex items-center gap-2 font-bold text-sm text-gray-700 mb-3">
              <Type size={16} /> Text Size
            </label>
            <div className="flex gap-2">
              <button onClick={() => setTextSize(100)} className={`flex-1 py-2 rounded-lg font-bold ${textSize === 100 ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Normal</button>
              <button onClick={() => setTextSize(120)} className={`flex-1 py-2 rounded-lg font-bold ${textSize === 120 ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Large</button>
              <button onClick={() => setTextSize(140)} className={`flex-1 py-2 rounded-lg font-bold ${textSize === 140 ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>XL</button>
            </div>
          </div>

          {/* Color Profiles */}
          <div>
            <label className="flex items-center gap-2 font-bold text-sm text-gray-700 mb-3">
              <Palette size={16} /> Color & Contrast
            </label>
            <div className="flex gap-2">
              <button onClick={() => setContrast('default')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${contrast === 'default' ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Standard</button>
              <button onClick={() => setContrast('grayscale')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${contrast === 'grayscale' ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Grayscale</button>
              <button onClick={() => setContrast('invert')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${contrast === 'invert' ? 'bg-[#2c1810] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Invert</button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setReadingGuide(!readingGuide)}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition ${readingGuide ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2"><Search size={18} /> Reading Guide</span>
              <span className="text-xs">{readingGuide ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              onClick={() => setDyslexiaFont(!dyslexiaFont)}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition ${dyslexiaFont ? 'bg-blue-100 text-blue-800 border-2 border-blue-400' : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2"><BookOpen size={18} /> Dyslexia Font</span>
              <span className="text-xs">{dyslexiaFont ? 'ON' : 'OFF'}</span>
            </button>
          </div>

        </div>
      )}
    </>
  );
}