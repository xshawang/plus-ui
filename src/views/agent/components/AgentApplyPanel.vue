<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    border
    empty-text="暂无数据"
    row-key="applyId"
    :data="rows"
    @selection-change="(selection: AnyRow[]) => emit('selection-change', selection)"
  >
    <el-table-column type="selection" reserve-selection width="46" align="center" />
    <el-table-column label="币种" prop="currency" align="center" width="120" show-overflow-tooltip />
    <el-table-column label="申请时间" prop="appliedAt" align="center" width="170" sortable show-overflow-tooltip />
    <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
    <el-table-column label="会员账号" prop="loginName" align="center" min-width="140" show-overflow-tooltip />
    <el-table-column label="代理模式" prop="modeName" align="center" width="120" />
    <el-table-column label="真实姓名" prop="realName" align="center" min-width="120" show-overflow-tooltip />
    <el-table-column label="累计邀请人数" prop="inviteCount" align="center" width="130" />
    <el-table-column label="押金" align="center" width="110">
      <template #default="scope">{{ formatMoney(scope.row.depositAmount) }}</template>
    </el-table-column>
    <el-table-column label="累计充值" align="center" width="120">
      <template #default="scope">{{ formatMoney(scope.row.rechargeAmount) }}</template>
    </el-table-column>
    <el-table-column label="累计提现" align="center" width="120">
      <template #default="scope">{{ formatMoney(scope.row.withdrawAmount) }}</template>
    </el-table-column>
    <el-table-column label="累计投注" align="center" width="120">
      <template #default="scope">{{ formatMoney(scope.row.betAmount) }}</template>
    </el-table-column>
    <el-table-column label="累计领取奖励" align="center" width="130">
      <template #default="scope">{{ formatMoney(scope.row.rewardAmount) }}</template>
    </el-table-column>
    <el-table-column label="申请备注" prop="applyRemark" align="center" min-width="180" show-overflow-tooltip />

    <el-table-column v-if="tab === 'rejected'" label="前台拒绝原因" prop="rejectReason" align="center" min-width="200" show-overflow-tooltip />
    <el-table-column v-if="tab === 'approved'" label="通过备注" prop="approveRemark" align="center" min-width="200" show-overflow-tooltip />
    <template v-if="tab !== 'pending'">
      <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
      <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" sortable show-overflow-tooltip />
    </template>

    <el-table-column v-if="tab === 'pending'" label="操作" align="center" width="110" fixed="right">
      <template #default="scope">
        <el-button v-hasPermi="['agent:apply:audit']" link type="primary" @click="emit('row-action', { action: 'audit', row: scope.row })">
          审核
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup name="AgentApplyPanel" lang="ts">
import { ref } from 'vue';
import type { AgentApplyVO } from '@/api/agent/apply/types';

type AnyRow = AgentApplyVO & Record<string, any>;

defineProps<{
  rows: AnyRow[];
  loading: boolean;
  /** pending=待审核 rejected=被拒绝 approved=已通过 */
  tab: string;
}>();

const emit = defineEmits<{
  // 同 AgentAccountPanel：表格插槽行为 DefaultRow，载荷按 any 声明避免类型冲突
  'row-action': [payload: { action: string; row: any }];
  'selection-change': [selection: any[]];
}>();

const tableRef = ref();

/** 金额按「分 → 元」展示 */
const formatMoney = (value?: number) => (Number(value ?? 0) / 100).toFixed(2);

/** 供父组件实现「全选当前页」 */
defineExpose({
  toggleRowSelection: (row: AnyRow, selected = true) => tableRef.value?.toggleRowSelection(row, selected),
  clearSelection: () => tableRef.value?.clearSelection()
});
</script>
