"use client";

import { useState, useEffect, useRef } from "react";
import { Accessibility, Type, Palette, BookOpen, Search } from "lucide-react";

export default function AccessibilityMenu() {
  // --- Dragging & Position State ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // --- Accessibility Settings State ---
  const [isOpen, setIsOpen] = useState(false);
  const [textSize, setTextSize] = useState(100); // percentage
  const [contrast, setContrast] = useState("default"); // default, grayscale, invert
  const [readingGuide, setReadingGuide] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [mouseY, setMouseY] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 1. Initialize position to bottom-right corner
  useEffect(() => {
    setIsMounted(true);
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    });

    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 70), // Keep on screen
        y: Math.min(prev.y, window.innerHeight - 70),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Handle "Light Laser" / Reading Guide Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMouseY(e.clientY);
    if (readingGuide) {
      window.addEventListener("mousemove", handleMouseMove);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [readingGuide]);

  // 3. Apply Accessibility Styles to the DOM
  useEffect(() => {
    if (!isMounted) return;

    // Apply Text Size
    document.documentElement.style.fontSize = `${textSize}%`;

    // Apply Dyslexia Font
    if (dyslexiaFont) {
      document.body.style.fontFamily = '"Comic Sans MS", "Comic Sans", cursive';
    } else {
      document.body.style.fontFamily = ""; // Reverts to your default
    }

    // Apply Contrast Modes
    document.documentElement.classList.remove("grayscale", "invert");
    if (contrast === "grayscale")
      document.documentElement.classList.add("grayscale");
    if (contrast === "invert") document.documentElement.classList.add("invert");
  }, [textSize, contrast, dyslexiaFont, isMounted]);

  // --- Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging if clicking inside the open menu panel
    if ((e.target as HTMLElement).closest(".a11y-panel")) return;

    setIsDragging(true);
    setHasMoved(false);
    const rect = menuRef.current?.getBoundingClientRect();

    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setHasMoved(true);

    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;

    // Keep within screen bounds
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 16; // 16px padding from edges
      const maxY = window.innerHeight - rect.height - 16;

      newX = Math.max(16, Math.min(newX, maxX));
      newY = Math.max(16, Math.min(newY, maxY));
    }

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if we are dragging or clicking inside the panel
    if (hasMoved || (e.target as HTMLElement).closest(".a11y-panel")) return;
    setIsOpen(!isOpen);
  };

  // Don't render until mounted to prevent hydration errors
  if (!isMounted) return null;

  // Calculate dynamic panel positioning based on button location
  const openUpwards = position.y > window.innerHeight / 2;
  const openLeftwards = position.x > window.innerWidth / 2;

  return (
    <>
      {/* --- THE READING GUIDE ("LIGHT LASER") --- */}
      {readingGuide && (
        <div
          className="fixed left-0 w-full h-12 bg-yellow-300/20 pointer-events-none z-[9998] border-y-2 border-yellow-400 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all duration-75"
          style={{ top: `${mouseY - 24}px` }}
        />
      )}

      {/* --- THE FLOATING DRAGGABLE CONTAINER --- */}
      <div
        ref={menuRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        className="fixed z-[9999] select-none touch-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* The Toggle Button */}
        <button
          className={`
            w-14 h-14 shrink-0 bg-[#2c1810] text-[#faf6ee] rounded-full shadow-2xl transition-transform duration-150
            flex items-center justify-center outline-none focus:ring-4 focus:ring-orange-400
            ${isDragging ? "cursor-grabbing scale-105 bg-orange-800" : "cursor-grab hover:bg-orange-700 hover:scale-105"}
            `}
          aria-label="Accessibility Menu"
        >
          <Accessibility size={28} />
        </button>

        {/* --- THE MENU PANEL (Armor-plated to prevent global CSS leaks) --- */}
        {isOpen && (
          <div 
            className={`
              a11y-panel absolute !w-80 shrink-0 !p-6 !bg-white !border-2 !border-[#2c1810] !rounded-2xl !shadow-2xl !flex !flex-col !gap-6 cursor-default !text-left !font-sans !box-border
              animate-in slide-in-from-bottom-5
              ${openUpwards ? "bottom-[calc(100%+16px)]" : "top-[calc(100%+16px)]"}
              ${openLeftwards ? "right-0" : "left-0"}
            `}
            onPointerDown={(e) => e.stopPropagation()} 
          >
            <div className="!flex !items-center !justify-between !border-b !pb-3">
              <h2 className="!text-xl !font-bold !text-gray-900 !flex !items-center !gap-2 !m-0">
                <Accessibility size={20} /> Accessibility
              </h2>
              <button onClick={() => setIsOpen(false)} className="!text-gray-500 hover:!text-red-500 !font-bold !text-xl !leading-none !bg-transparent !border-none !p-0">×</button>
            </div>

            {/* Text Size Control */}
            <div className="!m-0 !p-0">
              <label className="!flex !items-center !gap-2 !font-bold !text-sm !text-gray-700 !mb-3">
                <Type size={16} /> Text Size
              </label>
              <div className="!flex !gap-2">
                <button onClick={() => setTextSize(100)} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-sm !border-none ${textSize === 100 ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>Normal</button>
                <button onClick={() => setTextSize(120)} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-sm !border-none ${textSize === 120 ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>Large</button>
                <button onClick={() => setTextSize(140)} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-sm !border-none ${textSize === 140 ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>XL</button>
              </div>
            </div>

            {/* Color Profiles */}
            <div className="!m-0 !p-0">
              <label className="!flex !items-center !gap-2 !font-bold !text-sm !text-gray-700 !mb-3">
                <Palette size={16} /> Color & Contrast
              </label>
              <div className="!flex !gap-2">
                <button onClick={() => setContrast('default')} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-xs !border-none ${contrast === 'default' ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>Standard</button>
                <button onClick={() => setContrast('grayscale')} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-xs !border-none ${contrast === 'grayscale' ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>Grayscale</button>
                <button onClick={() => setContrast('invert')} className={`!flex-1 !py-2 !px-0 !rounded-lg !font-bold !text-xs !border-none ${contrast === 'invert' ? '!bg-[#2c1810] !text-white' : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'}`}>Invert</button>
              </div>
            </div>

            {/* Toggles */}
            <div className="!flex !flex-col !gap-3 !m-0 !p-0">
              <button 
                onClick={() => setReadingGuide(!readingGuide)}
                className={`!w-full !flex !items-center !justify-between !p-3 !rounded-xl !font-bold transition-colors ${readingGuide ? '!bg-yellow-100 !text-yellow-800 !border-2 !border-yellow-400' : '!bg-gray-50 !text-gray-700 !border-2 !border-transparent hover:!bg-gray-100'}`}
              >
                <span className="!flex !items-center !gap-2 !text-sm"><Search size={18} /> Reading Guide</span>
                <span className="!text-xs">{readingGuide ? 'ON' : 'OFF'}</span>
              </button>

              <button 
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
                className={`!w-full !flex !items-center !justify-between !p-3 !rounded-xl !font-bold transition-colors ${dyslexiaFont ? '!bg-blue-100 !text-blue-800 !border-2 !border-blue-400' : '!bg-gray-50 !text-gray-700 !border-2 !border-transparent hover:!bg-gray-100'}`}
              >
                <span className="!flex !items-center !gap-2 !text-sm"><BookOpen size={18} /> Dyslexia Font</span>
                <span className="!text-xs">{dyslexiaFont ? 'ON' : 'OFF'}</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
