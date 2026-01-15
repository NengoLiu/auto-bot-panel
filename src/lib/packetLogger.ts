// 通信包日志记录器 - 记录当天发送的所有包

export interface PacketLog {
  id: string;
  timestamp: number;
  type: 'service' | 'topic';
  name: string;
  direction: 'sent' | 'received';
  data: any;
  responseReceived: boolean;
  responseTime?: number; // ms
  error?: string;
}

export interface FaultRecord {
  id: string;
  timestamp: number;
  type: 'no_response' | 'error' | 'motor' | 'pump' | 'power' | 'arm' | 'chassis' | 'other';
  source: string;
  message: string;
  resolved: boolean;
  resolvedAt?: number;
}

const PACKET_LOG_KEY = 'packet_logs';
const FAULT_LOG_KEY = 'fault_logs';
const MAX_LOGS = 500; // 最大日志条数

class PacketLogger {
  private logs: PacketLog[] = [];
  private faults: FaultRecord[] = [];
  private pendingResponses: Map<string, { timestamp: number; timeout: ReturnType<typeof setTimeout> }> = new Map();

  constructor() {
    this.loadFromStorage();
    this.cleanOldLogs();
  }

  private loadFromStorage() {
    try {
      const today = new Date().toDateString();
      const savedLogs = localStorage.getItem(PACKET_LOG_KEY);
      const savedFaults = localStorage.getItem(FAULT_LOG_KEY);
      
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        // 只保留当天的日志
        this.logs = parsed.filter((log: PacketLog) => 
          new Date(log.timestamp).toDateString() === today
        );
      }
      
      if (savedFaults) {
        const parsed = JSON.parse(savedFaults);
        // 保留最近7天的故障记录
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.faults = parsed.filter((fault: FaultRecord) => fault.timestamp > sevenDaysAgo);
      }
    } catch (e) {
      console.error('加载日志失败:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(PACKET_LOG_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
      localStorage.setItem(FAULT_LOG_KEY, JSON.stringify(this.faults));
    } catch (e) {
      console.error('保存日志失败:', e);
    }
  }

  private cleanOldLogs() {
    const today = new Date().toDateString();
    this.logs = this.logs.filter(log => new Date(log.timestamp).toDateString() === today);
    this.saveToStorage();
  }

  // 记录发送的包
  logSend(type: 'service' | 'topic', name: string, data: any, expectResponse: boolean = true): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const log: PacketLog = {
      id,
      timestamp: Date.now(),
      type,
      name,
      direction: 'sent',
      data,
      responseReceived: !expectResponse // topic不期望响应
    };
    
    this.logs.push(log);
    
    // 如果期望响应，设置超时检测
    if (expectResponse) {
      const timeout = setTimeout(() => {
        this.markNoResponse(id, name);
      }, 5000); // 5秒超时
      
      this.pendingResponses.set(id, { timestamp: Date.now(), timeout });
    }
    
    this.saveToStorage();
    return id;
  }

  // 记录收到的响应
  logResponse(id: string, data: any, success: boolean = true) {
    const pending = this.pendingResponses.get(id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingResponses.delete(id);
    }

    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.responseReceived = true;
      log.responseTime = Date.now() - log.timestamp;
      if (!success) {
        log.error = '响应失败';
      }
      this.saveToStorage();
    }
  }

  // 标记无响应
  private markNoResponse(id: string, name: string) {
    const log = this.logs.find(l => l.id === id);
    if (log && !log.responseReceived) {
      log.error = '无响应';
      
      // 添加故障记录
      this.addFault('no_response', name, `服务 ${name} 无响应`);
      this.saveToStorage();
    }
    this.pendingResponses.delete(id);
  }

  // 添加故障记录
  addFault(type: FaultRecord['type'], source: string, message: string) {
    const fault: FaultRecord = {
      id: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      source,
      message,
      resolved: false
    };
    this.faults.push(fault);
    this.saveToStorage();
    
    // 触发故障事件供UI监听
    window.dispatchEvent(new CustomEvent('robot-fault', { detail: fault }));
  }

  // 解决故障
  resolveFault(id: string) {
    const fault = this.faults.find(f => f.id === id);
    if (fault) {
      fault.resolved = true;
      fault.resolvedAt = Date.now();
      this.saveToStorage();
    }
  }

  // 获取当天日志
  getTodayLogs(): PacketLog[] {
    const today = new Date().toDateString();
    return this.logs.filter(log => new Date(log.timestamp).toDateString() === today);
  }

  // 获取故障记录
  getFaults(includeResolved: boolean = false): FaultRecord[] {
    if (includeResolved) return [...this.faults];
    return this.faults.filter(f => !f.resolved);
  }

  // 获取统计信息
  getStats() {
    const todayLogs = this.getTodayLogs();
    const sent = todayLogs.filter(l => l.direction === 'sent');
    const noResponse = sent.filter(l => !l.responseReceived);
    const avgResponseTime = sent
      .filter(l => l.responseTime)
      .reduce((sum, l) => sum + (l.responseTime || 0), 0) / (sent.filter(l => l.responseTime).length || 1);

    return {
      totalSent: sent.length,
      noResponseCount: noResponse.length,
      avgResponseTime: Math.round(avgResponseTime),
      unresolvedFaults: this.faults.filter(f => !f.resolved).length
    };
  }

  // 清空当天日志
  clearTodayLogs() {
    const today = new Date().toDateString();
    this.logs = this.logs.filter(log => new Date(log.timestamp).toDateString() !== today);
    this.saveToStorage();
  }
}

export const packetLogger = new PacketLogger();
