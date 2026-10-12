<template>
  <div class="p-2 app-container member-big-player-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>大R提醒设置</h3>
            <p>按当日累计充值分档（单位 VND）；门槛必须依次递增，未配置时报表拒绝出数。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:big-player:edit']" type="primary" :loading="saving" @click="handleSaveConfig">保存档位</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="configLoading" label-width="160px">
        <el-form-item label="币种">
          <el-input v-model="currency" style="width: 160px" @change="loadAll" />
        </el-form-item>
        <el-form-item v-for="tier in tiers" :key="tier.type" :label="tier.label">
          <el-input-number
            v-model="configForm[tier.field]"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="≥ 当天累计充值（VND）"
            style="width: 240px"
          />
          <span class="ml-2 text-gray-400 text-sm">VND</span>
          <span class="ml-4">是否触发预警</span>
          <el-switch class="ml-2" v-model="alertForm[tier.field]" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>大R玩家报表</h3>
            <p>数据源：资金日汇总（GMT+7 归日），人数口径为当日达到本档且未达下一档的唯一会员数。</p>
          </div>
          <div class="toolbar-actions">
            <el-date-picker
              v-model="reportRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
            <el-button type="primary" icon="Search" :loading="reportLoading" @click="loadReport">查询</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="reportLoading" border :data="reportRows" show-summary :summary-method="summaryMethod">
        <el-table-column label="日期" prop="statDate" align="center" width="130" />
        <el-table-column label="币种" prop="currency" align="center" width="90" />
        <el-table-column label="小R人数" prop="smallRUserCount" align="right" width="110" />
        <el-table-column label="小R当日充值" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.smallRRechargeAmount) }}</template>
        </el-table-column>
        <el-table-column label="小R当日提现" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.smallRWithdrawAmount) }}</template>
        </el-table-column>
        <el-table-column label="中R人数" prop="mediumRUserCount" align="right" width="110" />
        <el-table-column label="中R当日充值" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.mediumRRechargeAmount) }}</template>
        </el-table-column>
        <el-table-column label="中R当日提现" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.mediumRWithdrawAmount) }}</template>
        </el-table-column>
        <el-table-column label="大R人数" prop="largeRUserCount" align="right" width="110" />
        <el-table-column label="大R当日充值" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.largeRRechargeAmount) }}</template>
        </el-table-column>
        <el-table-column label="大R当日提现" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.largeRWithdrawAmount) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="MemberBigPlayer" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { listBigPlayerConfig, listBigPlayerReport, saveBigPlayerConfig } from '@/api/member/big-player';
import type { BigPlayerConfigVO, BigPlayerReportVO } from '@/api/member/big-player/types';

type DataBody<T> = { data?: T };

const { loading: configLoading, withLoading: withConfigLoading } = useLoading(true);
const { loading: reportLoading, withLoading: withReportLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);

const currency = ref('VND');
const configRows = ref<BigPlayerConfigVO[]>([]);
const reportRows = ref<BigPlayerReportVO[]>([]);
const reportRange = ref<string[]>([]);

/** 表单以 VND 录入，提交时换算为分 */
const configForm = reactive<Record<string, number>>({ small: 0, medium: 0, large: 0 });
const alertForm = reactive<Record<string, number>>({ small: 1, medium: 1, large: 1 });

const tiers = [
  { type: 1, field: 'small', label: '小R玩家门槛' },
  { type: 2, field: 'medium', label: '中R玩家门槛' },
  { type: 3, field: 'large', label: '大R玩家门槛' }
];

const fmtYuan = (fen?: number) => {
  const value = Number(fen ?? 0) / 100;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const toFen = (yuan?: number) => Math.round(Number(yuan ?? 0) * 100);

const loadConfig = async () => {
  await withConfigLoading(async () => {
    const res = (await listBigPlayerConfig(currency.value)) as unknown as DataBody<BigPlayerConfigVO[]>;
    configRows.value = res.data ?? [];
    tiers.forEach((tier) => {
      const row = configRows.value.find((item) => item.playerType === tier.type);
      configForm[tier.field] = Number(row?.dailyRechargeThreshold ?? 0) / 100;
      alertForm[tier.field] = row?.alertEnabled ?? 1;
    });
  });
};

const loadReport = async () => {
  await withReportLoading(async () => {
    const res = (await listBigPlayerReport({
      currency: currency.value,
      startDate: reportRange.value?.[0],
      endDate: reportRange.value?.[1]
    })) as unknown as DataBody<BigPlayerReportVO[]>;
    reportRows.value = res.data ?? [];
  });
};

const loadAll = async () => {
  await loadConfig();
  await loadReport();
};

const handleSaveConfig = async () => {
  if (!(configForm.small < configForm.medium && configForm.medium <= configForm.large)) {
    modal.msgWarning('档位门槛必须满足：小R ≤ 中R ≤ 大R，且均大于 0');
    return;
  }
  if (configForm.small <= 0) {
    modal.msgWarning('档位门槛必须大于 0');
    return;
  }
  const res = (await withSaving(async () =>
    saveBigPlayerConfig({
      currency: currency.value,
      items: tiers.map((tier) => ({
        playerType: tier.type,
        dailyRechargeThreshold: toFen(configForm[tier.field]),
        alertEnabled: alertForm[tier.field]
      }))
    })
  )) as unknown as DataBody<number>;
  modal.msgSuccess(`保存成功（更新 ${res?.data ?? 0} 项）`);
  await loadAll();
};

/** 汇总行：人数与金额分别求和，避免金额列把人数也算进去 */
const summaryMethod = ({ columns, data }: { columns: Array<{ property?: string }>; data: BigPlayerReportVO[] }) => {
  const sums: string[] = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    const key = column.property as keyof BigPlayerReportVO | undefined;
    if (!key || typeof data[0]?.[key] !== 'number') {
      sums[index] = '';
      return;
    }
    const total = data.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
    sums[index] = key.toString().toLowerCase().includes('amount') ? fmtYuan(total) : String(total);
  });
  return sums;
};

onMounted(() => loadAll());
</script>
