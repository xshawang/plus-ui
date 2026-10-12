<template>
  <div class="p-2 app-container risk-alert-log-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="监测类型">
          <el-select v-model="queryParams.monitorType" placeholder="全部类型" clearable style="width: 190px">
            <el-option label="高倍爆奖" :value="1" />
            <el-option label="高倍爆奖中奖金额" :value="2" />
            <el-option label="大额中奖" :value="3" />
            <el-option label="会员获利比" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒结局">
          <el-select v-model="queryParams.result" placeholder="全部" clearable style="width: 180px">
            <el-option label="已推送" value="SENT" />
            <el-option label="未推送（开关关闭）" value="SKIPPED_OFF" />
            <el-option label="未推送（限频跳过）" value="SKIPPED_LIMIT" />
            <el-option label="推送失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：每一次派奖命中都留一行——已推送（SENT）/ 未推送（开关关闭 SKIPPED_OFF）/ 未推送（限频跳过 SKIPPED_LIMIT）/ 推送失败（FAILED）；
        接收人按「拥有派奖监控权限的管理员 ∪ 超管」定向，接收人数为 0 表示当时无人持有权限（实际退化为群发）。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="记录时间" prop="createdAt" align="center" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="监测类型" prop="monitorTypeText" align="center" width="150" />
        <el-table-column label="提醒结局" align="center" width="150">
          <template #default="{ row }">
            <el-tag :type="resultTagType(row.result)">{{ row.resultText || row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="派奖金额" prop="payoutAmount" align="right" width="120" />
        <el-table-column label="注单编号" prop="orderNo" align="left" min-width="220" show-overflow-tooltip />
        <el-table-column label="接收人数" prop="receiverCount" align="center" width="100" />
        <el-table-column label="接收人" prop="receivers" align="left" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.receivers || '—（群发）' }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="left" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
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

<script setup lang="ts" name="RiskAlertLog">
import { reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { listRiskAlertLog } from '@/api/risk/alertlog';
import type { RiskAlertLogQuery, RiskAlertLogVO } from '@/api/risk/alertlog/types';

type AnyRow = Record<string, any>;

const { loading, withLoading } = useLoading(true);
const rows = ref<RiskAlertLogVO[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);

const data = reactive<{ queryParams: RiskAlertLogQuery }>({
  queryParams: { pageNum: 1, pageSize: 10 }
});
const { queryParams } = toRefs(data);

/** 与派奖监控页一致：时间区间走 RuoYi 的 params.beginTime/endTime 约定。 */
const buildQuery = (): RiskAlertLogQuery => {
  const params: Record<string, any> = {};
  if (dateRange.value && dateRange.value.length === 2) {
    params.beginTime = dateRange.value[0];
    params.endTime = dateRange.value[1];
  }
  return { ...queryParams.value, params };
};

const getList = async () => {
  await withLoading(async () => {
    try {
      const res: any = await listRiskAlertLog(buildQuery());
      rows.value = (res?.data?.rows ?? res?.rows ?? []) as RiskAlertLogVO[];
      total.value = res?.data?.total ?? res?.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
    }
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  dateRange.value = null;
  getList();
};

/** 结局标签色：已推送=成功、失败=危险、两种跳过=提示色。 */
const resultTagType = (result?: string) =>
  result === 'SENT' ? 'success' : result === 'FAILED' ? 'danger' : 'warning';

const formatTime = (value?: string) => (value ? String(value).replace('T', ' ').slice(0, 19) : '—');

getList();
</script>

<style scoped>
.search-panel {
  margin-bottom: 8px;
}
</style>
