<template>
  <div class="panel-toolbar">
    <span class="toolbar-hint">当前页签独立刷新，切换到其他页签后停止</span>
    <div class="toolbar-actions">
      <span class="updated-at">更新于 {{ updatedAt }}</span>
      <el-switch
        :model-value="autoRefresh"
        active-text="每 15 秒刷新"
        inline-prompt
        @update:model-value="$emit('update:autoRefresh', Boolean($event))"
      />
      <el-button icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  autoRefresh: boolean;
  loading: boolean;
  updatedAt: string;
}>();

defineEmits<{
  'update:autoRefresh': [value: boolean];
  refresh: [];
}>();
</script>

<style scoped>
.panel-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}
.toolbar-hint,
.updated-at { color: var(--el-text-color-secondary); font-size: 12px; }
.toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
</style>
