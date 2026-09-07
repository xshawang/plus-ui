<template>
  <div class="dashboard-state">
    <div v-if="loading" class="state-body">
      <el-skeleton :rows="4" animated />
    </div>
    <div v-else-if="error" class="state-body">
      <el-result icon="error" title="数据加载失败" sub-title="请检查后端服务或网络后重试">
        <template #extra>
          <el-button type="primary" @click="reload">重新加载</el-button>
        </template>
      </el-result>
    </div>
    <el-empty v-else-if="empty" :description="emptyText || '暂无数据'" :image-size="80" />
    <slot v-else />
  </div>
</template>

<script setup name="DashboardStateBox" lang="ts">
withDefaults(
  defineProps<{
    loading: boolean;
    error?: string | boolean;
    empty?: boolean;
    emptyText?: string;
    reload?: () => void;
  }>(),
  { reload: () => undefined }
);
</script>

<style scoped lang="scss">
.dashboard-state {
  min-height: 120px;
  width: 100%;
}

.state-body {
  width: 100%;
}
</style>
