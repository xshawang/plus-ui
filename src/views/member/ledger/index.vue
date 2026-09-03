<template>
  <div class="p-2 app-container member-ledger-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="UID" prop="uid">
            <el-input v-model="queryParams.uid" placeholder="用户UID" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="流水号" prop="ledgerNo">
            <el-input v-model="queryParams.ledgerNo" placeholder="流水号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="游戏" prop="gameCode">
            <el-select
              v-model="queryParams.gameCode"
              placeholder="全部"
              clearable
              filterable
              style="width: 220px"
            >
              <el-option
                v-for="item in gameOptions"
                :key="item.gameCode"
                :label="`${item.gameCode} ${item.gameName ?? ''}`.trim()"
                :value="item.gameCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="业务类型" prop="bizType">
            <el-select v-model="queryParams.bizType" placeholder="全部" clearable style="width: 130px">
              <el-option v-for="(label, value) in bizTypeMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="变动类型" prop="changeType">
            <el-select v-model="queryParams.changeType" placeholder="全部" clearable style="width: 110px">
              <el-option v-for="(label, value) in changeTypeMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" prop="dateRange">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>账户流水</h3>
            <el-tag v-if="queryParams.uid" type="primary" class="ml-1">UID：{{ queryParams.uid }}</el-tag>
            <span v-else class="text-gray-400 text-sm">从用户列表点击 UID 进入可查看单个用户流水</span>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" plain icon="Refresh" @click="handleQuery">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="ledgerList">
        <el-table-column label="流水号" align="left" prop="ledgerNo" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.ledgerNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="UID" align="center" prop="uid" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.uid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户名称" align="center" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.loginName || row.nickName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="游戏" align="center" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.gameCode || row.gameId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="业务类型" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="bizTypeOf(row).type">{{ bizTypeOf(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变动" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="changeTypeTag(row.changeType)">{{ changeTypeMap[row.changeType] ?? row.changeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="币种" align="center" prop="currency" width="80" />
        <el-table-column label="变动金额" align="right" width="150">
          <template #default="{ row }">
            <span
              :style="{ color: Number(row.changeAmount) >= 0 ? '#16a34a' : '#dc2626' }"
              class="font-mono"
            >
              {{ formatSigned(row.changeAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动前可用" align="right" width="140">
          <template #default="{ row }">
            <span class="font-mono">{{ formatMoney(row.beforeAvailable) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变动后可用" align="right" width="140">
          <template #default="{ row }">
            <span class="font-mono">{{ formatMoney(row.afterAvailable) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createdAt" width="170">
          <template #default="{ row }">{{ row.createdAt }}</template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="MemberLedger" lang="ts">
import { listLedgerGameCodes, listWalletLedger } from '@/api/member/ledger';
import type { GameCodeOption, WalletLedgerQuery, WalletLedgerVO } from '@/api/member/ledger/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { onMounted, reactive, ref, toRefs, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

/**
 * 业务类型（WalletBizTypeEnum.code）：
 * 1充值 2提现 3下注 4结算 5活动发放 6手动调账 7保险箱转入 8保险箱转出
 * 9代理佣金 10代理提现 11进入游戏冻结 12离开游戏解冻 13奖金转主钱包 14余额刷新
 */
const bizTypeMap: Record<number, string> = {
  1: '充值',
  2: '提现',
  3: '下注',
  4: '结算',
  5: '活动发放',
  6: '手动调账',
  7: '保险箱转入',
  8: '保险箱转出',
  9: '代理佣金',
  10: '代理提现',
  11: '进入游戏冻结',
  12: '离开游戏解冻',
  13: '奖金转主钱包',
  14: '余额刷新'
};

const bizTypeTag = (bizType?: number) => {
  if (bizType === 1) return 'success';
  if (bizType === 2) return 'danger';
  if (bizType === 3 || bizType === 4) return 'warning';
  if (bizType === 6) return 'primary';
  return 'info';
};

/**
 * 业务类型展示：优先使用钱包侧落库的 ext_json.bizName；
 * 兜底按 commandType/旧 bizType 字典换算。
 */
const bizTypeOf = (row: WalletLedgerVO): {
  label: string;
  type: 'primary' | 'success' | 'info' | 'warning' | 'danger';
} => {
  if (row.bizName) {
    const type = row.commandType === 'BET' ? 'danger' : row.commandType === 'BONUS' ? 'success' : 'info';
    return { label: row.bizName, type };
  }
  const cmd = row.commandType;
  if (cmd === 'BET') return { label: '投注扣款', type: 'danger' };
  if (cmd === 'BONUS') return { label: '中奖加款', type: 'success' };
  if (cmd === 'MANUAL_CREDIT') return { label: '手动调账-加款', type: 'primary' };
  if (cmd === 'MANUAL_DEBIT') return { label: '手动调账-扣款', type: 'danger' };
  if (cmd && cmd.startsWith('WITHDRAW')) return { label: '提现', type: 'danger' };
  if (cmd === 'DEPOSIT') return { label: '充值', type: 'success' };
  if (cmd === 'SETTLE_WIN' || cmd === 'SETTLE_LOSE') return { label: '结算', type: 'warning' };
  if (cmd === 'BET_CANCEL' || cmd === 'REFUND') return { label: '下注退款', type: 'info' };
  if (cmd === 'INTERNAL_TRANSFER') return { label: '保险箱互转', type: 'warning' };
  return { label: bizTypeMap[row.bizType ?? -1] ?? String(row.bizType ?? '-'), type: bizTypeTag(row.bizType) };
};

/** 变动类型：1加款 2扣款 3冻结 4解冻 */
const changeTypeMap: Record<number, string> = {
  1: '加款',
  2: '扣款',
  3: '冻结',
  4: '解冻'
};

const changeTypeTag = (changeType?: number) => {
  if (changeType === 1) return 'success';
  if (changeType === 2) return 'danger';
  if (changeType === 3 || changeType === 4) return 'warning';
  return 'info';
};

const showSearch = ref(true);
const ledgerList = ref<WalletLedgerVO[]>([]);
const gameOptions = ref<GameCodeOption[]>([]);
const total = ref(0);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<{ queryParams: WalletLedgerQuery }>({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    uid: undefined,
    ledgerNo: undefined,
    bizNo: undefined,
    bizType: undefined,
    changeType: undefined,
    currency: 'VND',
    gameCode: undefined,
    params: undefined
  }
});
const { queryParams } = toRefs(data);

const loadGameOptions = async () => {
  const res = await listLedgerGameCodes();
  gameOptions.value = res.data || [];
};

const formatMoney = (value?: number) => {
  if (value === null || value === undefined) return '0.00';
  return (Number(value) ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatSigned = (value?: number) => {
  const num = Number(value ?? 0);
  return (num >= 0 ? '+' : '') + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listWalletLedger(applyDateRange(queryParams.value));
    ledgerList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    resetDateRange();
    queryParams.value.currency = 'VND';
  },
  afterReset: () => handleQuery()
});

/** 从用户列表带 uid 进入时自动按该用户查询 */
watch(
  () => route.query.uid,
  uid => {
    queryParams.value.uid = uid ? String(uid) : undefined;
    handleQuery();
  },
  { immediate: true }
);

onMounted(() => {
  loadGameOptions();
});
</script>
