<template>
  <div class="p-2 app-container promotion-rebate-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>实时返水</h3>
            <p>返水按「币种 + 游戏分类」唯一生效，比例与封顶可配置；返水入账与发放明细一一对应。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="返水设置" name="setting" />
        <el-tab-pane label="返水活动列表" name="config" />
        <el-tab-pane label="返水明细" name="record" />
      </el-tabs>

      <template v-if="activeTab === 'setting'">
        <el-form v-loading="setting.loading" label-width="220px" class="config-form">
          <el-form-item label="实时返水总开关">
            <el-switch v-model="setting.values.rebate_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="默认结算周期">
            <el-select v-model="setting.values.default_period" style="width: 220px">
              <el-option label="实时" value="REALTIME" />
              <el-option label="按小时" value="HOUR" />
              <el-option label="按日" value="DAY" />
            </el-select>
          </el-form-item>
          <el-form-item label="最低返水可发放金额(分)">
            <el-input-number v-model="setting.values.min_rebate_amount" :min="0" :controls="false" style="width: 220px" />
          </el-form-item>
          <el-form-item label="返水是否需要稽核">
            <el-switch v-model="setting.values.require_turnover" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="返水稽核倍数">
            <el-input v-model="setting.values.turnover_multiple" style="width: 220px" />
          </el-form-item>
          <el-form-item>
            <el-button v-hasPermi="['promotion:config:edit']" type="primary" :loading="setting.saving" @click="saveSetting">保存设置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="activeTab === 'config'">
        <el-form inline class="query-bar">
          <el-form-item label="活动名称">
            <el-input v-model="query.configName" placeholder="请输入返水活动名称" clearable style="width: 190px" />
          </el-form-item>
          <el-form-item label="币种">
            <el-select v-model="query.currency" placeholder="全部" clearable style="width: 140px">
              <el-option label="VND" value="VND" />
              <el-option label="USDT" value="USDT" />
              <el-option label="THB" value="THB" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="toolbar-line">
          <el-button v-hasPermi="['promotion:rebate:edit']" type="primary" icon="Plus" @click="openConfigForm()">新增返水活动</el-button>
        </div>
        <el-table v-loading="loading" border :data="configRows">
          <el-table-column label="活动ID" prop="configId" align="center" width="100" />
          <el-table-column label="返水活动名称" prop="configName" min-width="180" show-overflow-tooltip />
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="游戏分类" prop="gameCategory" align="center" width="130" />
          <el-table-column label="返水口径" align="center" width="120">
            <template #default="{ row }">{{ rebateTypeText(row.rebateType) }}</template>
          </el-table-column>
          <el-table-column label="返水比例" align="right" width="110">
            <template #default="{ row }">{{ Number(row.rebateRate ?? 0).toFixed(4) }}%</template>
          </el-table-column>
          <el-table-column label="单次封顶" align="right" width="130">
            <template #default="{ row }">{{ Number(row.maxRebateAmount ?? 0) > 0 ? fmtMoney(row.maxRebateAmount) : '不限' }}</template>
          </el-table-column>
          <el-table-column label="结算周期" align="center" width="120">
            <template #default="{ row }">{{ settlePeriodText(row.settlePeriod) }}</template>
          </el-table-column>
          <el-table-column label="明细条数" prop="recordCount" align="right" width="110" />
          <el-table-column label="累计有效投注" align="right" width="150">
            <template #default="{ row }">{{ fmtMoney(row.totalBet) }}</template>
          </el-table-column>
          <el-table-column label="累计返水" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.totalRebate) }}</template>
          </el-table-column>
          <el-table-column label="活动时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ row.startAt || '--' }}</div>
              <div>{{ row.endAt || '--' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" :active-value="1" :inactive-value="0" @change="(val: number) => toggleConfig(row as PromoRebateConfigVO, val)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['promotion:rebate:edit']" link type="primary" @click="openConfigForm(row as PromoRebateConfigVO)">修改</el-button>
              <el-button link type="primary" @click="openDetail(row as PromoRebateConfigVO)">详情</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>

      <template v-else>
        <el-form inline class="query-bar">
          <el-form-item label="活动ID">
            <el-input-number v-model="query.configId" :min="0" :controls="false" style="width: 140px" />
          </el-form-item>
          <el-form-item label="会员账号">
            <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="待发放" :value="1" />
              <el-option label="已发放" :value="2" />
              <el-option label="发放失败" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="recordRows">
          <el-table-column label="记录ID" prop="recordId" align="center" width="110" />
          <el-table-column label="返水活动" prop="configName" min-width="160" show-overflow-tooltip />
          <el-table-column label="会员账号" prop="account" align="center" width="140" />
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="游戏分类" prop="gameCategory" align="center" width="120" />
          <el-table-column label="有效投注" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.validBetAmount) }}</template>
          </el-table-column>
          <el-table-column label="返水比例" align="right" width="110">
            <template #default="{ row }">{{ Number(row.rebateRate ?? 0).toFixed(4) }}%</template>
          </el-table-column>
          <el-table-column label="返水金额" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.rebateAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="recordStatusTag(row.status)">{{ recordStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结算周期键" prop="periodKey" align="center" width="150" />
          <el-table-column label="钱包单号" prop="bizNo" align="center" min-width="170" show-overflow-tooltip />
          <el-table-column label="创建时间" prop="createdAt" align="center" width="170" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>
    </el-card>

    <el-dialog v-model="configDialog.visible" :title="configDialog.title" width="700px" append-to-body destroy-on-close>
      <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-width="170px">
        <el-form-item label="返水活动名称" prop="configName">
          <el-input v-model="configForm.configName" maxlength="100" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-select v-model="configForm.currency" style="width: 200px">
            <el-option label="VND" value="VND" />
            <el-option label="USDT" value="USDT" />
            <el-option label="THB" value="THB" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏分类" prop="gameCategory">
          <el-select v-model="configForm.gameCategory" filterable allow-create style="width: 240px">
            <el-option label="电子" value="电子" />
            <el-option label="真人" value="真人" />
            <el-option label="体育" value="体育" />
            <el-option label="棋牌" value="棋牌" />
            <el-option label="捕鱼" value="捕鱼" />
            <el-option label="彩票" value="彩票" />
          </el-select>
        </el-form-item>
        <el-form-item label="返水口径">
          <el-select v-model="configForm.rebateType" style="width: 200px">
            <el-option label="有效投注" :value="1" />
            <el-option label="输额" :value="2" />
            <el-option label="净赢" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="返水比例(%)" prop="rebateRate">
          <el-input-number v-model="configForm.rebateRate" :min="0" :max="100" :precision="4" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="单笔最低有效投注(分)">
          <el-input-number v-model="configForm.minBetAmount" :min="0" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="单次返水封顶(分,0=不限)">
          <el-input-number v-model="configForm.maxRebateAmount" :min="0" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="结算周期">
          <el-select v-model="configForm.settlePeriod" style="width: 200px">
            <el-option label="实时" :value="1" />
            <el-option label="按分钟" :value="2" />
            <el-option label="按小时" :value="3" />
            <el-option label="按日" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低VIP等级">
          <el-input-number v-model="configForm.minVipLevel" :min="0" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="configTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="规则说明">
          <el-input v-model="configForm.ruleDesc" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="configForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitConfig">确认</el-button>
        <el-button @click="configDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" title="返水活动详情" width="860px" append-to-body destroy-on-close>
      <el-descriptions v-loading="detailDialog.loading" :column="2" border>
        <el-descriptions-item label="活动ID">{{ detail.configId }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ detail.configName }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ detail.currency }}</el-descriptions-item>
        <el-descriptions-item label="游戏分类">{{ detail.gameCategory }}</el-descriptions-item>
        <el-descriptions-item label="返水口径">{{ rebateTypeText(detail.rebateType) }}</el-descriptions-item>
        <el-descriptions-item label="返水比例">{{ Number(detail.rebateRate ?? 0).toFixed(4) }}%</el-descriptions-item>
        <el-descriptions-item label="单次封顶">
          {{ Number(detail.maxRebateAmount ?? 0) > 0 ? fmtMoney(detail.maxRebateAmount) : '不限' }}
        </el-descriptions-item>
        <el-descriptions-item label="结算周期">{{ settlePeriodText(detail.settlePeriod) }}</el-descriptions-item>
        <el-descriptions-item label="参与人数">{{ detail.summary?.playerCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="有效投注合计">{{ fmtMoney(detail.summary?.totalBet) }}</el-descriptions-item>
        <el-descriptions-item label="返水合计">{{ fmtMoney(detail.summary?.totalRebate) }}</el-descriptions-item>
        <el-descriptions-item label="明细条数">{{ detail.summary?.recordCount ?? 0 }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.categoryBreakdown ?? []" border class="detail-table">
        <el-table-column label="游戏分类" prop="gameCategory" align="center" />
        <el-table-column label="有效投注" align="right">
          <template #default="{ row }">{{ fmtMoney(row.totalBet) }}</template>
        </el-table-column>
        <el-table-column label="返水金额" align="right">
          <template #default="{ row }">{{ fmtMoney(row.totalRebate) }}</template>
        </el-table-column>
        <el-table-column label="明细条数" prop="recordCount" align="right" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="PromotionRebate" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  getPromoRebateDetail,
  listPromoRebateConfig,
  listPromoRebateRecord,
  savePromoRebateConfig,
  togglePromoRebateConfig
} from '@/api/promotion/rebate';
import type { PromoRebateConfigVO, PromoRebateQuery } from '@/api/promotion/rebate/types';
import { usePromoKvConfig } from '@/views/promotion/components/usePromoKvConfig';

/**
 * 实时返水页（需求文档 05）。
 *
 * 设计要点：
 *   ① 公共设置（总开关/默认周期/稽核）走 KV 配置，活动维度参数走返水活动配置表；
 *   ② 同币种同游戏分类只允许一个启用中的返水活动，重复启用由后端直接拒绝（避免同一注单重复返水）；
 *   ③ 返水明细的 bizNo 即钱包幂等键，页面可直接与钱包流水核对。
 */
type Row = Record<string, any>;

const { loading, withLoading } = useLoading();
const { loading: saving, withLoading: withSaving } = useLoading();

const activeTab = ref('setting');
const configRows = ref<PromoRebateConfigVO[]>([]);
const recordRows = ref<Row[]>([]);
const total = ref(0);
const query = reactive<PromoRebateQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10 });

const configFormRef = ref();
const configDialog = reactive({ visible: false, title: '' });
const configTime = ref<string[]>([]);
const configForm = reactive({
  configId: undefined as number | undefined,
  configName: '',
  currency: 'VND',
  gameCategory: '电子',
  rebateType: 1,
  rebateRate: 0,
  minBetAmount: 0,
  maxRebateAmount: 0,
  settlePeriod: 1,
  minVipLevel: 0,
  startAt: undefined as string | undefined,
  endAt: undefined as string | undefined,
  ruleDesc: '',
  enabled: 1
});

const configRules = {
  configName: [{ required: true, message: '返水活动名称不能为空', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
  gameCategory: [{ required: true, message: '请选择游戏分类', trigger: 'change' }],
  rebateRate: [{ required: true, message: '请输入返水比例', trigger: 'blur' }]
};

const detailDialog = reactive({ visible: false, loading: false });
const detail = reactive<Row>({ categoryBreakdown: [] });

const setting = usePromoKvConfig('rebate-setting', [
  { key: 'rebate_enabled', label: '实时返水总开关', type: 'switch' },
  { key: 'default_period', label: '默认结算周期', type: 'select' },
  { key: 'min_rebate_amount', label: '最低返水可发放金额', type: 'number' },
  { key: 'require_turnover', label: '返水是否需要稽核', type: 'switch' },
  { key: 'turnover_multiple', label: '返水稽核倍数', type: 'json' }
]);

const fmtMoney = (value?: number) =>
  value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

const rebateTypeText = (type?: number) => ({ 1: '有效投注', 2: '输额', 3: '净赢' } as Record<number, string>)[type ?? -1] ?? '未知';

const settlePeriodText = (type?: number) =>
  ({ 1: '实时', 2: '按分钟', 3: '按小时', 4: '按日' } as Record<number, string>)[type ?? -1] ?? '未知';

const recordStatusText = (status?: number) => ({ 1: '待发放', 2: '已发放', 3: '发放失败' } as Record<number, string>)[status ?? -1] ?? '未知';

const recordStatusTag = (status?: number) => (status === 2 ? 'success' : status === 3 ? 'danger' : 'warning');

const loadRows = async () => {
  await withLoading(async () => {
    if (activeTab.value === 'config') {
      const res = (await listPromoRebateConfig(query)) as { rows?: PromoRebateConfigVO[]; total?: number };
      configRows.value = res.rows ?? [];
      total.value = res.total ?? 0;
      return;
    }
    const res = (await listPromoRebateRecord(query)) as { rows?: Row[]; total?: number };
    recordRows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleTabChange = async () => {
  query.pageNum = 1;
  configRows.value = [];
  recordRows.value = [];
  total.value = 0;
  if (activeTab.value === 'setting') {
    await setting.load();
    return;
  }
  await loadRows();
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, { pageNum: 1, pageSize: 10, configId: undefined, configName: undefined, currency: undefined, account: undefined, status: undefined });
  loadRows();
};

const openConfigForm = (row?: PromoRebateConfigVO) => {
  configDialog.title = row ? '修改返水活动' : '新增返水活动';
  configDialog.visible = true;
  configTime.value = row?.startAt && row?.endAt ? [row.startAt, row.endAt] : [];
  Object.assign(configForm, {
    configId: row?.configId,
    configName: row?.configName ?? '',
    currency: row?.currency ?? 'VND',
    gameCategory: row?.gameCategory ?? '电子',
    rebateType: row?.rebateType ?? 1,
    rebateRate: row?.rebateRate ?? 0,
    minBetAmount: row?.minBetAmount ?? 0,
    maxRebateAmount: row?.maxRebateAmount ?? 0,
    settlePeriod: row?.settlePeriod ?? 1,
    minVipLevel: row?.minVipLevel ?? 0,
    startAt: row?.startAt,
    endAt: row?.endAt,
    ruleDesc: row?.ruleDesc ?? '',
    enabled: row?.enabled ?? 1
  });
};

const submitConfig = async () => {
  await configFormRef.value.validate();
  configForm.startAt = configTime.value?.[0];
  configForm.endAt = configTime.value?.[1];
  await withSaving(async () => {
    await savePromoRebateConfig(configForm);
  });
  modal.msgSuccess('保存成功');
  configDialog.visible = false;
  await loadRows();
};

const toggleConfig = async (row: PromoRebateConfigVO, enabled: number) => {
  try {
    await togglePromoRebateConfig(row.configId, enabled);
    modal.msgSuccess(enabled === 1 ? '返水活动已启用' : '返水活动已停用');
  } finally {
    await loadRows();
  }
};

const openDetail = async (row: PromoRebateConfigVO) => {
  detailDialog.visible = true;
  detailDialog.loading = true;
  try {
    const res = (await getPromoRebateDetail(row.configId)) as { data?: Row };
    Object.assign(detail, { categoryBreakdown: [], ...(res.data ?? {}) });
  } finally {
    detailDialog.loading = false;
  }
};

const saveSetting = async () => {
  await setting.save();
  modal.msgSuccess('保存成功');
  await setting.load();
};

onMounted(async () => {
  await setting.load();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.query-bar {
  margin-top: 8px;
}

.toolbar-line {
  margin: 8px 0;
}

.config-form {
  max-width: 900px;
  margin-top: 12px;
}

.detail-table {
  margin-top: 12px;
}
</style>
