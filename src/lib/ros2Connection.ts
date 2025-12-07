// 是 roslibjs 库（ROS 官方推荐的 JavaScript/TypeScript 客户端库）暴露的全局命名空间（namespace)
import ROSLIB from 'roslib';

// 先定义接口，明确请求参数的v类型契约
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

export class ROS2Connection {
  private ros: ROSLIB.Ros | null = null;
  private pumpTopic: ROSLIB.Topic | null = null;
  private chassisTopic: ROSLIB.Topic | null = null;
  private armTopic: ROSLIB.Topic | null = null;
  private pumpTopicReady = false; // 自定义：泵话题是否准备就绪（已创建+已发布）
  private chassisTopicReady = false; // 自定义：底盘话题是否准备就绪
  private armTopicReady = false; // 自定义：机械臂话题是否准备就绪
  // 重置所有话题状态的方法（统一管理）
  private resetTopicStates() {
    this.pumpTopicReady = false;
    this.chassisTopicReady = false;
    this.armTopicReady = false;
  }
  private initTopics() {
    if (!this.ros) {
      this.resetTopicStates(); // 连接无效时重置状态
      return;
    }
  
    try {
      // 泵控制话题
      this.pumpTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });
      this.pumpTopic.advertise(); // 执行发布
      this.pumpTopicReady = true; // 手动标记为就绪
      console.log('✓ 泵控制话题已初始化并发布');
  
      // 底盘控制话题
      this.chassisTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });
      this.chassisTopic.advertise();
      this.chassisTopicReady = true;
      console.log('✓ 底盘控制话题已初始化并发布');
  
      // 机械臂控制话题
      this.armTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });
      this.armTopic.advertise();
      this.armTopicReady = true;
      console.log('✓ 机械臂控制话题已初始化并发布');
    } catch (error) {
      console.error('初始化话题失败:', error);
      this.resetTopicStates(); // 失败时重置状态
    }
  }
  
  on(eventName: string, callback: (...args: any[]) => void) {
    if (this.ros) {
      this.ros.on(eventName, callback);
    }
  }
  
  // 代理 ros 的事件移除
  off(eventName: string, callback: (...args: any[]) => void) {
    if (this.ros) {
      this.ros.off(eventName, callback);
    }
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('正在连接到 ROS2 WebSocket 服务器:', url);
      
      const timeout = setTimeout(() => {
        if (this.ros) this.ros.close();
        reject(new Error('连接超时：请检查服务器、IP/端口和网络'));
      }, 10000);

      this.ros = new ROSLIB.Ros({ url });

      this.ros.on('connection', () => {
        clearTimeout(timeout);
        console.log('✓ 成功连接到 ROS2 服务器');
		this.initTopics();
        resolve();
      });

      this.ros.on('error', (error: any) => {
        clearTimeout(timeout);
        console.error('✗ ROS2 连接错误:', error);
        reject(new Error('连接失败：请检查 rosbridge 状态和网络'));
      });

      this.ros.on('close', () => {
        console.log('ROS2 连接已关闭');
      });
    });
  }

  disconnect() {
    if (this.ros) {
      this.ros.close();
      this.ros = null;
	}
	if (this.pumpTopic) {
	  this.pumpTopic.unadvertise(); // 取消发布
	  this.pumpTopic = null;
	}
	if (this.chassisTopic) {
	  this.chassisTopic.unadvertise();
	  this.chassisTopic = null;
	}
	if (this.armTopic) {
	  this.armTopic.unadvertise();
	  this.armTopic = null;
	}
	
	this.pumpTopicReady = false;
	this.chassisTopicReady = false;
	this.armTopicReady = false;
	
	console.log('已断开连接，话题已清理');
  }

  isConnected(): boolean {
    return this.ros !== null && this.ros.isConnected;
  }

  sendConnectionEstablishRequest(establish: number) {
    if (!this.ros) {
      return Promise.reject(new Error('未连接到 ROS2，无法发送请求'));
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/connection_establish',
      serviceType: 'web_connect/srv/Establish'
    });

    const request = new ROSLIB.ServiceRequest({ establish });
    service.callService(request, 
      (result: ConnectionEstablishResponse) => {
		console.log('连接建立响应:', result.establish_ack)
      },
      (error) => {
        console.error('连接建立请求失败:', error);
      }
    );
  }

  // 底盘使能
  sendChassisEnableRequest(motor_cmd: number) {
    if (!this.ros) {
      return Promise.reject(new Error('未使能底盘，无法发送请求'));
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/chassis_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    const request = new ROSLIB.ServiceRequest({ motor_cmd });
    service.callService(request,
      (result: ChassisEnableResponse) => {
        console.log('底盘使能响应:', result.motor_ack);
      },
      (error) => {
        console.error('底盘使能请求失败:', error);
      }
    );
  }

  // 机械臂使能
  sendArmEnableRequest(motor_cmd: number) {
    if (!this.ros) {
      return Promise.reject(new Error('未使能机械臂，无法发送请求'));
    }

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/arm_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    const request = new ROSLIB.ServiceRequest({ motor_cmd });
    service.callService(request,
      (result: ArmEnableResponse) => {
        console.log('机械臂使能响应:', result.arm_ack);
      },
      (error) => {
        console.error('机械臂使能请求失败:', error);
      }
    );
  }

  // 底盘控制发布方法（仅用自定义状态判断）
  publishChassisControl(message: ChassisControlMessage) {
    if (!this.ros || !this.ros.isConnected) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }
  
    // 仅通过自定义状态标记判断（完全不依赖 Topic 类的属性）
    if (!this.chassisTopic || !this.chassisTopicReady) {
      console.warn('底盘控制话题未就绪，重新初始化...');
      this.initTopics(); // 重新初始化
  
      // 再次检查自定义状态
      if (!this.chassisTopic || !this.chassisTopicReady) {
        console.error('底盘控制话题初始化失败，无法发布消息');
        return;
      }
    }
  
    // 发布消息
    const rosMessage = new ROSLIB.Message(message);
    this.chassisTopic.publish(rosMessage);
    console.log('底盘控制消息已发布:', message);
  }
  
  
  // 泵控制发布
  publishPumpControl(message: PumpMessage) {
    if (!this.ros || !this.ros.isConnected) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }
  
    if (!this.pumpTopic || !this.pumpTopicReady) {
      console.warn('泵控制话题未就绪，重新初始化...');
      this.initTopics();
      if (!this.pumpTopic || !this.pumpTopicReady) {
        console.error('泵控制话题初始化失败，无法发布消息');
        return;
      }
    }
  
    const rosMessage = new ROSLIB.Message(message);
    this.pumpTopic.publish(rosMessage);
    console.log('泵控制消息已发布:', message);
  }
  
  
  // 机械臂控制发布
  publishArmControl(message: ArmControlMessage) {
    if (!this.ros || !this.ros.isConnected) {
      console.error('未连接到 ROS2，无法发布消息');
      return;
    }
  
    if (!this.armTopic || !this.armTopicReady) {
      console.warn('机械臂控制话题未就绪，重新初始化...');
      this.initTopics();
      if (!this.armTopic || !this.armTopicReady) {
        console.error('机械臂控制话题初始化失败，无法发布消息');
        return;
      }
    }
  
    const rosMessage = new ROSLIB.Message(message);
    this.armTopic.publish(rosMessage);
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
    service.callService(request,
      (result: SemiModeResponse) => {
        console.log('半自动模式响应:', result.ack);
      },
      (error) => {
        console.error('半自动模式请求失败:', error);
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
    service.callService(request,
      (result: StopResponse) => {
        console.log('停止指令响应:', result.stop_ack);
      },
      (error) => {
        console.error('停止指令请求失败:', error);
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
    service.callService(request,
      (result: MachineModeResponse) => {
        console.log('机器模式响应:', result.mode_ack);
      },
      (error) => {
        console.error('机器模式请求失败:', error);
      }
    );
  }
}

export const ros2Connection = new ROS2Connection();



