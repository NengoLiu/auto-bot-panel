import ROSLIB from 'roslib';
import { packetLogger } from './packetLogger';

export interface ConnectionEstablishRequest {
  establish: number; // 0: 关机, 1: 开机
}

export interface ConnectionEstablishResponse {
  establish_ack: number; // 0/1
}

export interface EnableRequest {
  motor_cmd: number; // 0: 未使能, 1: 使能, 2: 紧急故障
}

export interface ChassisEnableResponse {
  motor_ack: number; // 0/1
}

export interface ArmEnableResponse {
  arm_ack: number; // 0/1
}

export interface PumpMessage {
  pump_switch: number; // 0: 关, 1: 开
  pump_speed: number; // 0-200 ml/s
  pump_flud: number; // 0-12 ml
}

export interface ChassisControlMessage {
  x_speed: number; // float64 m/s
  y_speed: number; // float64 m/s
  z_speed: number; // float64 °/s
}

export interface ArmControlMessage {
  yaw_angle: number; // float32 -90 to 90
  roll_angle: number; // float32 -180 to 180
  updown_angle: number; // float32 0-8cm
  arm_reset: number; // uint8 0/1
}

export interface SemiModeRequest {
  blade_roller: number; // 0: 刮涂, 1: 辊涂
  direction: number; // 0: 向左, 1: 向右
  width: number; // float32 0-2600mm
  length: number; // float32 0-20000mm
  thickness: number; // float32 0-20mm
}

export interface SemiModeResponse {
  ack: number; // 0: 执行失败, 1: 确认收到
}

export interface StopRequest {
  stop_cmd: number; // 0: 不发送紧急情况, 1: 发送紧急情况, 2: 需要更换料筒
}

export interface StopResponse {
  stop_ack: number; // 0/1
}

export interface MachineModeRequest {
  mode_cmd: number; // 0: 准备状态/紧急暂停, 1: 手动模式, 2: 半自动
}

export interface MachineModeResponse {
  mode_ack: number; // 0/1
}

// 泵使能服务
export interface PumpEnableRequest {
  pump_cmd: number; // 0: 未使能, 1: 使能, 2: 紧急故障
  pump_speed: number; // float32 带符号值，>0 抽取，<0 倒吸
}

export interface PumpEnableResponse {
  pump_ack: number; // 0 或 1
}

// 开发者归零服务
export interface ZerosetRequest {
  zero_set_cmd: number; // 0 或 1
}

export interface ZerosetResponse {
  zero_set_ack: number; // 0 或 1
}

export class ROS2Connection {
  private ros: ROSLIB.Ros | null = null;
  private pumpTopic: ROSLIB.Topic | null = null;
  private chassisTopic: ROSLIB.Topic | null = null;
  private armTopic: ROSLIB.Topic | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private lastUrl: string | null = null;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private isReconnecting: boolean = false;
  private connectionId: number = 0; // 用于追踪连接实例，防止事件处理混乱
  private lastConnectionVerified: boolean = false; // 标记连接是否已验证

  // 添加连接状态监听器
  addConnectionListener(listener: (connected: boolean) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  private notifyListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // 彻底关闭现有连接，确保资源释放
  private closeExistingConnection() {
    console.log('关闭现有连接...');
    
    // 清理 Topics
    if (this.pumpTopic) {
      try { this.pumpTopic.unadvertise(); } catch {}
      this.pumpTopic = null;
    }
    if (this.chassisTopic) {
      try { this.chassisTopic.unadvertise(); } catch {}
      this.chassisTopic = null;
    }
    if (this.armTopic) {
      try { this.armTopic.unadvertise(); } catch {}
      this.armTopic = null;
    }
    
    // 关闭 ROS 连接
    if (this.ros) {
      try {
        // 移除所有事件监听器，防止触发 close 事件导致重连
        this.ros.removeAllListeners();
        this.ros.close();
      } catch (e) {
        console.warn('关闭旧连接时出错:', e);
      }
      this.ros = null;
    }
    
    this.lastConnectionVerified = false;
  }

  // 验证连接：发送 establish 请求并等待响应
  private verifyConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.ros || !this.ros.isConnected) {
        resolve(false);
        return;
      }

      const service = new ROSLIB.Service({
        ros: this.ros,
        name: '/connection_establish',
        serviceType: 'web_connect/srv/Establish'
      });

      const request = new ROSLIB.ServiceRequest({ establish: 1 });
      const logId = packetLogger.logSend('service', '/connection_establish', { establish: 1 });
      
      // 5秒超时
      const timeout = setTimeout(() => {
        console.warn('连接验证超时');
        packetLogger.logResponse(logId, { error: 'timeout' }, false);
        resolve(false);
      }, 5000);

      service.callService(request, 
        (result: ConnectionEstablishResponse) => {
          clearTimeout(timeout);
          const verified = result.establish_ack === 1;
          console.log('连接验证结果:', verified ? '成功' : '失败');
          packetLogger.logResponse(logId, result, verified);
          resolve(verified);
        },
        (error) => {
          clearTimeout(timeout);
          console.error('连接验证失败:', error);
          packetLogger.logResponse(logId, { error }, false);
          resolve(false);
        }
      );
    });
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('正在连接到 ROS2 WebSocket 服务器:', url);
      
      // 先彻底关闭现有连接
      this.closeExistingConnection();
      this.stopAutoReconnect();
      
      this.lastUrl = url;
      this.connectionId++;
      const currentConnectionId = this.connectionId;
      
      const timeout = setTimeout(() => {
        if (this.ros && this.connectionId === currentConnectionId) {
          this.closeExistingConnection();
        }
        reject(new Error('连接超时：请检查服务器、IP/端口和网络'));
      }, 10000);

      this.ros = new ROSLIB.Ros({ url });

      this.ros.on('connection', async () => {
        // 检查这是否仍是当前连接
        if (this.connectionId !== currentConnectionId) {
          console.log('旧连接事件被忽略');
          return;
        }
        
        clearTimeout(timeout);
        console.log('WebSocket 已连接，正在验证 ROS 服务...');
        
        // 验证连接
        const verified = await this.verifyConnection();
        
        if (this.connectionId !== currentConnectionId) {
          console.log('验证完成但连接已切换');
          return;
        }
        
        if (verified) {
          console.log('✓ 成功连接到 ROS2 服务器（已验证）');
          this.lastConnectionVerified = true;
          this.notifyListeners(true);
          resolve();
        } else {
          console.error('✗ WebSocket 已连接但 ROS 服务验证失败');
          this.closeExistingConnection();
          reject(new Error('连接验证失败：ROS2 服务无响应'));
        }
      });

      this.ros.on('error', (error: any) => {
        if (this.connectionId !== currentConnectionId) return;
        clearTimeout(timeout);
        console.error('✗ ROS2 连接错误:', error);
        this.notifyListeners(false);
        reject(new Error('连接失败：请检查 rosbridge 状态和网络'));
      });

      this.ros.on('close', () => {
        if (this.connectionId !== currentConnectionId) return;
        console.log('ROS2 连接已关闭');
        this.lastConnectionVerified = false;
        this.notifyListeners(false);
        // 只有在非主动断开时才自动重连
        if (!this.isReconnecting && this.lastUrl) {
          this.startAutoReconnect();
        }
      });
    });
  }

  // 自动重连逻辑
  private startAutoReconnect() {
    if (this.reconnectTimer || !this.lastUrl) return;
    
    console.log('启动自动重连...');
    this.reconnectTimer = setInterval(async () => {
      if (this.isConnected() && this.lastConnectionVerified) {
        this.stopAutoReconnect();
        return;
      }

      console.log('尝试重新连接...');
      try {
        await this.reconnect();
        console.log('✓ 重连成功');
      } catch (e) {
        console.log('重连失败，5秒后重试');
      }
    }, 5000);
  }

  private stopAutoReconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 重连（带验证）
  private reconnect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.lastUrl) {
        reject(new Error('没有可用的连接URL'));
        return;
      }

      this.isReconnecting = true;
      
      try {
        // 先彻底关闭现有连接
        this.closeExistingConnection();
        
        this.connectionId++;
        const currentConnectionId = this.connectionId;

        this.ros = new ROSLIB.Ros({ url: this.lastUrl });

        const timeout = setTimeout(() => {
          if (this.ros && this.connectionId === currentConnectionId) {
            this.closeExistingConnection();
          }
          this.isReconnecting = false;
          reject(new Error('重连超时'));
        }, 8000);

        this.ros.on('connection', async () => {
          if (this.connectionId !== currentConnectionId) {
            return;
          }
          
          clearTimeout(timeout);
          console.log('重连 WebSocket 成功，正在验证...');
          
          // 验证连接
          const verified = await this.verifyConnection();
          
          if (this.connectionId !== currentConnectionId) {
            this.isReconnecting = false;
            return;
          }
          
          if (verified) {
            console.log('✓ 重连验证成功');
            this.lastConnectionVerified = true;
            this.stopAutoReconnect();
            this.notifyListeners(true);
            
            // 重连后自动恢复之前的模式
            this.restoreMode();
            
            this.isReconnecting = false;
            resolve();
          } else {
            console.warn('重连 WebSocket 成功但验证失败');
            this.closeExistingConnection();
            this.isReconnecting = false;
            reject(new Error('重连验证失败'));
          }
        });

        this.ros.on('error', () => {
          if (this.connectionId !== currentConnectionId) return;
          clearTimeout(timeout);
          this.isReconnecting = false;
          reject(new Error('重连失败'));
        });

        this.ros.on('close', () => {
          if (this.connectionId !== currentConnectionId) return;
          this.lastConnectionVerified = false;
          this.notifyListeners(false);
          // 重连关闭后继续尝试
          if (!this.isReconnecting) {
            this.startAutoReconnect();
          }
        });
      } catch (e) {
        this.isReconnecting = false;
        reject(e);
      }
    });
  }

  // 恢复之前保存的操作模式
  private restoreMode() {
    try {
      const savedMode = sessionStorage.getItem('control_current_mode');
      if (savedMode) {
        const mode_cmd = savedMode === 'manual' ? 1 : savedMode === 'semiauto' ? 2 : 0;
        if (mode_cmd > 0) {
          console.log('恢复操作模式:', savedMode);
          // 延迟发送，确保连接稳定
          setTimeout(() => {
            this.sendMachineModeRequest(mode_cmd);
          }, 500);
        }
      }
    } catch (e) {
      console.error('恢复模式失败:', e);
    }
  }

  // 完全断开连接（用户主动断开）
  disconnect() {
    console.log('用户主动断开连接');
    this.stopAutoReconnect();
    this.closeExistingConnection();
    this.lastUrl = null; // 清除 URL 防止自动重连
  }

  // 检查连接状态（WebSocket 连接 + 验证状态）
  isConnected(): boolean {
    return this.ros !== null && this.ros.isConnected && this.lastConnectionVerified;
  }

  // 仅发送 establish 请求（不用于验证）
  sendConnectionEstablishRequest(establish: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/connection_establish',
      serviceType: 'web_connect/srv/Establish'
    });

    const request = new ROSLIB.ServiceRequest({ establish });
    const logId = packetLogger.logSend('service', '/connection_establish', { establish });
    
    service.callService(request, 
      (result: ConnectionEstablishResponse) => {
        console.log('连接建立响应:', result.establish_ack);
        packetLogger.logResponse(logId, result, result.establish_ack === 1);
      },
      (error) => {
        console.error('连接建立请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 底盘使能
  sendChassisEnableRequest(motor_cmd: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/chassis_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    const request = new ROSLIB.ServiceRequest({ motor_cmd });
    const logId = packetLogger.logSend('service', '/chassis_enable', { motor_cmd });
    
    service.callService(request,
      (result: ChassisEnableResponse) => {
        console.log('底盘使能响应:', result.motor_ack);
        packetLogger.logResponse(logId, result, result.motor_ack === 1);
      },
      (error) => {
        console.error('底盘使能请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 机械臂使能
  sendArmEnableRequest(motor_cmd: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/arm_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    const request = new ROSLIB.ServiceRequest({ motor_cmd });
    const logId = packetLogger.logSend('service', '/arm_enable', { motor_cmd });
    
    service.callService(request,
      (result: ArmEnableResponse) => {
        console.log('机械臂使能响应:', result.arm_ack);
        packetLogger.logResponse(logId, result, result.arm_ack === 1);
      },
      (error) => {
        console.error('机械臂使能请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 泵控制话题
  publishPumpControl(message: PumpMessage) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }

    if (!this.pumpTopic) {
      this.pumpTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });
      this.pumpTopic.advertise();
      console.log('✓ 泵控制话题已广告');
    }

    const rosMessage = new ROSLIB.Message(message);
    this.pumpTopic.publish(rosMessage);
    packetLogger.logSend('topic', '/pump_control', message, false);
    console.log('泵控制消息已发布:', message);
  }

  // 底盘控制
  publishChassisControl(message: ChassisControlMessage) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }

    if (!this.chassisTopic) {
      this.chassisTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });
      this.chassisTopic.advertise();
      console.log('✓ 底盘控制话题已广告');
    }

    const rosMessage = new ROSLIB.Message(message);
    this.chassisTopic.publish(rosMessage);
    packetLogger.logSend('topic', '/chassis_control', message, false);
    console.log('底盘控制消息已发布:', message);
  }

  // 机械臂控制
  publishArmControl(message: ArmControlMessage) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }

    if (!this.armTopic) {
      this.armTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });
      this.armTopic.advertise();
      console.log('✓ 机械臂控制话题已广告');
    }

    const rosMessage = new ROSLIB.Message(message);
    this.armTopic.publish(rosMessage);
    packetLogger.logSend('topic', '/arm_control', message, false);
    console.log('机械臂控制消息已发布:', message);
  }

  // 半自动模式
  sendSemiModeRequest(blade_roller: number, direction: number, width: number, length: number, thickness: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/semi_mode',
      serviceType: 'web_connect/srv/Semi'
    });

    const request = new ROSLIB.ServiceRequest({
      blade_roller,
      direction,
      width,
      length,
      thickness
    });
    const logId = packetLogger.logSend('service', '/semi_mode', { blade_roller, direction, width, length, thickness });
    
    service.callService(request,
      (result: SemiModeResponse) => {
        console.log('半自动模式响应:', result.ack);
        packetLogger.logResponse(logId, result, result.ack === 1);
      },
      (error) => {
        console.error('半自动模式请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 停止服务
  sendStopRequest(stop_cmd: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/stop',
      serviceType: 'web_connect/srv/Stop'
    });

    const request = new ROSLIB.ServiceRequest({ stop_cmd });
    const logId = packetLogger.logSend('service', '/stop', { stop_cmd });
    
    service.callService(request,
      (result: StopResponse) => {
        console.log('停止指令响应:', result.stop_ack);
        packetLogger.logResponse(logId, result, result.stop_ack === 1);
      },
      (error) => {
        console.error('停止指令请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 机器模式
  sendMachineModeRequest(mode_cmd: number) {
    if (!this.ros) {
      console.error('未连接到 ROS2，无法发送请求');
      return;
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/machine_mode',
      serviceType: 'web_connect/srv/Mode'
    });

    const request = new ROSLIB.ServiceRequest({ mode_cmd });
    const logId = packetLogger.logSend('service', '/machine_mode', { mode_cmd });
    
    service.callService(request,
      (result: MachineModeResponse) => {
        console.log('机器模式响应:', result.mode_ack);
        packetLogger.logResponse(logId, result, result.mode_ack === 1);
      },
      (error) => {
        console.error('机器模式请求失败:', error);
        packetLogger.logResponse(logId, { error }, false);
      }
    );
  }

  // 开发者功能：机械臂归零
  sendZerosetRequest(axis: 5 | 6 | 7, zero_set_cmd: number): Promise<ZerosetResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ros) {
        reject(new Error('未连接到 ROS2'));
        return;
      }

      const serviceName = `/admin_zeroset_${axis}`;
      const service = new ROSLIB.Service({
        ros: this.ros,
        name: serviceName,
        serviceType: 'web_connect/srv/Zeroset'
      });

      const request = new ROSLIB.ServiceRequest({ zero_set_cmd });
      const logId = packetLogger.logSend('service', serviceName, { zero_set_cmd });

      service.callService(request,
        (result: ZerosetResponse) => {
          console.log(`归零服务 ${serviceName} 响应:`, result.zero_set_ack);
          packetLogger.logResponse(logId, result, result.zero_set_ack === 1);
          resolve(result);
        },
        (error) => {
          console.error(`归零服务 ${serviceName} 请求失败:`, error);
          packetLogger.logResponse(logId, { error }, false);
          reject(error);
        }
      );
    });
  }

  // 泵使能服务
  sendPumpEnableRequest(pump_cmd: number, pump_speed: number): Promise<PumpEnableResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ros) {
        reject(new Error('未连接到 ROS2'));
        return;
      }

      const service = new ROSLIB.Service({
        ros: this.ros,
        name: '/pumpkin_enable',
        serviceType: 'web_connect/srv/Pumpkin'
      });

      const request = new ROSLIB.ServiceRequest({ pump_cmd, pump_speed });
      const logId = packetLogger.logSend('service', '/pumpkin_enable', { pump_cmd, pump_speed });

      service.callService(request,
        (result: PumpEnableResponse) => {
          console.log('泵使能响应:', result.pump_ack);
          packetLogger.logResponse(logId, result, result.pump_ack === 1);
          resolve(result);
        },
        (error) => {
          console.error('泵使能请求失败:', error);
          packetLogger.logResponse(logId, { error }, false);
          reject(error);
        }
      );
    });
  }
}

export const ros2Connection = new ROS2Connection();
