<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    border
    empty-text="暂无数据"
    row-key="agentId"
    :data="rows"
    @selection-change="(selection: AnyRow[]) => emit('selection-change', selection)"
  >
    <el-table-column type="selection" reserve-selection width="46" align="center" />
    <el-table-column label="币种" prop="currency" align="center" width="120" show-overflow-tooltip />

    <template v-if="tab === 'top'">
      <el-table-column label="顶层代理ID" prop="agentId" align="center" width="170" show-overflow-tooltip />
      <el-table-column label="顶层代理账号" align="center" min-width="150">
        <template #default="scope">
          <div class="layer-tag">{{ scope.row.layerTag }}</div>
          <div>{{ scope.row.loginName }}</div>
        </template>
      </el-table-column>
    </template>
    <template v-else>
      <el-table-column label="代理ID" prop="agentId" align="center" width="170" show-overflow-tooltip />
      <el-table-column label="代理账号" align="center" min-width="150">
        <template #default="scope">
          <div class="layer-tag">{{ scope.row.layerTag }}</div>
          <div>{{ scope.row.loginName }}</div>
        </template>
      </el-table-column>
    </template>

    <el-table-column label="代理方式" prop="agentWayText" align="center" width="110" />
    <el-table-column v-if="tab !== 'top'" label="上级代理" prop="parentLoginName" align="center" min-width="130" show-overflow-tooltip />
    <el-table-column v-if="tab !== 'top'" label="顶层代理" prop="topLoginName" align="center" min-width="130" show-overflow-tooltip />
    <el-table-column v-if="tab !== 'top'" label="所属层数" prop="layerDepth" align="center" width="100" />
    <el-table-column label="代理模式" prop="modeName" align="center" width="120" />
    <el-table-column label="注册来源" prop="registerSource" align="center" width="120" />

    <el-table-column label="直属数" prop="directCount" align="center" width="90" />
    <template v-if="tab === 'top'">
      <el-table-column label="代理总数" prop="agentTotal" align="center" width="100" />
      <el-table-column label="下级总数" prop="subTotal" align="center" width="100" />
      <el-table-column label="下级层数" prop="subLayerCount" align="center" width="100" />
    </template>
    <el-table-column v-else label="其他数" prop="otherCount" align="center" width="90" />

    <el-table-column label="累计佣金" align="center" width="120">
      <template #default="scope">{{ formatMoney(scope.row.totalCommission) }}</template>
    </el-table-column>
    <el-table-column label="累计领取" align="center" width="120">
      <template #default="scope">{{ formatMoney(scope.row.withdrawnAmount) }}</template>
    </el-table-column>
    <el-table-column label="未领取" align="center" width="120">
      <template #default="scope">
        <span :class="Number(scope.row.pendingAmount ?? 0) > 0 ? 'amount-positive' : ''">
          {{ formatMoney(scope.row.pendingAmount) }}
        </span>
      </template>
    </el-table-column>

    <el-table-column label="成为代理时间" prop="becameAgentAt" align="center" width="170" show-overflow-tooltip />
    <el-table-column label="提现方式" prop="withdrawMethodText" align="center" min-width="150" show-overflow-tooltip />
    <el-table-column label="推广链接" align="center" min-width="200">
      <template #default="scope">
        <el-tooltip v-if="scope.row.promoLink" :content="scope.row.promoLink" placement="top">
          <span class="promo-link" @click="copy(scope.row.promoLink)">{{ scope.row.promoLink }}</span>
        </el-tooltip>
        <span v-else>—</span>
      </template>
    </el-table-column>
    <el-table-column v-if="tab !== 'top'" label="访问量" prop="visitCount" align="center" width="90" />

    <el-table-column v-if="tab !== 'top'" label="新下级绑定" align="center" width="120">
      <template #default="scope">
        <el-switch
          v-model="scope.row.bindNewSub"
          :active-value="1"
          :inactive-value="0"
          @change="(value: number) => emit('bind-switch', { row: scope.row, value })"
        />
      </template>
    </el-table-column>

    <el-table-column label="操作" align="center" width="180" fixed="right">
      <template #default="scope">
        <el-button link type="primary" @click="emit('row-action', { action: 'detail', row: scope.row })">详情</el-button>
        <el-dropdown v-hasPermi="['agent:account:edit']" @command="(command: string) => emit('row-action', { action: command, row: scope.row })">
          <el-button link type="primary">更多操作<el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="parent">修改上级</el-dropdown-item>
              <el-dropdown-item command="withdrawMethod">修改提现方式</el-dropdown-item>
              <el-dropdown-item command="layer">修改直属层级</el-dropdown-item>
              <el-dropdown-item command="label">修改直属标签</el-dropdown-item>
              <el-dropdown-item v-if="tab === 'top'" command="mode" divided>修改代理模式</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup name="AgentAccountPanel" lang="ts">
import { ref } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { AgentAccountVO, AgentOptionsVO } from '@/api/agent/account/types';

type AnyRow = AgentAccountVO & Record<string, any>;

defineProps<{
  rows: AnyRow[];
  loading: boolean;
  /** all=所有代理 top=顶层代理 */
  tab: string;
  options: AgentOptionsVO;
}>();

const emit = defineEmits<{
  // 说明：el-table 插槽里的 scope.row 由 Element Plus 推断为 DefaultRow，
  // 若把载荷声明成具体的 VO 类型会与表格插槽类型冲突（TS2769）；
  // 这里按「行为载荷」声明为 any，具体字段由父组件按 VO 处理。
  'row-action': [payload: { action: string; row: any }];
  'bind-switch': [payload: { row: any; value: number }];
  'selection-change': [selection: any[]];
}>();

const tableRef = ref();

/** 金额按「分 → 元」展示（与钱包/佣金口径一致） */
const formatMoney = (value?: number) => (Number(value ?? 0) / 100).toFixed(2);

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('推广链接已复制');
  } catch {
    ElMessage.warning('当前环境不支持自动复制，请手动选择链接');
  }
};

/** 供父组件实现「全选当前页」 */
defineExpose({
  toggleRowSelection: (row: AnyRow, selected = true) => tableRef.value?.toggleRowSelection(row, selected),
  clearSelection: () => tableRef.value?.clearSelection()
});
</script>

<style scoped>
.layer-tag {
  color: #909399;
  font-size: 12px;
}

.promo-link {
  color: #1f6fd0;
  cursor: pointer;
  display: inline-block;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.amount-positive {
  color: #e6a23c;
  font-weight: 600;
}
</style>
