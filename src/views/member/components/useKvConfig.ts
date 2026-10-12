import { reactive, ref } from 'vue';
import type { ConfigItemVO } from '@/api/member/config/types';

/**
 * 会员 KV 配置编辑组合式函数（防刷风控 / 安全中心共用）。
 *
 * 背景：两类配置表结构一致（config_key + JSON 值），差异只在"每个键用什么控件"；
 * 把取数/保存/JSON 编解码收敛到此处，页面只声明控件清单，避免两份重复逻辑漂移。
 *
 * 值语义：开关存 0/1；枚举存数字或字符串；集合存数组；其余按文本框存字符串。
 */
export type ConfigControlType = 'switch' | 'select' | 'number' | 'multi' | 'text';

export interface ConfigControl {
  key: string;
  /** 页面展示名（优先用后端 configDesc，未取到时用该值） */
  label: string;
  type: ConfigControlType;
  options?: Array<{ label: string; value: number | string }>;
  /** multi 类型的可选项 */
  multiOptions?: Array<{ label: string; value: string }>;
}

type Loader = () => Promise<unknown>;
type Saver = (data: { items: Array<{ configKey: string; configValue: string }> }) => Promise<unknown>;

export function useKvConfig(loader: Loader, saver: Saver, controls: ConfigControl[]) {
  const loading = ref(false);
  const saving = ref(false);
  /**
   * 页面表单值：configKey -> 已解码的值。
   * 用 any 而非 unknown：控件类型由 controls 声明决定（switch/number 绑定 number，multi 绑定 string[]），
   * 使用 unknown 会让 Element Plus 的 v-model 类型校验失败；实际值域由 encode() 统一收敛。
   */
  const values = reactive<Record<string, any>>({});
  /** 后端返回的描述/操作人，用于卡片副标题 */
  const descMap = reactive<Record<string, string>>({});

  const decode = (type: ConfigControlType, raw?: string) => {
    if (raw === undefined || raw === null || raw === '') {
      return type === 'switch' ? 0 : type === 'multi' ? [] : type === 'number' ? 0 : '';
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

  const encode = (type: ConfigControlType, value: unknown): string => {
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
    loading.value = true;
    try {
      const res = (await loader()) as { data?: ConfigItemVO[] };
      const items = res.data ?? [];
      const byKey = new Map(items.map((item) => [item.configKey, item]));
      controls.forEach((control) => {
        const item = byKey.get(control.key);
        values[control.key] = decode(control.type, item?.configValue);
        descMap[control.key] = item?.configDesc ?? '';
      });
    } finally {
      loading.value = false;
    }
  };

  const save = async () => {
    saving.value = true;
    try {
      const items = controls.map((control) => ({
        configKey: control.key,
        configValue: encode(control.type, values[control.key])
      }));
      return (await saver({ items })) as { data?: number };
    } finally {
      saving.value = false;
    }
  };

  return { loading, saving, values, descMap, load, save };
}
