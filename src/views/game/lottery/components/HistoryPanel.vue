<template>
  <div>
    <el-form :inline="true">
      <el-form-item label="时间">
        <el-radio-group v-model="period" @change="applyPeriod">
          <el-radio-button value="DAY">日</el-radio-button>
          <el-radio-button value="WEEK">周</el-radio-button>
          <el-radio-button value="MONTH">月</el-radio-button>
        </el-radio-group>
        <el-date-picker v-model="range" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" class="ml"
                        start-placeholder="开始时间" end-placeholder="结束时间" style="width: 380px" />
      </el-form-item>
      <el-form-item label="币种">
        <el-select v-model="query.currency" placeholder="币种" clearable style="width: 160px">
          <el-option v-for="c in options.currencies" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="彩种名称(代码)">
        <el-select v-model="query.lotteryCode" placeholder="彩种" clearable filterable style="width: 200px">
          <el-option v-for="l in options.lotteries" :key="l.lotteryCode"
                     :label="`${l.lotteryName}(${l.lotteryCode})`" :value="String(l.lotteryCode)" />
        </el-select>
      </el-form-item>
      <el-form-item label="模块">
        <el-select v-model="query.module" placeholder="全部模块" clearable style="width: 140px">
          <el-option v-for="m in options.modules" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作内容">
        <el-select v-model="query.operateContent" placeholder="全部操作内容" clearable filterable
                   allow-create default-first-option style="width: 190px">
          <el-option v-for="c in options.operateContents" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="生效期数">
        <el-input v-model="query.issueNo" placeholder="请输入生效期数" clearable style="width: 170px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="load">搜索</el-button>
        <el-button icon="Refresh" @click="reset">重置</el-button>
        <el-button v-hasPermi="['game:lottery:history']" type="primary" plain icon="Download" @click="exportData">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" border :data="rows">
      <el-table-column label="币种" align="center" prop="currency" width="140" />
      <el-table-column label="彩种名称(代码)" align="center" prop="lotteryName" width="200" />
      <el-table-column label="操作期数" align="center" prop="issueNo" width="120" />
      <el-table-column label="生效期数" align="center" prop="effectiveIssue" width="120" />
      <el-table-column label="模块" align="center" prop="module" width="110" />
      <el-table-column label="操作内容" align="center" prop="operateContent" min-width="260" />
      <el-table-column label="操作行为" align="center" width="110">
        <template #default="{ row }">{{ ['—', '手工', '自动', '批量'][row.operateAction] ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="operatorId" width="110" />
      <el-table-column label="操作时间" align="center" prop="createdAt" width="180" />
    </el-table>
    <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { lotteryHistoryExport, lotteryHistoryList, lotteryHistoryOptions } from '@/api/game/lottery';

/**
 * 历史修改记录页签（截图「历史修改记录」）。
 *
 * 背景：截图筛选为「日/周/月 + 时间 + 币种 + 彩种名称(代码) + 模块 + 操作内容 + 生效期数」，
 * 全部为等值/模糊筛选，日志表只增不改，因此本页只做查询与导出。
 * 协作关系：/infra/game/lottery/history/* 接口。
 */
const props = defineProps<{ lotteryCode?: string; currency?: string }>();

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const period = ref('DAY');
const range = ref<any>([]);
const options = reactive<any>({ modules: [], actions: [], operateContents: [], currencies: [], lotteries: [] });
const query = reactive<any>({ pageNum: 1, pageSize: 10, currency: undefined, lotteryCode: undefined,
  module: undefined, operateContent: undefined, issueNo: undefined });

function applyPeriod() {
  const end = new Date();
  const start = new Date();
  if (period.value === 'WEEK') start.setDate(end.getDate() - 6);
  else if (period.value === 'MONTH') start.setMonth(end.getMonth() - 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  range.value = [fmt(start), fmt(end)];
  load();
}

async function load() {
  loading.value = true;
  try {
    const params: any = { ...query };
    if (range.value?.length === 2) {
      params.params = { beginTime: range.value[0], endTime: range.value[1] };
    }
    const res: any = await lotteryHistoryList(params);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function reset() {
  Object.assign(query, { pageNum: 1, currency: undefined, lotteryCode: undefined, module: undefined,
    operateContent: undefined, issueNo: undefined });
  applyPeriod();
}

async function exportData() {
  const params: any = { ...query };
  if (range.value?.length === 2) {
    params.params = { beginTime: range.value[0], endTime: range.value[1] };
  }
  const data: any = ((await lotteryHistoryExport(params)) as unknown as any)?.data;
  if (!data || !data.length) {
    ElMessage.warning('暂无可导出数据');
    return;
  }
  const header = Object.keys(data[0]).join(',');
  const body = data.map((row: any) => Object.values(row).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `WG彩历史修改记录_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

onMounted(async () => {
  Object.assign(options, ((await lotteryHistoryOptions()) as unknown as any)?.data ?? {});
  applyPeriod();
});
</script>

<style scoped>
.ml {
  margin-left: 8px;
}
</style>
