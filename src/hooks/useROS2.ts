import { useState, useCallback, useEffect } from 'react';
import { ros2Connection } from '@/lib/ros2Connection';
import { useToast } from '@/hooks/use-toast';
// 导入接口类型（与ros2Connection.ts保持一致）
import {
  EnableRequest,
  PumpMessage,
  ChassisControlMessage,
  ArmControlMessage,
  SemiModeRequest,
  StopRequest,
  MachineModeRequest
} from '@/lib/ros2Connection';

export const useROS2 = () => {
  // 核心状态管理
  const [isConnected, setIsConnected] = useState(false);
  const [rosUrl, setRosUrl] = useState('ws://192.168.137.96:9090');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // 监听底层连接状态变化（如意外断开）
  useEffect(() => {
    const handleClose = () => {
      if (isConnected) {
        setIsConnected(false);
        toast({
          title: "连接已断开",
          description: "与ROS2服务器的连接被关闭",
          variant: "destructive",
        });
      }
    };

    // 绑定ros2Connection的关闭事件（假设底层支持on('close')）
    ros2Connection.on('close', handleClose);
    return () => {
      ros2Connection.off('close', handleClose);
    };
  }, [isConnected, toast]);

  // 公共校验：检查是否已连接
  const checkConnection = useCallback(() => {
    if (!isConnected) {
      toast({
        title: "操作失败",
        description: "未连接到ROS2服务器，请先连接",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [isConnected, toast]);

  // 公共校验：URL格式
  const validateUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
        throw new Error("URL必须以ws://或wss://开头");
      }
      return true;
    } catch (err) {
      toast({
        title: "无效的URL",
        description: err instanceof Error ? err.message : "请输入正确的WebSocket地址",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // 连接ROS2服务器
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    if (!validateUrl(rosUrl)) return;

    setIsConnecting(true);
    try {
      // 调用底层连接方法，带超时控制
      const timeout = 10000; // 10秒超时
      const connectPromise = ros2Connection.connect(rosUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`连接超时（${timeout}ms）`)), timeout)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      setIsConnected(true);
      toast({
        title: "连接成功",
        description: `已连接到 ${rosUrl}`,
      });
    } catch (err) {
      toast({
        title: "连接失败",
        description: err instanceof Error ? err.message : "无法连接到ROS2服务器",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [rosUrl, isConnecting, isConnected, validateUrl, toast]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (!isConnected) return;

    ros2Connection.disconnect();
    setIsConnected(false);
    toast({
      title: "已断开连接",
      description: "成功关闭与ROS2服务器的连接",
    });
  }, [isConnected, toast]);

  // 1. 连接建立/关闭服务
  const sendConnectionEstablish = useCallback((establish: number) => {
    if (!checkConnection()) return;

    ros2Connection.sendConnectionEstablishRequest(establish);
    toast({
      title: "指令已发送",
      description: establish === 1 ? "开机指令已发送" : "关机指令已发送",
    });
  }, [checkConnection, toast]);

  // 2. 底盘使能服务
  const sendChassisEnable = useCallback((motorCmd: number) => {
    if (!checkConnection()) return;

    ros2Connection.sendChassisEnableRequest(motorCmd);
    const desc = motorCmd === 1 ? "使能" : motorCmd === 0 ? "未使能" : "紧急故障";
    toast({
      title: "底盘指令已发送",
      description: `底盘状态：${desc}`,
    });
  }, [checkConnection, toast]);

  // 3. 机械臂使能服务
  const sendArmEnable = useCallback((motorCmd: number) => {
    if (!checkConnection()) return;

    ros2Connection.sendArmEnableRequest(motorCmd);
    const desc = motorCmd === 1 ? "使能" : motorCmd === 0 ? "未使能" : "紧急故障";
    toast({
      title: "机械臂指令已发送",
      description: `机械臂状态：${desc}`,
    });
  }, [checkConnection, toast]);

  // 4. 泵控制话题发布
  const publishPumpControl = useCallback((message: PumpMessage) => {
    if (!checkConnection()) return;

    ros2Connection.publishPumpControl(message);
    toast({
      title: "泵控制指令已发布",
      description: `开关：${message.pump_switch === 1 ? '开' : '关'}，速度：${message.pump_speed}ml/s`,
    });
  }, [checkConnection, toast]);

  // 5. 底盘控制话题发布
  const publishChassisControl = useCallback((message: ChassisControlMessage) => {
    if (!checkConnection()) return;

    ros2Connection.publishChassisControl(message);
    // 仅在有速度时提示（避免频繁触发）
    if (message.x_speed !== 0 || message.y_speed !== 0 || message.z_speed !== 0) {
      toast({
        title: "底盘控制指令已发布",
        description: `X: ${message.x_speed}, Y: ${message.y_speed}, Z: ${message.z_speed}`,
        duration: 800, // 短提示，避免干扰操作
      });
    }
  }, [checkConnection, toast]);

  // 6. 机械臂控制话题发布
  const publishArmControl = useCallback((message: ArmControlMessage) => {
    if (!checkConnection()) return;

    ros2Connection.publishArmControl(message);
    // 复位指令单独提示
    if (message.arm_reset === 1) {
      toast({
        title: "机械臂复位指令已发布",
        description: "机械臂正在归位到初始位置",
      });
    } else {
      toast({
        title: "机械臂控制指令已发布",
        duration: 800,
      });
    }
  }, [checkConnection, toast]);

  // 7. 半自动模式服务
  const sendSemiMode = useCallback((request: SemiModeRequest) => {
    if (!checkConnection()) return;

    const { blade_roller, direction, width, length, thickness } = request;
    ros2Connection.sendSemiModeRequest(blade_roller, direction, width, length, thickness);
    toast({
      title: "半自动模式指令已发送",
      description: `模式：${blade_roller === 0 ? '刮涂' : '辊涂'}，方向：${direction === 0 ? '左' : '右'}`,
    });
  }, [checkConnection, toast]);

  // 8. 停止服务
  const sendStop = useCallback((stopCmd: number) => {
    if (!checkConnection()) return;

    ros2Connection.sendStopRequest(stopCmd);
    const desc = stopCmd === 1 ? "紧急停止" : stopCmd === 2 ? "更换料筒" : "取消紧急状态";
    toast({
      title: "停止指令已发送",
      description: `操作：${desc}`,
      variant: stopCmd === 1 ? "destructive" : "default", // 紧急停止用警告样式
    });
  }, [checkConnection, toast]);

  // 9. 机器模式服务
  const sendMachineMode = useCallback((modeCmd: number) => {
    if (!checkConnection()) return;

    ros2Connection.sendMachineModeRequest(modeCmd);
    const desc = modeCmd === 0 ? "准备/暂停" : modeCmd === 1 ? "手动模式" : "半自动模式";
    toast({
      title: "机器模式已切换",
      description: `当前模式：${desc}`,
    });
  }, [checkConnection, toast]);

  return {
    // 状态
    isConnected,
    rosUrl,
    setRosUrl,
    isConnecting,
    // 连接控制
    connect,
    disconnect,
    // 服务调用与话题发布方法
    sendConnectionEstablish,
    sendChassisEnable,
    sendArmEnable,
    publishPumpControl,
    publishChassisControl,
    publishArmControl,
    sendSemiMode,
    sendStop,
    sendMachineMode,
  };
};