import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  const logoUrl = "https://i.ibb.co/qLkMSD9n/Screenshot-20260211-190854-com-android-gallery3d.webp";

  return (
    <div className={`relative flex items-center justify-center ${className} group`}>
      {/* Premium Outer Ring / Squircle Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-white rounded-[32%] rotate-[5deg] shadow-lg shadow-rose-200/30 group-hover:rotate-[10deg] transition-transform duration-700 border border-white" />
      
      {/* Logo Image Container */}
      <div className="relative z-10 w-full h-full rounded-[30%] overflow-hidden border-2 border-white shadow-inner bg-white">
        <img 
          src={logoUrl} 
          alt="Nestly Logo" 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 rounded-[30%] pointer-events-none" />
    </div>
  );
};