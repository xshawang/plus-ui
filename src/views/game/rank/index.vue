<template>
  <div class="p-2 app-container game-rank-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true">
        <el-form-item label="游戏类型">
          <el-select v-model="query.gameType" placeholder="棋牌" clearable style="width: 130px" @change="getList">
            <el-option v-for="item in typeOptions" :key="item.typeCode" :label="item.typeName" :value="item.typeCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="query.platformId" placeholder="全部平台" clearable filterable style="width: 170px" @change="getList">
            <el-option v-for="item in platformList" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button v-hasPermi="['game:rank:export']" type="primary" plain icon="Download" @click="exportData">导出报表</el-button>
        </el-form-item>
      </el-form>
      <p class="tip">{{ memoText }}</p>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows" @sort-change="handleSortChange">
        <el-table-column label="统计日期" align="center" prop="statDate" width="120" />
        <el-table-column label="统计范围" align="center" prop="statRange" width="210" />
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="游戏类型" align="center" prop="gameTypeName" width="100" />
        <el-table-column label="平台ID" align="center" prop="platformId" width="90" />
        <el-table-column label="平台名称" align="center" prop="platformName" width="130" />
        <el-table-column label="游戏ID" align="center" prop="gameId" width="120" />
        <el-table-column label="子游戏名称" align="center" prop="gameName" min-width="160" />
        <el-table-column label="注单排名" align="center" prop="orderRank" width="100" />
        <el-table-column label="注单量" align="center" prop="orderCount" width="130" sortable="custom" />
        <el-table-column label="总投注" align="center" prop="totalBet" width="160" sortable="custom" />
        <el-table-column label="有效投注" align="center" prop="validBet" width="160" sortable="custom" />
        <el-table-column label="盈亏" align="center" prop="profit" width="150" sortable="custom">
          <template #default="{ row }">
            <span :class="row.profit < 0 ? 'text-red' : 'text-green'">{{ row.profit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="杀率" align="center" prop="killRate" width="100" sortable="custom">
          <template #default="{ row }">{{ row.killRate }}%</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:rank:addhot']" link type="primary" @click="addHot(row)">添加热门</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listGameRank, gameRankMemo, exportGameRank, addHotGame, gameTypeOptions, platformOptions as fetchPlatformOptions } from '@/api/game/manage';

defineOptions({ name: 'GameRank' });

const CURRENCY = 'VND1000:1';
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const typeOptions = ref<any[]>([]);
const platformList = ref<any[]>([]);
const memo = ref<Record<string, string>>({});
const query = reactive<any>({ pageNum: 1, pageSize: 10, gameType: 1, currency: CURRENCY, orderBy: 'orderCount', orderDir: 'desc' });

const memoText = computed(() => Object.values(memo.value).join('；'));

async function getList() {
  loading.value = true;
  try {
    const res: any = await listGameRank(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, platformId: undefined, orderBy: 'orderCount', orderDir: 'desc' });
  getList();
}

function handleSortChange({ prop, order }: any) {
  if (!prop || !order) {
    query.orderBy = 'orderCount';
    query.orderDir = 'desc';
  } else {
    query.orderBy = prop;
    query.orderDir = order === 'ascending' ? 'asc' : 'desc';
  }
  getList();
}

async function exportData() {
  const data: any = ((await exportGameRank(query)) as unknown as any)?.data;
  if (!data || !data.length) {
    ElMessage.warning('暂无可导出数据');
    return;
  }
  const header = Object.keys(data[0]).join(',');
  const body = data.map((row: any) => Object.values(row).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `游戏全网排名_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** 添加热门：写入当前生效的热门模板，重复点击幂等 */
async function addHot(row: any) {
  const added: any = ((await addHotGame({ providerCode: row.providerCode, gameCode: row.gameId, currency: row.currency })) as unknown as any)?.data;
  ElMessage.success(added ? '已添加到热门模板' : '该游戏已在热门模板中');
}

onMounted(async () => {
  typeOptions.value = ((await gameTypeOptions(CURRENCY)) as unknown as any)?.data ?? [];
  platformList.value = ((await fetchPlatformOptions(undefined)) as unknown as any)?.data ?? [];
  memo.value = ((await gameRankMemo()) as unknown as any)?.data ?? {};
  getList();
});
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 12px;
  margin: 4px 0 0;
}
.text-red {
  color: #f56c6c;
}
.text-green {
  color: #67c23a;
}
</style>
