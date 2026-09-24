import { reactive, ref } from 'vue';
import { listPromoConfig, savePromoConfig, type PromoConfigItemVO } from '@/api/promotion/config';

/**
 * 优惠模块 KV 配置编辑组合式函数（活动设置 / 任务开关 / 盲盒与转盘公共设置 / 返水设置 / VIP 公共设置共用）。
 *
 * 背景：优惠模块有 7 组结构完全一致的 KV 配置（分组 + 键 + JSON 值），
 * 差异只在「每个键用什么控件」；把取数、JSON 编解码与保存收敛到此处，
 * 页面只声明控件清单，避免 7 个页面各写一份取数逻辑导致口径漂移（会员模块已用同一范式）。
 * 值语义：开关存 0/1；枚举存字符串或数字；集合存数组；其余按文本框存字符串。
 */
export type PromoConfigControlType = 'switch' | 'select' | 'number' | 'multi' | 'text' | 'json';

export interface PromoConfigControl {
  key: string;
  /** 页面展示名（后端 configDesc 优先，取不到时用该值） */
  label: string;
  type: PromoConfigControlType;
  options?: Array<{ label: string; value: number | string }>;
  multiOptions?: Array<{ label: string; value: string }>;
  tip?: string;
}

export function usePromoKvConfig(group: string, controls: PromoConfigControl[]) {
  /**
   * 表单值：configKey -> 已解码的值。
   * 用 any 而非 unknown：控件类型由 controls 声明决定（switch/number 绑 number，multi 绑 string[]），
   * 使用 unknown 会让 Element Plus 的 v-model 类型校验失败，实际值域由 encode() 统一收敛。
   */
  const state = reactive({
    loading: false,
    saving: false,
    /** 页面弹窗可见性（活动设置等以弹窗形式承载的配置页共用） */
    visible: false,
    values: {} as Record<string, any>,
    descMap: {} as Record<string, string>
  });

  const decode = (type: PromoConfigControlType, raw?: string) => {
    if (raw === undefined || raw === null || raw === '') {
      return type === 'switch' ? 0 : type === 'multi' ? [] : type === 'number' ? 0 : '';
    }
    // json 类型：值本身就是 JSON 片段（对象或数组），直接以文本编辑，避免前端解析成对象后无法输入
    if (type === 'json') {
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      if (type === 'switch') {
        return Number(parsed) === 1 ? 1 : 0;
      }
      if (type === 'multi') {
        return Array.isArray(parsed) ? parsed : [];
      }
      return parsed;
    } catch {
      return raw;
    }
  };

  const encode = (type: PromoConfigControlType, value: unknown): string => {
    if (type === 'json') {
      return String(value ?? '');
    }
    if (type === 'switch') {
      return String(Number(value) === 1 ? 1 : 0);
    }
    if (type === 'number') {
      return String(Number(value ?? 0));
    }
    if (type === 'multi') {
      return JSON.stringify(Array.isArray(value) ? value : []);
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return JSON.stringify(value ?? '');
  };

  const load = async () => {
    state.loading = true;
    try {
      const res = (await listPromoConfig(group)) as { data?: PromoConfigItemVO[] };
      const items = res.data ?? [];
      const byKey = new Map(items.map((item) => [item.configKey, item]));
      controls.forEach((control) => {
        const item = byKey.get(control.key);
        state.values[control.key] = decode(control.type, item?.configValue);
        state.descMap[control.key] = item?.configDesc ?? '';
      });
    } finally {
      state.loading = false;
    }
  };

  const save = async () => {
    state.saving = true;
    try {
      const items = controls.map((control) => ({
        configKey: control.key,
        configValue: encode(control.type, state.values[control.key])
      }));
      return (await savePromoConfig(group, { items })) as { data?: number };
    } finally {
      state.saving = false;
    }
  };

  // 返回单个 reactive 对象而非解构后的 ref 集合：模板里 `setting.values.x / setting.loading` 可直接读写，
  // 避免页面必须把 ref 解构别名化才能通过 Element Plus 的 v-model 类型校验（会员模块此前踩过该坑）。
  Object.assign(state, { load, save });
  return state as typeof state & { load: () => Promise<void>; save: () => Promise<{ data?: number }> };
}
