import { Menu, Battery, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlHeaderProps {
  onMenuClick: () => void;
  isConnected: boolean;
}

export const ControlHeader = ({ onMenuClick, isConnected }: ControlHeaderProps) => {
  return (
    <header className="h-10 flex items-center justify-between px-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
      {/* Left - Menu & Title */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="rounded-lg border border-border/50 h-7 w-7"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-semibold">智驭中枢</h1>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />
            <span className="text-[9px] text-muted-foreground">
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Right - Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Battery className="w-3 h-3" />
          <span className="text-[10px] font-medium">87%</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Thermometer className="w-3 h-3" />
          <span className="text-[10px] font-medium">42°C</span>
        </div>
      </div>
    </header>
  );
};
