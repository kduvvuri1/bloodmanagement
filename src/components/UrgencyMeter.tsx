interface UrgencyMeterProps {
  level: 1 | 2 | 3 | 4 | 5;
  size?: "sm" | "md" | "lg";
}

export function UrgencyMeter({ level, size = "md" }: UrgencyMeterProps) {
  const sizeClasses = {
    sm: { box: "w-12 h-12", thickness: 2, gap: 1 },
    md: { box: "w-16 h-16", thickness: 6, gap: 1 },
    lg: { box: "w-20 h-20", thickness: 10, gap: 2 },
  };

  const config = sizeClasses[size];
  const segmentHeight = `calc((100% - ${config.thickness}px - ${config.gap * 4}px) / 7)`;

  return (
    <div className={`${config.box} bg-[#D72638] rounded flex items-center justify-center relative`}>
      {/* Vertical bar of the plus sign (5 segments) */}
      <div 
        className="absolute flex flex-col items-center justify-center h-full"
        style={{ width: `${config.thickness}px`, gap: `${config.gap}px` }}
      >
        {/* Top 2 segments */}
        <div 
          style={{ height: segmentHeight }}
          className={`w-full transition-colors duration-300 ${level >= 5 ? 'bg-white' : 'bg-gray-400'}`}
        />
        <div 
          style={{ height: segmentHeight }}
          className={`w-full transition-colors duration-300 ${level >= 4 ? 'bg-white' : 'bg-gray-400'}`}
        />
        
        {/* Middle segment (part of horizontal bar) */}
        <div 
          style={{ height: `${config.thickness}px` }}
          className={`w-full transition-colors duration-300 ${level >= 3 ? 'bg-white' : 'bg-gray-400'}`}
        />
        
        {/* Bottom 2 segments */}
        <div 
          style={{ height: segmentHeight }}
          className={`w-full transition-colors duration-300 ${level >= 2 ? 'bg-white' : 'bg-gray-400'}`}
        />
        <div 
          style={{ height: segmentHeight }}
          className={`w-full transition-colors duration-300 ${level >= 1 ? 'bg-white' : 'bg-gray-400'}`}
        />
      </div>

      {/* Horizontal bar of the plus sign */}
      <div 
        className={`absolute transition-colors duration-300 ${level >= 3 ? 'bg-white' : 'bg-gray-400'}`}
        style={{ 
          width: '60%', 
          height: `${config.thickness}px`
        }}
      />
    </div>
  );
}