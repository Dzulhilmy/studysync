"use client";

import { useState, useRef, useEffect } from "react";

export default function AccessibilityMenu() {
  // --- Dragging & Position State ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // --- Accessibility Settings State ---
  const [isOpen, setIsOpen] = useState(false);
  const [textSize, setTextSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Initialize position to bottom-right corner
  useEffect(() => {
    setIsMounted(true);
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    });

    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Apply Accessibility Settings to the DOM ---
  useEffect(() => {
    if (!isMounted) return;
    
    // Apply Text Size
    document.documentElement.style.fontSize = `${textSize}%`;
    
    // Apply High Contrast
    if (highContrast) {
      document.documentElement.style.filter = "contrast(125%) saturate(125%) darken(10%)";
    } else {
      document.documentElement.style.filter = "none";
    }

    // Apply Dyslexia Font
    if (dyslexicFont) {
      document.body.style.fontFamily = "'Comic Sans MS', 'OpenDyslexic', sans-serif";
    } else {
      document.body.style.fontFamily = ""; // Resets to your Tailwind defaults
    }
  }, [textSize, highContrast, dyslexicFont, isMounted]);

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

    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;

      newX = Math.max(10, Math.min(newX, maxX));
      newY = Math.max(10, Math.min(newY, maxY));
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

  const resetSettings = () => {
    setTextSize(100);
    setHighContrast(false);
    setDyslexicFont(false);
  };

  if (!isMounted) return null;

  // Calculate if menu should open upwards or downwards based on Y position
  // so it doesn't get clipped off the screen
  const openUpwards = position.y > window.innerHeight / 2;

  return (
    <div
      ref={menuRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      className={`
        fixed z-[100] flex items-center justify-center
        w-14 h-14 bg-[#2c1810] text-[#faf6ee] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)]
        border border-[rgba(212,168,67,0.2)] select-none
        transition-transform duration-150
        ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab hover:scale-105"}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
    >
      {/* Accessibility Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="4" r="1" />
        <path d="m18 19 1-7-6 1" />
        <path d="m5 8 3-3 5.5 3-2.36 3.5" />
        <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
        <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
      </svg>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className={`a11y-panel absolute right-0 ${
            openUpwards ? "bottom-[calc(100%+12px)]" : "top-[calc(100%+12px)]"
          } w-64 bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] cursor-default p-4 flex flex-col gap-4`}
          onPointerDown={(e) => e.stopPropagation()} // Prevents dragging when interacting with menu
        >
          <div className="flex items-center justify-between border-b border-[#f0e9d6] pb-2">
            <h3 className="text-[#1a1209] font-serif font-bold text-lg">Accessibility</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#7a6a52] hover:text-[#c0392b] text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Text Size Control */}
          <div>
            <span className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2">
              Text Size ({textSize}%)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setTextSize((prev) => Math.max(80, prev - 10))}
                className="flex-1 py-1 bg-[#f0e9d6] border border-[#c8b89a] rounded-sm text-[#1a1209] font-bold hover:bg-[#e6ddc5] transition-colors"
              >
                A-
              </button>
              <button
                onClick={() => setTextSize((prev) => Math.min(150, prev + 10))}
                className="flex-1 py-1 bg-[#f0e9d6] border border-[#c8b89a] rounded-sm text-[#1a1209] font-bold hover:bg-[#e6ddc5] transition-colors"
              >
                A+
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#1a1209] font-semibold">High Contrast</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="accent-[#d4a843] w-4 h-4 cursor-pointer"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#1a1209] font-semibold">Dyslexia Font</span>
              <input
                type="checkbox"
                checked={dyslexicFont}
                onChange={(e) => setDyslexicFont(e.target.checked)}
                className="accent-[#d4a843] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSettings}
            className="w-full mt-2 py-2 text-xs font-mono text-[#c0392b] border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] hover:bg-[rgba(192,57,43,0.1)] rounded-sm transition-colors uppercase tracking-widest"
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}