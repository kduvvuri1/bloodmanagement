//Navbar.tsx
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

interface NavbarProps {
  title?: string;
  onLogout?: () => void;
}

export function Navbar({ title = "My Dashboard", onLogout }: NavbarProps) {
  return (
    <div className="border-b border-[#F3F4F6] bg-white px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <span className="text-[#333333]">{title}</span>
        </div>
        {onLogout && (
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-[#333333] hover:text-[#D72638]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
