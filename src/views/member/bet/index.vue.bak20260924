<template>
  <div class="p-2 app-container member-bet-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="游戏">
          <el-select v-model="queryParams.gameCode" placeholder="全部" clearable style="width: 180px">
            <el-option v-for="code in gameCodes" :key="code" :label="code" :value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">口径：会员输赢 = 派彩 − 投注（正=会员赢）；杀率 = -会员输赢 ÷ 有效投注；单次最多 92 天。</div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>会员投注细目</h3>
            <p>共 {{ total }} 行（会员 × 游戏 聚合，数据源：荷官桌注单）</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="会员ID" align="center" width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goDetail(row.uid)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="会员层级" prop="levelName" align="center" width="120">
          <template #default="{ row }">{{ row.levelName || '默认层级' }}</template>
        </el-table-column>
        <el-table-column label="游戏" align="center" min-width="140">
          <template #default="{ row }">{{ row.gameName || row.gameCode }}</template>
        </el-table-column>
        <el-table-column label="注单数量" prop="betCount" align="right" width="110" sortable />
        <el-table-column label="投注金额" align="right" width="140" sortable>
          <template #default="{ row }">{{ fmtFen(row.betAmount) }}</template>
        </el-table-column>
        <el-table-column label="有效投注" align="right" width="140">
          <template #default="{ row }">{{ fmtFen(row.validBetAmount) }}</template>
        </el-table-column>
        <el-table-column label="会员输赢" align="right" width="140">
          <template #default="{ row }">
            <span :class="Number(row.netWinLoss) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.netWinLoss) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="杀率" align="right" width="110">
          <template #default="{ row }">
            <span :class="Number(row.killRate) < 0 ? 'text-red-500' : ''">{{ Number(row.killRate ?? 0).toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTrend(row.uid)">输赢分析</el-button>
          </template>
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

    <el-dialog v-model="trend.visible" :title="'输赢分析 - 会员 ' + trend.uid" width="880px" append-to-body>
      <el-table v-loading="trend.loading" border :data="trend.rows" max-height="460">
        <el-table-column label="日期" prop="statDate" align="center" width="130" />
        <el-table-column label="注单数" prop="betCount" align="right" width="110" />
        <el-table-column label="投注金额" align="right" width="140">
          <template #default="{ row }">{{ fmtFen(row.betAmount) }}</template>
        </el-table-column>
        <el-table-column label="派彩金额" align="right" width="140">
          <template #default="{ row }">{{ fmtFen(row.payoutAmount) }}</template>
        </el-table-column>
        <el-table-column label="会员输赢" align="right" width="140">
          <template #default="{ row }">
            <span :class="Number(row.netWinLoss) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.netWinLoss) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="杀率" align="right" width="110">
          <template #default="{ row }">{{ Number(row.killRate ?? 0).toFixed(2) }}%</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="MemberBet" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import { listMemberBetDetail, listMemberBetGameCodes, listMemberWinLoss } from '@/api/member/bet';
import type { MemberBetDailyVO, MemberBetQuery, MemberBetSummaryVO } from '@/api/member/bet/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const router = useRouter();
const { loading, withLoading } = useLoading(true);
const rows = ref<MemberBetSummaryVO[]>([]);
const total = ref(0);
const gameCodes = ref<string[]>([]);
const dateRange = ref<string[]>([]);
const trend = reactive<{ visible: boolean; uid: number | string; rows: MemberBetDailyVO[]; loading: boolean }>({
  visible: false,
  uid: '',
  rows: [],
  loading: false
});

const data = reactive<{ queryParams: MemberBetQuery }>({
  queryParams: { pageNum: 1, pageSize: 10 }
});
const { queryParams } = toRefs(data);

const fmtFen = (fen?: number) => {
  const value = Number(fen ?? 0) / 100;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const buildQuery = (): MemberBetQuery => ({
  ...queryParams.value,
  startDate: dateRange.value?.[0],
  endDate: dateRange.value?.[1]
});

const getList = async () => {
  await withLoading(async () => {
    const res = (await listMemberBetDetail(buildQuery())) as unknown as PageBody<MemberBetSummaryVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const loadGameCodes = async () => {
  const res = (await listMemberBetGameCodes()) as unknown as DataBody<string[]>;
  gameCodes.value = res.data ?? [];
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  dateRange.value = [];
  getList();
};

const openTrend = async (uid: number | string) => {
  trend.uid = uid;
  trend.visible = true;
  trend.loading = true;
  try {
    const res = (await listMemberWinLoss(uid, dateRange.value?.[0], dateRange.value?.[1])) as unknown as DataBody<MemberBetDailyVO[]>;
    trend.rows = res.data ?? [];
  } finally {
    trend.loading = false;
  }
};

/** 跳会员详情页并自动查询（详情页从 query 读取 uid） */
const goDetail = (uid: number | string) => {
  const target = router.resolve({ path: '/member/detail' });
  if (target.matched.length === 0) {
    return;
  }
  router.push({ path: '/member/detail', query: { uid: String(uid) } });
};

onMounted(async () => {
  await loadGameCodes();
  await getList();
});
</script>
