import { useState, useCallback } from 'react';
import { ros2Connection } from '@/lib/ros2Connection';
import { useToast } from '@/hooks/use-toast';

export const useROS2 = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [rosUrl, setRosUrl] = useState('ws://192.168.137.96:9090');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await ros2Connection.connect(rosUrl);
      setIsConnected(true);
      toast({
        title: "连接成功",
        description: "已成功连接到ROS2服务器",
      });
    } catch (error) {
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "无法连接到ROS2服务器",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [rosUrl, toast]);

  const disconnect = useCallback(() => {
    ros2Connection.disconnect();
    setIsConnected(false);
    toast({
      title: "已断开连接",
      description: "已断开与ROS2服务器的连接",
    });
  }, [toast]);

  const establishConnection = useCallback(async (establish: number) => {
    try {
      const response = await ros2Connection.callConnectionEstablish({ establish });
      
      toast({
        title: response.establish_ack ? "操作成功" : "操作失败",
        description: establish === 1 ? "开机指令已发送" : "关机指令已发送",
      });

      return response;
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    isConnected,
    rosUrl,
    setRosUrl,
    isConnecting,
    connect,
    disconnect,
    establishConnection,
  };
};
