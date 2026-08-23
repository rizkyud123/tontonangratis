import React, { useEffect, useRef } from 'react';
import { Megaphone, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdBannerSlotProps {
  code: string;
  enabled: boolean;
  type: 'top' | 'bottom' | 'inline';
  onAdClick?: () => void;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  code,
  enabled,
  type,
  onAdClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !enabled || !code) return;

    // Check if the code contains <script> tags or pure HTML
    if (code.includes('<script')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;
      
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(tempDiv);
    } else {
      containerRef.current.innerHTML = code;
    }
  }, [code, enabled]);

  if (!enabled) return null;

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Megaphone className="w-3 h-3 text-amber-400" />
          Sponsor / Adsterra Slot ({type})
        </span>
        <span className="text-[10px] text-[#71717A]">Iklan Aman</span>
      </div>

      <div
        ref={containerRef}
        onClick={onAdClick}
        className="w-full overflow-hidden transition rounded-xl bg-[#08080C] border border-[#181822]"
      />
    </div>
  );
};
