import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ros2Connection } from "@/lib/ros2Connection";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Navigation } from "lucide-react";

interface ChassisControlProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ChassisControl = ({ isEnabled, isConnected }: ChassisControlProps) => {
  const [speed, setSpeed] = useState([0.5]);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (!isConnected || !isEnabled) return;
    
    ros2Connection.publishChassisControl({
      x_speed: x,
      y_speed: y,
      z_speed: z,
    });
  }, [isConnected, isEnabled]);

  const handleDirectionPress = useCallback((direction: 'forward' | 'backward' | 'left' | 'right') => {
    setActiveDirection(direction);
    const currentSpeed = speed[0];
    
    switch (direction) {
      case 'forward':
        sendControl(currentSpeed, 0, 0);
        break;
      case 'backward':
        sendControl(-currentSpeed, 0, 0);
        break;
      case 'left':
        sendControl(0, currentSpeed, 0);
        break;
      case 'right':
        sendControl(0, -currentSpeed, 0);
        break;
    }
  }, [speed, sendControl]);

  const handleRotationPress = useCallback((direction: 'ccw' | 'cw') => {
    setActiveDirection(direction);
    const currentSpeed = speed[0];
    const zSpeed = currentSpeed * 206.7;
    
    sendControl(0, 0, direction === 'ccw' ? zSpeed : -zSpeed);
  }, [speed, sendControl]);

  const handleRelease = useCallback(() => {
    setActiveDirection(null);
    sendControl(0, 0, 0);
  }, [sendControl]);

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || !isConnected) return;
      
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key) && activeDirection === null) {
        e.preventDefault();
        switch (key) {
          case 'w':
            handleDirectionPress('forward');
            break;
          case 's':
            handleDirectionPress('backward');
            break;
          case 'a':
            handleDirectionPress('left');
            break;
          case 'd':
            handleDirectionPress('right');
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key)) {
        e.preventDefault();
        handleRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, isConnected, activeDirection, handleDirectionPress, handleRelease]);

  const buttonClass = "w-20 h-20 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none";
  const activeClass = "bg-primary text-primary-foreground";
  const inactiveClass = "bg-secondary hover:bg-secondary/80";
  const disabledClass = "opacity-50 cursor-not-allowed";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          底盘控制
        </CardTitle>
        <CardDescription>
          {isEnabled ? "使用方向按钮或键盘 W/S/A/D 控制底盘移动" : "请先启用底盘"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Directional Control Pad */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 rounded-full bg-muted flex items-center justify-center">
            {/* Forward */}
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 ${buttonClass} ${
                activeDirection === 'forward' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleDirectionPress('forward')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleDirectionPress('forward')}
              onTouchEnd={handleRelease}
            >
              <ChevronUp className="w-12 h-12" />
            </div>

            {/* Left */}
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${buttonClass} ${
                activeDirection === 'left' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleDirectionPress('left')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleDirectionPress('left')}
              onTouchEnd={handleRelease}
            >
              <ChevronLeft className="w-12 h-12" />
            </div>

            {/* Right */}
            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${buttonClass} ${
                activeDirection === 'right' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleDirectionPress('right')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleDirectionPress('right')}
              onTouchEnd={handleRelease}
            >
              <ChevronRight className="w-12 h-12" />
            </div>

            {/* Backward */}
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${buttonClass} ${
                activeDirection === 'backward' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleDirectionPress('backward')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleDirectionPress('backward')}
              onTouchEnd={handleRelease}
            >
              <ChevronDown className="w-12 h-12" />
            </div>
          </div>

          {/* Rotation Controls */}
          <div className="flex gap-4">
            <div
              className={`w-24 h-24 ${buttonClass} ${
                activeDirection === 'ccw' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleRotationPress('ccw')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleRotationPress('ccw')}
              onTouchEnd={handleRelease}
            >
              <RotateCcw className="w-10 h-10" />
            </div>

            <div
              className={`w-24 h-24 ${buttonClass} ${
                activeDirection === 'cw' ? activeClass : inactiveClass
              } ${!isEnabled ? disabledClass : ''}`}
              onMouseDown={() => isEnabled && handleRotationPress('cw')}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={() => isEnabled && handleRotationPress('cw')}
              onTouchEnd={handleRelease}
            >
              <RotateCw className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>移动速度 (m/s)</Label>
            <span className="text-sm font-medium">{speed[0].toFixed(2)} m/s</span>
          </div>
          <Slider
            value={speed}
            onValueChange={setSpeed}
            max={2}
            min={0}
            step={0.1}
            disabled={!isEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
};
