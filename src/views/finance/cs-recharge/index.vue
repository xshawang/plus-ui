<template>
  <div class="p-2 app-container finance-cs-recharge-page">
    <!-- 页签结构对齐运营后台参照页（客服代充 → 代充审核 / 全部代充）：两者共用同一列表，
         仅默认状态筛选不同（待审核 / 全部）；「代充配置」模块当前未开发（见需求文档 13）。 -->
    <el-tabs v-model="activeTab" class="mb-2">
      <el-tab-pane label="代充审核" name="audit" />
      <el-tab-pane label="全部代充" name="all" />
      <!-- 代充配置：客服渠道配置（客服类型/名称/联系账号/充值类型/客服链接/会员层级/币种/赠送气泡/赠送比例） -->
      <el-tab-pane v-hasPermi="['finance:cs-config:list']" label="代充配置" name="config" />
    </el-tabs>
    <CreditOrderPanel
      v-if="activeTab !== 'config'"
      :key="activeTab"
      order-type="CS"
      :title="activeTab === 'audit' ? '客服代充单（代充审核）' : '客服代充单（全部代充）'"
      list-perm="finance:cs-recharge:list"
      edit-perm="finance:cs-recharge:edit"
      :initial-status="activeTab === 'audit' ? 0 : undefined"
      :show-create="activeTab === 'all'"
      :show-actions="activeTab === 'audit'"
    />
    <CsChannelConfigPanel v-else />
  </div>
</template>

<script setup name="FinanceCsRecharge" lang="ts">
import CreditOrderPanel from '../components/CreditOrderPanel.vue';
import CsChannelConfigPanel from '../components/CsChannelConfigPanel.vue';
import { ref } from 'vue';

/**
 * 客服代充页（需求文档 2_财务/07）。
 *
 * 与转账充值页共用 CreditOrderPanel；客服场景采集"经办客服 + 凭证说明"而非银行转账字段。
 *
 * 页签：代充审核（默认只筛 status=0）/ 全部代充（不筛状态）。用 :key 重建面板而不是让面板响应式跟随，
 * 因为面板内部持有查询与分页状态，切页签等价于换一套筛选上下文，重建可避免把 status=0 带到「全部代充」。
 */
const activeTab = ref<'audit' | 'all' | 'config'>('audit');
</script>
