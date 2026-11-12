<template>
  <div>
    <el-form inline>
      <el-form-item label="日期">
        <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="活动ID">
        <el-input-number v-model="instanceId" :min="0" :controls="false" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="load">查询</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="12" class="summary">
      <el-col v-for="item in summaryCards" :key="item.key" :span="6">
        <el-card shadow="never">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-table v-loading="loading" border :data="rows">
      <el-table-column prop="statDate" label="统计日" width="120" />
      <el-table-column prop="instanceId" label="活动ID" width="120" />
      <el-table-column prop="activityCode" label="活动编码" min-width="190" />
      <el-table-column prop="activityTypeCode" label="活动类型" min-width="190" />
      <el-table-column prop="participantCount" label="参与人数" width="110" />
      <el-table-column prop="eligibleCount" label="达标周期" width="110" />
      <el-table-column prop="claimCount" label="领取次数" width="110" />
      <el-table-column prop="claimedUsers" label="领取人数" width="110" />
      <el-table-column label="已发金额" width="140">
        <template #default="{ row }">{{ money(row.claimedAmount) }}</template>
      </el-table-column>
      <el-table-column prop="failedCount" label="失败数" width="90" />
    </el-table>

    <el-card v-if="instanceId && rankingRows.length" shadow="never" class="ranking-card">
      <template #header>排行榜结算快照</template>
      <el-table border :data="rankingRows" max-height="420">
        <el-table-column prop="statDate" label="结算日" width="120" />
        <el-table-column prop="periodKey" label="周期" min-width="150" />
        <el-table-column prop="rankNo" label="名次" width="80" />
        <el-table-column prop="uid" label="UID" min-width="180" />
        <el-table-column prop="scoreValue" label="分数" width="140" />
        <el-table-column label="奖励" width="140">
          <template #default="{ row }">{{ money(row.rewardAmount) }}</template>
        </el-table-column>
        <el-table-column prop="grantOrderNo" label="领取单号" min-width="240" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getActivityEffectSummary, listActivityEffect, listActivityRanking } from '@/api/promotion/activity/effect';

const today = new Date();
const format = (date: Date) => date.toISOString().slice(0, 10);
const start = new Date(today);
start.setDate(start.getDate() - 7);
const range = ref<string[]>([format(start), format(today)]);
const instanceId = ref<number>();
const rows = ref<Array<Record<string, unknown>>>([]);
const rankingRows = ref<Array<Record<string, unknown>>>([]);
const summary = ref<Record<string, unknown>>({});
const loading = ref(false);

const summaryCards = computed(() => [
  { key: 'claimedUsers', label: '领取人数', value: summary.value.claimedUsers ?? 0 },
  { key: 'claimCount', label: '领取次数', value: summary.value.claimCount ?? 0 },
  { key: 'claimedAmount', label: '已发金额', value: money(summary.value.claimedAmount) },
  { key: 'failedCount', label: '失败次数', value: summary.value.failedCount ?? 0 }
]);

const query = () => ({
  instanceId: instanceId.value,
  startDate: range.value[0],
  endDate: range.value[1],
  pageNum: 1,
  pageSize: 100
});

const load = async () => {
  loading.value = true;
  try {
    const requests = [
      listActivityEffect(query()),
      getActivityEffectSummary(query())
    ];
    const [list, total] = await Promise.all(requests);
    rows.value = (list as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? [];
    summary.value = (total.data ?? {}) as unknown as Record<string, unknown>;
    if (instanceId.value) {
      const ranking = await listActivityRanking({
        instanceId: instanceId.value,
        startDate: range.value[0],
        limit: 500
      });
      rankingRows.value = (ranking.data as Array<Record<string, unknown>>) ?? [];
    } else {
      rankingRows.value = [];
    }
  } finally {
    loading.value = false;
  }
};

const money = (value: unknown) => Number(value ?? 0).toLocaleString('en-US');

onMounted(load);
</script>

<style scoped>
.summary {
  margin-bottom: 12px;
}

.label {
  color: #909399;
  font-size: 12px;
}

.value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 600;
}

.ranking-card {
  margin-top: 16px;
}
</style>
