<template>
  <div class="p-2 app-container finance-cs-recharge-page">
    <CreditOrderPanel
      order-type="CS"
      title="客服代充单"
      list-perm="finance:cs-recharge:list"
      edit-perm="finance:cs-recharge:edit"
    />
  </div>
</template>

<script setup name="FinanceCsRecharge" lang="ts">
import CreditOrderPanel from '../components/CreditOrderPanel.vue';

/**
 * 客服代充页（需求文档 2_财务/07）。
 *
 * 与转账充值页共用 CreditOrderPanel；客服场景采集"经办客服 + 凭证说明"而非银行转账字段。
 */
</script>
