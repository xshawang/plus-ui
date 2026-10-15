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

    <!--
      按查询条件分组统计（需求：一行三款游戏，逐款展示 游戏名(game_code) / 投注 / 派彩 / 差异；
      无游戏标记的流水与游戏对齐；末行给出总收入 / 总支出 / 总差异；默认收起）。
      数据来自 /infra/member/ledger/summary（与列表同一套筛选条件，但不分页）⇒ 翻页不会改变统计值。
    -->
    <el-card shadow="hover" class="summary-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>投注 / 派彩统计</h3>
            <span class="summary-tip">
              口径：按当前查询条件全量统计（不限本页），一行三款游戏；投注 = 各游戏扣款、派彩 = 各游戏入账、
              差异 = 投注 − 派彩（>0 标红、&lt;0 标绿）；末行 总收入 = 各游戏投注合计、总支出 = 各游戏派彩合计、
              总差异 = 总收入 − 总支出；其他收入 / 其他支出单列展示，不计入这三项合计
            </span>
          </div>
          <div class="toolbar-actions">
            <el-button link type="primary" @click="toggleSummary">
              {{ summaryVisible ? '收起统计' : '展开统计' }}
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        v-show="summaryVisible"
        v-loading="summaryLoading"
        border
        size="small"
        class="data-table summary-table"
        :data="summaryRows"
        max-height="260"
        show-summary
        :summary-method="summaryMethod"
      >
        <!-- 一行三款游戏：每款占 4 列（游戏 / 投注 / 派彩 / 差异），按列组循环生成 -->
        <template v-for="(_n, index) in GAMES_PER_ROW" :key="`block-${index}`">
          <el-table-column label="游戏" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag v-if="row.blocks[index]?.other" type="info" size="small">其他（无游戏标记）</el-tag>
              <span v-else-if="row.blocks[index]">{{ row.blocks[index].label }}</span>
            </template>
          </el-table-column>
          <el-table-column label="投注" align="right" width="125">
            <template #default="{ row }">
              <span v-if="row.blocks[index]?.other" class="font-mono">
                <span class="cell-sub">收入</span>{{ formatMoney(row.blocks[index].otherIncome) }}
              </span>
              <span v-else-if="row.blocks[index]" class="font-mono">
                {{ formatMoney(row.blocks[index].bet) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="派彩" align="right" width="125">
            <template #default="{ row }">
              <span v-if="row.blocks[index]?.other" class="font-mono">
                <span class="cell-sub">支出</span>{{ formatMoney(row.blocks[index].otherExpense) }}
              </span>
              <span v-else-if="row.blocks[index]" class="font-mono">
                {{ formatMoney(row.blocks[index].payout) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="差异" align="right" width="125">
            <template #default="{ row }">
              <span v-if="row.blocks[index]?.other" class="font-mono">—</span>
              <span v-else-if="row.blocks[index]" class="font-mono" :class="diffClass(row.blocks[index].diff)">
                {{ formatSigned(row.blocks[index].diff) }}
              </span>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>账户流水</h3>
            <el-tag v-if="queryParams.uid" type="primary" class="ml-1">UID：{{ queryParams.uid }}</el-tag>
            <span v-else class="text-gray-400 text-sm">默认查询当天流水；从用户列表点击 UID 进入可查看单个用户流水</span>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" plain icon="Refresh" @click="refreshAll">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="refreshAll" />
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
import { getWalletLedgerSummary, listLedgerGameCodes, listWalletLedger } from '@/api/member/ledger';
import type { GameCodeOption, WalletLedgerQuery, WalletLedgerSummaryVO, WalletLedgerVO } from '@/api/member/ledger/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { computed, onMounted, reactive, ref, toRefs, watch } from 'vue';
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
const summary = ref<WalletLedgerSummaryVO>({});
const { loading: summaryLoading, withLoading: withSummaryLoading } = useLoading(true);
/** 统计面板默认隐藏（需求：默认隐藏「投注/派彩统计」）；展开后才请求统计接口，避免白跑一次聚合查询 */
const summaryVisible = ref(false);
const { dateRange, applyDateRange } = useDateRangeQuery();

/**
 * 默认查询区间：当天 00:00:00 ~ 23:59:59。
 *
 * 需求：进入流水列表默认只查「创建时间为当天」的流水（全量历史既慢又不好读）。
 * 重置按钮复用同一函数，保证「重置」= 回到页面初始态，而不是清空成无时间条件。
 */
const todayRange = (): string[] => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return [`${day} 00:00:00`, `${day} 23:59:59`];
};
dateRange.value = todayRange();
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

/**
 * 统计表一行展示的游戏款数（需求：一行三款；每款 4 列 = 游戏名(game_code) | 投注 | 派彩 | 差异，
 * 因此一行共 12 列）。
 */
const GAMES_PER_ROW = 3;

/**
 * 统计项：各游戏 + 一项「其他（无游戏标记）」。
 *
 * 游戏行：投注 = 扣款合计、派彩 = 入账合计、差异 = 投注 − 派彩（>0 红、<0 绿）。
 * 「其他」行与游戏对齐占同一组列位，但两格分别是其他收入 / 其他支出（单元格内带「收入 / 支出」副标），
 * 且**不计入**末行总收入 / 总支出 / 总差异（需求明确）。
 *
 * 只有查询区间内确实统计到流水时才补「其他」，避免空区间出现一整行 0 的假数据行。
 */
const summaryItems = computed<Array<Record<string, any>>>(() => {
  const data = summary.value;
  const items: Array<Record<string, any>> = (data.games ?? []).map((game) => ({
    key: `game-${game.gameCode}`,
    // 游戏名(game_code)：有中文名时显示「中文名(代码)」，字典缺失时只显示代码
    label: game.gameName ? `${game.gameName}(${game.gameCode})` : String(game.gameCode ?? ''),
    bet: game.betAmount ?? 0,
    payout: game.payoutAmount ?? 0,
    diff: Number(game.betAmount ?? 0) - Number(game.payoutAmount ?? 0),
    other: false
  }));
  if (items.length > 0 || Number(data.otherIncome ?? 0) !== 0 || Number(data.otherExpense ?? 0) !== 0) {
    items.push({
      key: 'other',
      label: '其他（无游戏标记）',
      otherIncome: data.otherIncome ?? 0,
      otherExpense: data.otherExpense ?? 0,
      other: true
    });
  }
  return items;
});

/** 差异配色：>0 标红（投注多于派彩）、<0 标绿（派彩多于投注）、=0 不上色 */
const diffClass = (diff?: number) => {
  const value = Number(diff ?? 0);
  if (value > 0) {
    return 'diff-positive';
  }
  return value < 0 ? 'diff-negative' : '';
};

/** 一行三款游戏：每 3 项成一行，不足 3 项的位置留空（保持 3 组列位对齐） */
const summaryRows = computed<Array<{ key: string; blocks: Array<Record<string, any> | undefined> }>>(() => {
  const items = summaryItems.value;
  const rows: Array<{ key: string; blocks: Array<Record<string, any> | undefined> }> = [];
  for (let i = 0; i < items.length; i += GAMES_PER_ROW) {
    const blocks: Array<Record<string, any> | undefined> = [];
    for (let j = 0; j < GAMES_PER_ROW; j++) {
      blocks.push(items[i + j]);
    }
    rows.push({ key: `stat-row-${i}`, blocks });
  }
  return rows;
});

/**
 * 统计表末行：总收入 / 总支出。
 *
 * 为什么用服务端合计而不是对展示行求和：统计口径（含被 max-height 滚出视野的行）只能由服务端定义，
 * 前端求和会在「加了新分组 / 分页截断」时悄悄算错。
 */
const summaryMethod = ({ columns }: { columns: unknown[] }) => {
  // 末行按「每款游戏一组列」排布：第 1 组总收入、第 2 组总支出、第 3 组总差异
  const totalIncome = Number(summary.value.betTotal ?? 0);      // 总收入 = 各游戏投注合计
  const totalExpense = Number(summary.value.payoutTotal ?? 0);  // 总支出 = 各游戏派彩合计
  const totals = [
    '总收入', formatMoney(totalIncome), '', '',
    '总支出', formatMoney(totalExpense), '', '',
    '总差异', formatSigned(totalIncome - totalExpense), '', ''
  ];
  return columns.map((_column, index) => totals[index] ?? '');
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listWalletLedger(applyDateRange(queryParams.value));
    ledgerList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

/**
 * 统计与列表同条件，但只在「查询 / 重置 / 手动刷新」时加载：统计不分页，翻页不必重算。
 * 面板默认隐藏：隐藏时直接跳过，不白白发一次聚合查询。
 */
const loadSummary = async () => {
  if (!summaryVisible.value) {
    return;
  }
  await withSummaryLoading(async () => {
    const res = await getWalletLedgerSummary(applyDateRange(queryParams.value));
    summary.value = res.data ?? {};
  });
};

/** 展开 / 收起统计面板；展开时才首次取数 */
const toggleSummary = () => {
  summaryVisible.value = !summaryVisible.value;
  if (summaryVisible.value) {
    loadSummary();
  }
};

const refreshAll = async () => {
  await Promise.all([getList(), loadSummary()]);
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  refreshAll();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    // 重置 = 回到「当天 + VND」的初始态（与默认查询条件一致）
    dateRange.value = todayRange();
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

<style scoped>
.summary-tip {
  color: #909399;
  font-size: 12px;
}

/* 差异配色（需求：>0 标红、<0 标绿） */
.diff-positive {
  color: #dc2626;
}

.diff-negative {
  color: #16a34a;
}

/* 其他收入 / 其他支出 的单元格副标（与游戏的投注/派彩区分开） */
.cell-sub {
  margin-right: 4px;
  color: #909399;
  font-size: 12px;
}
</style>
