/**
 * 维护开关（系统管理 → 维护开关）接口类型。
 * 契约来源：go88-service-infra /infra/sys/maintenance/**
 */

export interface MaintenanceItem {
  id: string;
  /** 模块编码 backend/lobby/game/download/client */
  moduleCode: string;
  moduleName: string;
  /** 中文维护提示 */
  message: string;
  /** 英文维护提示 */
  messageEn: string;
  /** 越南语维护提示 */
  messageVi: string;
  /** 0否 1是 */
  isMaintenance: number;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  sortOrder?: number;
  /** 综合"开关 + 计划窗口"后的真实生效状态（与入口层判定口径一致） */
  effective: boolean;
  updatedAt?: string;
}

export interface MaintenanceResult {
  items: MaintenanceItem[];
  /** 已下发到游戏侧的配置版本号；与上次保存对比可判断是否已生效 */
  downlinkVersion: number;
  downlinkAt?: string | null;
  modules: string[];
}

export interface MaintenanceForm {
  moduleCode: string;
  message?: string;
  messageEn?: string;
  messageVi?: string;
  isMaintenance: number;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
}
