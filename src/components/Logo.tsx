//Logo.tsx
import { Droplet } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-[#D72638] rounded-full p-2">
        <Droplet className="w-6 h-6 text-white fill-white" />
      </div>
      <span className="text-[#333333]">ForTheGiving</span>
    </div>
  );
}
