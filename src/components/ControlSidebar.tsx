import { useNavigate } from "react-router-dom";
import { ros2Connection } from "@/lib/ros2Connection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  User, 
  AlertTriangle, 
  Map, 
  Zap, 
  Gamepad2, 
  Monitor, 
  Bot, 
  LogOut,
  X
} from "lucide-react";

interface ControlSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: User, label: "管理员", path: "/admin" },
  { icon: AlertTriangle, label: "故障管理", path: "/faults" },
  { icon: Map, label: "路径规划", path: "/path" },
  { icon: Zap, label: "全自动施工", path: "/auto" },
  { icon: Gamepad2, label: "手动/半自动施工", path: "/control", active: true },
  { icon: Monitor, label: "遥控界面", path: "/remote" },
  { icon: Bot, label: "AI 助手", path: "/ai" },
];

export const ControlSidebar = ({ isOpen, onClose }: ControlSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDisconnect = () => {
    ros2Connection.sendConnectionEstablishRequest(0);
    ros2Connection.disconnect();
    sessionStorage.removeItem("ros2_connected");
    sessionStorage.removeItem("ros2_url");
    toast({
      title: "已断开连接",
      description: "已断开与 ROS2 服务器的连接"
    });
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <span className="font-display text-accent text-sm tracking-wider">MENU</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active 
                  ? 'bg-primary/10 text-primary border border-primary/30' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Disconnect Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            断开连接
          </Button>
        </div>
      </div>
    </>
  );
};
