<template>
  <div class="p-2 app-container member-bet-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="时间">
          <el-radio-group v-model="period" @change="applyPeriod">
            <el-radio-button value="DAY">日</el-radio-button>
            <el-radio-button value="WEEK">周</el-radio-button>
            <el-radio-button value="MONTH">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <!-- 截图：账号检索维度下拉（精准/模糊/会员ID/上级代理ID/会员层级/渠道名称(ID)） -->
          <el-select v-model="query.accountField" style="width: 170px">
            <el-option label="精准会员账号" value="EXACT_ACCOUNT" />
            <el-option label="模糊会员账号" value="FUZZY_ACCOUNT" />
            <el-option label="会员ID" value="UID" />
            <el-option label="上级代理ID" value="PARENT_AGENT" />
            <el-option label="会员层级" value="MEMBER_LEVEL" />
            <el-option label="渠道名称(ID)" value="CHANNEL" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.accountValue" :placeholder="accountPlaceholder" clearable
                    style="width: 260px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.gameType" placeholder="请选择分类" clearable style="width: 150px">
            <el-option v-for="t in typeOptions" :key="t.typeCode" :label="t.typeName" :value="t.typeCode" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="primary" plain icon="Download" @click="exportData">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="table-heading">
          <h3>会员投注细目</h3>
          <span class="tip">口径：会员输赢 = 派彩 − 投注（负=会员输）；杀率 = 会员输赢 ÷ 有效投注；单次最多 92 天</span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="币种" align="center" prop="currency" width="120" />
        <el-table-column label="渠道名称(ID)" align="center" width="170">
          <template #default="{ row }">
            <div>{{ row.channelName || '—' }}</div>
            <div class="sub">({{ row.channelId || '—' }})</div>
          </template>
        </el-table-column>
        <el-table-column label="上级代理" align="center" width="130">
          <template #default="{ row }">{{ row.parentAgent || '—' }}</template>
        </el-table-column>
        <el-table-column label="会员账号(ID)" align="center" width="200">
          <template #default="{ row }">
            <div>{{ row.loginName || '—' }}</div>
            <div class="sub">({{ row.uid }})</div>
            <el-link type="primary" @click="openWinLoss(row)">输赢分析</el-link>
          </template>
        </el-table-column>
        <el-table-column label="会员层级" align="center" width="120">
          <template #default="{ row }">{{ row.memberLevel || '—' }}</template>
        </el-table-column>
        <el-table-column label="游戏类型" align="center" prop="gameTypeName" width="110" />
        <el-table-column label="游戏平台" align="center" prop="platformName" width="130" />
        <el-table-column label="游戏名称" align="center" prop="gameName" min-width="150" />
        <el-table-column label="注单数量" align="center" prop="betCount" width="120" sortable />
        <el-table-column label="投注金额" align="center" prop="betAmount" width="140" sortable />
        <el-table-column label="有效投注" align="center" prop="validBet" width="140" sortable />
        <el-table-column label="会员输赢" align="center" prop="memberWin" width="140" sortable>
          <template #default="{ row }">
            <span :class="row.memberWin < 0 ? 'text-red' : 'text-green'">{{ row.memberWin }}</span>
          </template>
        </el-table-column>
        <el-table-column label="杀率" align="center" width="110">
          <template #default="{ row }">{{ row.killRate }}%</template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 输赢分析（截图会员账号旁的「输赢分析」入口，数据源为既有 member:bet 接口） -->
    <el-dialog v-model="analysis.visible" :title="`输赢分析 - ${analysis.loginName}`" width="760px" append-to-body>
      <el-table :data="analysis.rows" height="360">
        <el-table-column label="日期" align="center" prop="statDate" width="130" />
        <el-table-column label="投注金额" align="center" prop="betAmount" />
        <el-table-column label="有效投注" align="center" prop="validBet" />
        <el-table-column label="会员输赢" align="center" prop="winAmount" />
        <el-table-column label="备注" align="center" prop="remark" />
      </el-table>
      <template #footer><el-button @click="analysis.visible = false">关 闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { memberBetDetailPage } from '@/api/game/bet';
import { gameTypeOptions } from '@/api/game/manage';
import { listMemberWinLoss } from '@/api/member/bet';

/**
 * 会员投注细目（截图「会员投注细目」）。
 *
 * 背景：截图列 = 币种 / 渠道名称(ID) / 上级代理 / 会员账号(ID) / 会员层级 / 游戏类型 / 游戏平台 /
 * 游戏名称 / 注单数量 / 投注金额 / 有效投注 / 会员输赢 / 杀率，会员账号旁有「输赢分析」入口；
 * 筛选支持 6 个检索维度（精准/模糊账号、会员ID、上级代理ID、会员层级、渠道名称(ID)）。
 * 数据源：本批次新增的 /infra/game/bet/member-detail/page（会员 × 游戏 聚合，join 会员画像/层级/渠道/代理）。
 * 协作关系：输赢分析复用会员域既有接口 /infra/member/bet/win-loss/{uid}，不重复实现。
 */
defineOptions({ name: 'MemberBetDetail' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const period = ref('DAY');
const dateRange = ref<any>([]);
const typeOptions = ref<any[]>([]);
const analysis = reactive<any>({ visible: false, loginName: '', rows: [] });
const query = reactive<any>({ pageNum: 1, pageSize: 10, accountField: 'FUZZY_ACCOUNT', accountValue: undefined,
  gameType: undefined, currency: 'VND1000:1' });

const accountPlaceholder = computed(() => {
  switch (query.accountField) {
    case 'EXACT_ACCOUNT':
      return '多个精准会员账号需用空格或逗号隔开，最多5个';
    case 'UID':
      return '请输入会员ID';
    case 'PARENT_AGENT':
      return '请输入上级代理账号';
    case 'MEMBER_LEVEL':
      return '请输入会员层级名称';
    case 'CHANNEL':
      return '请输入渠道名称或渠道ID';
    default:
      return '请输入会员账号';
  }
});

function applyPeriod() {
  const end = new Date();
  const start = new Date();
  if (period.value === 'WEEK') start.setDate(end.getDate() - 6);
  else if (period.value === 'MONTH') start.setMonth(end.getMonth() - 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dateRange.value = [fmt(start), fmt(end)];
  getList();
}

async function getList() {
  loading.value = true;
  try {
    const res: any = await memberBetDetailPage({
      ...query,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    });
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, accountField: 'FUZZY_ACCOUNT', accountValue: undefined, gameType: undefined });
  applyPeriod();
}

/** 输赢分析（复用会员域既有接口） */
async function openWinLoss(row: any) {
  analysis.loginName = row.loginName || row.uid;
  const data: any = ((await listMemberWinLoss(row.uid, dateRange.value?.[0], dateRange.value?.[1])) as unknown as any)?.data;
  analysis.rows = data ?? [];
  analysis.visible = true;
}

async function exportData() {
  if (!rows.value.length) {
    ElMessage.warning('暂无可导出数据');
    return;
  }
  const header = Object.keys(rows.value[0]).join(',');
  const body = rows.value.map((row) => Object.values(row).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `会员投注细目_${dateRange.value?.[0]}_${dateRange.value?.[1]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

onMounted(async () => {
  typeOptions.value = ((await gameTypeOptions('VND1000:1')) as unknown as any)?.data ?? [];
  applyPeriod();
});
</script>

<style scoped>
.table-heading h3 {
  margin: 0 0 4px;
  font-size: 15px;
}
.tip {
  color: #909399;
  font-size: 12px;
}
.sub {
  color: #909399;
  font-size: 12px;
}
.text-red {
  color: #f56c6c;
}
.text-green {
  color: #67c23a;
}
</style>
