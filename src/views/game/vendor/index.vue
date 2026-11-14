<template>
  <div class="p-2 app-container game-vendor-page">
    <!--
      游戏管理 → 厂商接入（OneAPI 第三方游戏）。
      全局接入配置、厂商目录同步、游戏上下架（展示 / 下架 / 维护 / 排序）、回调台账与注单、对账差异。
      有效投注比例仍在原「有效投注比例」页维护。
    -->
    <el-tabs v-model="active" class="vendor-tabs">
      <el-tab-pane label="接入配置" name="config" lazy>
        <VendorConfigPanel />
      </el-tab-pane>
      <el-tab-pane label="厂商同步" name="sync" lazy>
        <VendorSyncPanel />
      </el-tab-pane>
      <el-tab-pane label="游戏上下架" name="games" lazy>
        <VendorGamePanel />
      </el-tab-pane>
      <el-tab-pane label="回调台账 / 注单" name="txn" lazy>
        <VendorTxnPanel />
      </el-tab-pane>
      <el-tab-pane label="对账差异" name="reconcile" lazy>
        <VendorReconcilePanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VendorConfigPanel from './components/VendorConfigPanel.vue';
import VendorSyncPanel from './components/VendorSyncPanel.vue';
import VendorGamePanel from './components/VendorGamePanel.vue';
import VendorTxnPanel from './components/VendorTxnPanel.vue';
import VendorReconcilePanel from './components/VendorReconcilePanel.vue';

defineOptions({ name: 'GameVendor' });

const active = ref('config');
</script>

<style scoped>
.vendor-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
</style>
