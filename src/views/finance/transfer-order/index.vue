<template>
  <div class="p-2 app-container finance-transfer-order-page">
    <CreditOrderPanel
      order-type="TRANSFER"
      title="转账充值单"
      list-perm="finance:transfer-order:list"
      edit-perm="finance:transfer-order:edit"
    />
  </div>
</template>

<script setup name="FinanceTransferOrder" lang="ts">
import CreditOrderPanel from '../components/CreditOrderPanel.vue';

/**
 * 转账充值页（需求文档 2_财务/06）。
 *
 * 与客服代充页共用 CreditOrderPanel（同一状态机），差异只在采集字段与接口前缀。
 */
</script>
