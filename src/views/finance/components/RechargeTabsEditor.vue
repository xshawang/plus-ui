<template>
  <div class="recharge-tabs-editor">
    <div v-for="(tab, index) in tabs" :key="tab.code" class="tab-row">
      <el-checkbox :model-value="tab.enabled === 1" @change="(value: string | number | boolean) => toggle(index, value)" />
      <span class="drag-handle" title="按住调整顺序（或用右侧上移/下移）">⋮⋮</span>
      <el-input v-model="tab.name" maxlength="20" show-word-limit placeholder="页签名称" style="width: 320px" />
      <el-button link type="primary" :disabled="index === 0" @click="move(index, -1)">上移</el-button>
      <el-button link type="primary" :disabled="index === tabs.length - 1" @click="move(index, 1)">下移</el-button>
    </div>
    <div class="text-gray-400 text-sm">
      勾选=该页签在客户端充值页展示；数组顺序即展示顺序（对应参照页的拖拽排序，这里用上移/下移实现）。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * 充值页签编辑器（充值设置 → 充值页面展示设置 → 充值页签）。
 *
 * 背景：参照页里「转账存款 / 在线存款 / 数字货币 / 客服代充 / 银商存款」是可勾选、可排序、可改名的页签清单，
 * 存储为 JSON 数组（code/name/enabled）落在 member_module_config 的 finance-recharge-page / recharge_tabs 键上。
 * 为什么用受控组件：父页面统一按"键值字符串"保存，这里只做 JSON ↔ 数组的双向转换与顺序维护。
 */
interface TabItem {
  code: string;
  name: string;
  enabled: number;
}

const props = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const tabs = computed<TabItem[]>(() => {
  try {
    const parsed = JSON.parse(props.modelValue || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
});

const commit = (list: TabItem[]) => emit('update:modelValue', JSON.stringify(list));

const toggle = (index: number, value: string | number | boolean) => {
  const list = tabs.value.map((item, i) => (i === index ? { ...item, enabled: value ? 1 : 0 } : item));
  commit(list);
};

const move = (index: number, offset: number) => {
  const target = index + offset;
  if (target < 0 || target >= tabs.value.length) {
    return;
  }
  const list = [...tabs.value];
  const [moved] = list.splice(index, 1);
  list.splice(target, 0, moved);
  commit(list);
};
</script>

<style scoped>
.tab-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.drag-handle {
  color: #c0c4cc;
  cursor: move;
  letter-spacing: -2px;
}
</style>
