<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true">
        <el-form-item label="维度">
          <el-select v-model="queryParams.dimension" clearable placeholder="全部" style="width: 120px">
            <el-option label="IP" value="ip" />
            <el-option label="设备" value="device" />
            <el-option label="账号" value="uid" />
            <el-option label="全局" value="global" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险键">
          <el-input v-model="queryParams.key" placeholder="IP / 设备指纹 / uid" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="生效中" style="width: 130px">
            <el-option label="生效中" value="ACTIVE" />
            <el-option label="已释放" value="RELEASED" />
            <el-option label="仅告警" value="ALARM" />
            <el-option label="dry-run" value="DRY_RUN" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- FIX-10：下注频率观测（dry-run 只统计不拦截）。用途＝给"是否限频、阈值定多少"提供真实分布。 -->
    <el-card shadow="hover" class="mb-3">
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h3>下注频率观测（dry-run，不拦截）</h3>
            <p class="text-gray-500 text-sm">
              历史峰值笔/秒（近 1 天；主口径＝钱包流水锚点异步采集，兼容网关钩子旧口径）。用于标定业务层限频阈值；当前不对任何下注做拦截。
            </p>
          </div>
          <el-button icon="Refresh" @click="getBetPeaks">刷新</el-button>
        </div>
      </template>
      <!-- 列表为空时给出结论式提示：区分"采集链路没工作"与"确实没有高频下注" -->
      <el-alert
        v-if="!peakLoading && betPeaks.length === 0"
        type="info"
        :closable="false"
        class="mb-2"
        :title="betMeta?.emptyReason || '暂无下注频率数据'"
      >
        <div class="text-xs text-gray-500 mt-1">
          采集源：{{ betMeta?.source || '—' }} · 最后锚点：{{ fmtMillis(betMeta?.lastAnchorAt) }} · 已处理锚点：{{
            betMeta?.anchorsHandled ?? '—'
          }}
          条 · 网关钩子：{{ betMeta?.gatewayHookCount == null ? '未触发' : '已触发' }}
        </div>
      </el-alert>
      <el-table v-loading="peakLoading" border :data="betPeaks" max-height="260">
        <el-table-column label="#" type="index" width="60" align="center" />
        <el-table-column label="uid" prop="uid" min-width="200" />
        <el-table-column label="峰值(笔/秒)" prop="peakPerSecond" align="center" width="140">
          <template #default="{ row }">
            <el-tag :type="row.peakPerSecond >= 5 ? 'danger' : row.peakPerSecond >= 3 ? 'warning' : 'info'">
              {{ row.peakPerSecond }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">
            <span v-if="row.peakPerSecond >= 5" class="text-red-500">明显高于正常节奏，建议纳入阈值候选</span>
            <span v-else-if="row.peakPerSecond >= 3" class="text-orange-500">偏快，观察是否连点</span>
            <span v-else class="text-gray-400">正常节奏</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h3>风控中心</h3>
            <p class="text-gray-500 text-sm">共 {{ total }} 条记录；解封会立即清除网关封禁并通知全部网关实例。</p>
          </div>
          <el-button icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="时间" prop="createdAt" width="170" />
        <el-table-column label="维度" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="dimensionTag(row.riskDimension)">{{ row.riskDimension }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险键" prop="riskKey" min-width="180" show-overflow-tooltip />
        <el-table-column label="规则" prop="ruleType" width="130" />
        <el-table-column label="命中次数" prop="eventCount" align="center" width="90" />
        <el-table-column label="封禁(分钟)" prop="level" align="center" width="100" />
        <el-table-column label="到期时间" prop="banUntil" width="170">
          <template #default="{ row }">{{ row.banUntil || '—' }}</template>
        </el-table-column>
        <el-table-column label="来源网关" prop="gatewayId" width="150">
          <template #default="{ row }">{{ row.gatewayId || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="原因" prop="reason" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'ACTIVE'"
              v-hasPermi="['risk:center:release']"
              link
              type="danger"
              @click="handleRelease(row)"
            >
              解封
            </el-button>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-3 justify-end"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="RiskCenter" lang="ts">
import { getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { getBetPeaksMeta, listBetPeaks, listRiskRecords, releaseRisk } from '@/api/ops/risk-center';
import type { RiskBetPeaksMeta, RiskRecordQuery, RiskRecordVO } from '@/api/ops/risk-center/types';

const { proxy } = getCurrentInstance() as any;
const loading = ref(false);
const rows = ref<RiskRecordVO[]>([]);
const total = ref(0);
const betPeaks = ref<Array<{ uid: string; peakPerSecond: number }>>([]);
const peakLoading = ref(false);
const betMeta = ref<RiskBetPeaksMeta>();

const queryParams = reactive<RiskRecordQuery>({
  pageNum: 1,
  pageSize: 20,
  dimension: undefined,
  key: undefined,
  status: 'ACTIVE'
});

const getList = async () => {
  loading.value = true;
  try {
    const res: any = await listRiskRecords(queryParams);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

/**
 * 读取下注频率峰值榜 + 采集健康度（只读）。
 *
 * 为什么要一起读 meta：榜单为空时页面上只剩一张空表，运营无法区分"采集没工作"与
 * "确实没有高频下注"；meta 的 emptyReason / lastAnchorAt 直接给出结论（后端双读
 * 钱包锚点新键与网关钩子旧键，返回结构不变）。
 */
const getBetPeaks = async () => {
  peakLoading.value = true;
  try {
    const [peaksRes, metaRes]: any[] = await Promise.all([listBetPeaks(20), getBetPeaksMeta()]);
    betPeaks.value = peaksRes.data ?? [];
    betMeta.value = metaRes.data ?? undefined;
  } finally {
    peakLoading.value = false;
  }
};

/** epoch millis → 可读时间；空值显示 —（meta 里 lastAnchorAt 为 null 表示未消费到锚点）。 */
const fmtMillis = (value?: number | null) => {
  if (!value) return '—';
  const d = new Date(Number(value));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.dimension = undefined;
  queryParams.key = undefined;
  queryParams.status = 'ACTIVE';
  handleQuery();
};

/**
 * 解封：二次确认后调用后端（后端会写审计并把操作人记为当前登录账号）。
 * 为什么必须二次确认：解封会让已被拦截的 IP/设备立刻可以再连接，属于强处置动作。
 */
const handleRelease = async (row: RiskRecordVO) => {
  await proxy?.$modal.confirm(`确认解封 ${row.riskDimension}:${row.riskKey}？`);
  await releaseRisk({ dimension: row.riskDimension, key: row.riskKey });
  proxy?.$modal.msgSuccess('已解封');
  await getList();
};

const dimensionTag = (dim?: string) => {
  if (dim === 'ip') return 'warning';
  if (dim === 'device') return 'danger';
  if (dim === 'uid') return 'success';
  return 'info';
};

const statusTag = (status?: string) => {
  if (status === 'ACTIVE') return 'danger';
  if (status === 'RELEASED') return 'success';
  if (status === 'ALARM' || status === 'DRY_RUN') return 'warning';
  return 'info';
};

onMounted(() => {
  getList();
  getBetPeaks();
});
</script>
