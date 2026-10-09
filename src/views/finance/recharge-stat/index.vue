<template>
  <div class="p-2 app-container finance-recharge-stat-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="defaultTime"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item label="排名条数">
          <el-input-number v-model="limit" :min="1" :max="100" controls-position="right" style="width: 130px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="loading" @click="refreshAll">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置（最近 7 天）</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：<b>payment_order.type = 1 AND status = 2</b>（成功充值），金额单位「分」；
        通道成功率 = 成功笔数 ÷ 全部申请笔数；三方商户维度经
        <code>finance_channel_route.route_code = payment_order.bank_code</code> 关联商户档案。
        <span v-if="rangeText">当前区间：{{ rangeText }}</span>
      </div>
    </el-card>

    <el-card shadow="hover" class="search-panel">
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">成功充值金额</p>
            <p class="stat-value text-blue-500">{{ formatMoney(summary.successAmount ?? 0) }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">成功充值笔数</p>
            <p class="stat-value">{{ summary.successCount ?? 0 }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">充值会员数</p>
            <p class="stat-value">{{ summary.memberCount ?? 0 }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">客单价</p>
            <p class="stat-value">{{ formatMoney(summary.avgAmount ?? 0) }}</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>支付渠道分布与按日趋势</h3>
            <p>支付渠道取自 payment_order.channel（banks/ewallet/crypto/card）</p>
          </div>
        </div>
      </template>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-table v-loading="loading" border :data="channelRows" size="small">
            <el-table-column label="支付渠道" prop="channel" align="center" min-width="120" />
            <el-table-column label="成功笔数" prop="successCount" align="right" width="120" />
            <el-table-column label="成功金额" prop="successAmount" align="right" width="170" :formatter="moneyColumnFormatter" />
          </el-table>
        </el-col>
        <el-col :span="12">
          <el-table v-loading="loading" border :data="dailyRows" size="small" max-height="320">
            <el-table-column label="日期" prop="statDate" align="center" min-width="120" />
            <el-table-column label="成功笔数" prop="successCount" align="right" width="120" />
            <el-table-column label="成功金额" prop="successAmount" align="right" width="170" :formatter="moneyColumnFormatter" />
          </el-table>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>第三方统计 · 通道维度</h3>
            <p>共 {{ routeRows.length }} 条 · 通道编号对应 finance_channel_route.route_code</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="routeRows">
        <el-table-column label="通道编号" prop="routeCode" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="所属商户" prop="merchantName" align="left" min-width="190" show-overflow-tooltip />
        <el-table-column label="申请笔数" prop="totalCount" align="right" width="110" />
        <el-table-column label="成功笔数" prop="successCount" align="right" width="110" />
        <el-table-column label="成功率(%)" prop="successRate" align="right" width="120" />
        <el-table-column label="费率(%)" prop="feeRate" align="right" width="110" />
            <el-table-column label="成功金额" prop="successAmount" align="right" width="170" :formatter="moneyColumnFormatter" />
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>三方支付排名</h3>
            <p>按成功充值金额倒序 · 用于"可用三方支付 / 跑路高风险三方"评估</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rankingRows">
        <el-table-column label="名次" align="center" width="80">
          <template #default="{ row }">{{ row.__rank }}</template>
        </el-table-column>
        <el-table-column label="商户编码" prop="merchantCode" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="商户名称" prop="merchantName" align="left" min-width="190" show-overflow-tooltip />
        <el-table-column label="类型" align="center" width="120">
          <template #default="{ row }">
            <el-tag :type="row.merchantType === 2 ? 'warning' : 'success'">
              {{ row.merchantType === 2 ? '三方代付' : '三方支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="跑路风险" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.riskLevel === 1 ? 'danger' : row.riskLevel === 2 ? 'warning' : 'success'">
              {{ row.riskLevel === 1 ? '高' : row.riskLevel === 2 ? '中' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成功笔数" prop="successCount" align="right" width="120" />
        <el-table-column label="成功金额" prop="successAmount" align="right" width="180" :formatter="moneyColumnFormatter" />
      </el-table>
      <el-empty v-if="!loading && rankingRows.length === 0" :image-size="60" description="当前区间没有成功充值订单" />
    </el-card>
  </div>
</template>

<script setup name="FinanceRechargeStat" lang="ts">
import { computed, ref } from 'vue';
import {
  getRechargeStatSummary,
  listRechargeStatMerchantRanking,
  listRechargeStatRoute
} from '@/api/finance/recharge-stat';
import type {
  FinanceStatChannel,
  FinanceStatDaily,
  FinanceStatMerchantRank,
  FinanceStatRoute,
  FinanceStatSummary
} from '@/api/finance/recharge-stat/types';
import { formatMoney, moneyColumnFormatter } from '@/utils/money';

/**
 * 充值统计与渠道报表页（需求文档 2_财务/08）。
 *
 * 只读聚合页：不落统计表、不做写操作；时间范围缺省"最近 7 天"，与后端口径一致。
 */
const loading = ref(false);
const dateRange = ref<[string, string] | undefined>();
const limit = ref(10);
/** 日期范围默认时刻：按"当天 00:00:00 ~ 23:59:59"统计，避免默认 00:00:00~00:00:00 漏掉当天数据 */
const defaultTime: [Date, Date] = [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)];

const summary = ref<FinanceStatSummary>({});
const dailyRows = ref<FinanceStatDaily[]>([]);
const channelRows = ref<FinanceStatChannel[]>([]);
const routeRows = ref<FinanceStatRoute[]>([]);
const rankingRows = ref<Array<FinanceStatMerchantRank & { __rank: number }>>([]);
const rangeText = ref('');

const statQuery = computed(() => {
  const query: { beginTime?: string; endTime?: string; limit?: number } = { limit: limit.value };
  if (dateRange.value && dateRange.value.length === 2) {
    query.beginTime = dateRange.value[0];
    query.endTime = dateRange.value[1];
  }
  return query;
});

const refreshAll = async () => {
  loading.value = true;
  try {
    const [sumRes, routeRes, rankRes] = await Promise.all([
      getRechargeStatSummary(statQuery.value),
      listRechargeStatRoute(statQuery.value),
      listRechargeStatMerchantRanking(statQuery.value)
    ]);
    const data = sumRes.data;
    summary.value = data?.summary ?? {};
    dailyRows.value = data?.daily ?? [];
    channelRows.value = data?.channel ?? [];
    rangeText.value = data ? `${data.beginTime} ~ ${data.endTime}` : '';
    routeRows.value = routeRes.data ?? [];
    rankingRows.value = (rankRes.data ?? []).map((row, index) => ({ ...row, __rank: index + 1 }));
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  dateRange.value = undefined;
  limit.value = 10;
  refreshAll();
};

refreshAll();
</script>
