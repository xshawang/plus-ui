<template>
  <div class="p-2 app-container game-bet-page">
    <el-card shadow="hover">
      <el-tabs v-model="tab" @tab-change="reload">
        <el-tab-pane label="投注明细" name="DETAIL" />
        <el-tab-pane label="投注统计" name="STAT" />
        <el-tab-pane label="主播号投注明细" name="STREAMER" />
        <el-tab-pane label="投注明细(按代理线)" name="AGENT" />
      </el-tabs>

      <el-form :inline="true">
        <el-form-item label="投注时间">
          <el-date-picker v-model="range" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
                          start-placeholder="开始时间" end-placeholder="结束时间" style="width: 380px" />
        </el-form-item>
        <el-form-item v-if="tab === 'STAT' || tab === 'DETAIL'" :label="tab === 'STAT' ? '会员账号' : ''">
          <el-select v-model="query.accountField" style="width: 140px">
            <el-option v-for="f in accountFields" :key="f" :label="fieldLabel(f)" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.accountValue" :placeholder="accountPlaceholder" clearable style="width: 220px" @keyup.enter="reload" />
        </el-form-item>
        <el-form-item v-if="tab === 'AGENT'" label="上级代理账号">
          <el-input v-model="query.parentAgent" placeholder="请输入上级代理账号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item v-if="tab === 'DETAIL' || tab === 'AGENT'" label="结算状态">
          <el-select v-model="query.settleStatus" placeholder="结算状态" clearable style="width: 130px">
            <el-option label="已结算" :value="1" /><el-option label="未结算" :value="2" />
            <el-option label="已取消" :value="3" /><el-option label="已退款" :value="4" /><el-option label="风控挂起" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab !== 'STAT'" label="投注金额">
          <el-input-number v-model="query.betAmountMin" :min="0" placeholder="最小" controls-position="right" style="width: 130px" />
          <span class="mx">-</span>
          <el-input-number v-model="query.betAmountMax" :min="0" placeholder="最大" controls-position="right" style="width: 130px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="reload">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <p class="tip" v-if="tab !== 'STAT'">{{ options.tip }}</p>

      <!-- 投注明细类（三页签共用一个表格，按页签裁剪列） -->
      <template v-if="tab !== 'STAT'">
        <el-table v-loading="loading" border :data="rows" @selection-change="selection = $event">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="注单编号" align="center" prop="bizNo" width="200" />
          <el-table-column label="牌局编号" align="center" prop="roundNo" width="140" />
          <el-table-column v-if="tab === 'STREAMER'" label="主播号(ID)" align="center" width="150">
            <template #default="{ row }">{{ row.streamerId || row.uid }}</template>
          </el-table-column>
          <template v-else>
            <el-table-column label="会员账号(ID)" align="center" width="170">
              <template #default="{ row }">
                <div>{{ row.loginName }}</div>
                <div class="sub">({{ row.uid }})</div>
              </template>
            </el-table-column>
            <template v-if="tab === 'AGENT'">
              <el-table-column label="上级代理账号(ID)" align="center" prop="parentAgent" width="170" />
              <el-table-column label="顶层代理账号(ID)" align="center" prop="topAgent" width="170" />
            </template>
          </template>
          <el-table-column label="子游戏名称(平台名称)" align="center" width="190">
            <template #default="{ row }">
              <div>{{ row.gameName }}</div>
              <div class="sub">({{ row.platformName }})</div>
            </template>
          </el-table-column>
          <el-table-column label="投注时间" align="center" prop="betTime" width="170" />
          <el-table-column label="结算时间" align="center" prop="settleTime" width="170" />
          <el-table-column label="投注结算时间差" align="center" prop="settleCostSeconds" width="150" />
          <el-table-column label="币种(游戏方账号)" align="center" width="150">
            <template #default="{ row }">
              <div>{{ row.currency }}</div>
              <div class="sub">({{ row.providerAccount || '—' }})</div>
            </template>
          </el-table-column>
          <el-table-column label="投注金额" align="center" prop="betAmount" width="130" />
          <el-table-column label="有效投注" align="center" prop="validBet" width="130" />
          <el-table-column label="预扣税" align="center" prop="taxAmount" width="110" />
          <el-table-column label="会员输赢" align="center" prop="memberWin" width="130">
            <template #default="{ row }">
              <span :class="row.memberWin < 0 ? 'text-red' : 'text-green'">{{ row.memberWin }}</span>
            </template>
          </el-table-column>
          <el-table-column label="投注后余额" align="center" prop="afterBalance" width="150" />
          <el-table-column label="状态" align="center" width="110">
            <template #default="{ row }">{{ statusText(row.settleStatus) }}</template>
          </el-table-column>
        </el-table>
        <div class="footer-bar">
          <span>已选择 {{ selection.length }} 条数据 | 共 {{ total }} 条</span>
          <el-button link type="primary" @click="openRemark">批量备注</el-button>
        </div>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadDetail" />
      </template>

      <!-- 投注统计 -->
      <template v-else>
        <p class="member-bar">
          会员账号：{{ stat.member?.loginName || '—' }} 会员ID：{{ stat.member?.uid || '—' }} 会员币种：{{ stat.member?.currency || '—' }}
        </p>
        <h4>平台类型统计</h4>
        <el-table border :data="stat.typeStat || []">
          <el-table-column label="类型" align="center" prop="typeName" />
          <el-table-column label="总注单量" align="center" prop="orderCount" />
          <el-table-column label="总投注金额" align="center" prop="totalBet" />
          <el-table-column label="总有效投注" align="center" prop="validBet" />
          <el-table-column label="预扣税" align="center" prop="taxAmount" />
          <el-table-column label="会员输赢" align="center" prop="memberWin" />
          <el-table-column label="占单量" align="center" prop="orderRatio" />
          <el-table-column label="获利比" align="center" prop="profitRatio" />
        </el-table>
        <h4>子游戏统计</h4>
        <el-table border :data="stat.gameStat || []">
          <el-table-column label="平台" align="center" prop="platformName" />
          <el-table-column label="类别" align="center" prop="category" />
          <el-table-column label="游戏名称" align="center" prop="gameName" />
          <el-table-column label="注单数量" align="center" prop="orderCount" />
          <el-table-column label="投注金额" align="center" prop="totalBet" />
          <el-table-column label="有效投注" align="center" prop="validBet" />
          <el-table-column label="预扣税" align="center" prop="taxAmount" />
          <el-table-column label="会员输赢" align="center" prop="memberWin" />
        </el-table>
      </template>
    </el-card>

    <el-dialog v-model="remarkDialog.visible" title="批量备注" width="520px" append-to-body>
      <el-input v-model="remarkDialog.remark" type="textarea" :rows="3" placeholder="请输入备注内容" />
      <template #footer>
        <el-button type="primary" @click="submitRemark">确 定</el-button>
        <el-button @click="remarkDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listGameBetDetail, gameBetOptions, gameBetStat, saveGameBetRemark } from '@/api/game/bet';

defineOptions({ name: 'GameBet' });

const tab = ref('DETAIL');
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const selection = ref<any[]>([]);
const range = ref<any>([]);
const options = reactive<any>({ tip: '' });
const stat = ref<any>({});
const remarkDialog = reactive({ visible: false, remark: '' });
const query = reactive<any>({ pageNum: 1, pageSize: 10, tab: 'DETAIL', accountField: 'ACCOUNT', accountValue: undefined,
  parentAgent: undefined, settleStatus: undefined, betAmountMin: undefined, betAmountMax: undefined });

const accountFields = computed<string[]>(() => options.accountFields || []);
const accountPlaceholder = computed(() => (tab.value === 'STREAMER' ? '请输入主播号' : '请输入会员账号'));

const fieldLabel = (field: string) =>
  ({ ACCOUNT: '精准会员账号', UID: '会员ID', BIZ_NO: '注单编号', ROUND_NO: '牌局编号',
     PROVIDER_ACCOUNT: '游戏方账号', STREAMER: '主播号', STREAMER_ID: '主播号ID' }[field] ?? field);

const statusText = (status: number) =>
  ({ 1: '已结算', 2: '未结算', 3: '已取消', 4: '已退款', 5: '风控挂起' }[status] ?? '—');

function buildParams() {
  const params: any = { ...query, tab: tab.value };
  if (range.value?.length === 2) {
    params.params = { beginTime: range.value[0], endTime: range.value[1] };
  }
  return params;
}

async function loadDetail() {
  loading.value = true;
  try {
    const res: any = await listGameBetDetail(buildParams());
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function loadStat() {
  loading.value = true;
  try {
    // FIX 2026-09-23：R<Map> 取 .data（原实现把包装对象当业务数据，统计页一直 loading）
    stat.value = ((await gameBetStat({
      params: range.value?.length === 2 ? { beginTime: range.value[0], endTime: range.value[1] } : {},
      account: query.accountValue,
      startDate: range.value?.[0]?.slice(0, 10),
      endDate: range.value?.[1]?.slice(0, 10)
    })) as unknown as any)?.data ?? {};
  } finally {
    loading.value = false;
  }
}

async function reload() {
  Object.assign(options, ((await gameBetOptions(tab.value)) as unknown as any)?.data ?? {});
  if (tab.value === 'STAT') {
    await loadStat();
  } else {
    await loadDetail();
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, accountValue: undefined, parentAgent: undefined,
    settleStatus: undefined, betAmountMin: undefined, betAmountMax: undefined });
  range.value = [];
  reload();
}

function openRemark() {
  if (!selection.value.length) {
    ElMessage.warning('请先选择注单');
    return;
  }
  remarkDialog.remark = '';
  remarkDialog.visible = true;
}

async function submitRemark() {
  if (!remarkDialog.remark) {
    ElMessage.warning('备注内容不能为空');
    return;
  }
  const count: any = ((await saveGameBetRemark({ rows: selection.value, remark: remarkDialog.remark })) as unknown as any)?.data;
  ElMessage.success(`已备注 ${count} 条注单`);
  remarkDialog.visible = false;
}

onMounted(reload);
</script>

<style scoped>
.sub {
  color: #909399;
  font-size: 12px;
}
.tip {
  color: #e6a23c;
  font-size: 12px;
}
.mx {
  margin: 0 6px;
}
.footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.member-bar {
  color: #606266;
}
.text-red {
  color: #f56c6c;
}
.text-green {
  color: #67c23a;
}
</style>
