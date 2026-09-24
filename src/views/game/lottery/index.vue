<template>
  <div class="p-2 app-container game-lottery-page">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="彩种参数" name="game" />
        <el-tab-pane label="玩法配置" name="play" />
        <el-tab-pane label="历史修改记录" name="history" />
        <el-tab-pane label="操盘管理" name="operate" />
        <el-tab-pane label="自动降赔设置" name="autoReduce" />
      </el-tabs>

      <el-form :inline="true" class="header-form">
        <el-form-item label="彩种">
          <el-select v-model="query.lotteryCode" style="width: 200px" @change="reload">
            <el-option v-for="item in header.lotteryGames" :key="item.lotteryCode"
                       :label="`${item.lotteryName}(${item.lotteryCode})`" :value="String(item.lotteryCode)" />
          </el-select>
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="query.currency" style="width: 190px" @change="reload">
            <el-option label="越南(VND1000:1)" value="VND1000:1" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab === 'play'" label="档位">
          <el-radio-group v-model="query.tierNo" @change="loadPlayItems">
            <el-radio-button v-for="t in header.tiers" :key="t.tierNo" :value="t.tierNo">{{ t.tierName }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="tab === 'operate' || tab === 'autoReduce'" label="期数">
          <el-select v-model="query.issueNo" style="width: 170px" @change="reload">
            <el-option v-for="item in header.issues" :key="item.issueNo" :label="`第${item.issueNo}期`" :value="String(item.issueNo)" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab === 'play'">
          <el-button type="primary" :disabled="!canEditPlay" :loading="saving" @click="savePlay">保存玩法配置</el-button>
        </el-form-item>
        <el-form-item v-if="tab === 'operate'">
          <el-button type="primary" @click="loadOperateHeader">刷新</el-button>
          <span class="countdown">{{ countdownText }}</span>
          <el-button link type="primary" @click="openOperateRecords">操盘记录</el-button>
        </el-form-item>
      </el-form>
      <p v-if="tab === 'operate'" class="tip-red">{{ header.tip }}</p>
      <p v-if="tab === 'autoReduce'" class="tip-red">{{ autoHeader.tip }}</p>

      <!-- 彩种参数 -->
      <el-table v-if="tab === 'game'" border :data="header.lotteryGames">
        <el-table-column label="彩种名称(代码)" align="center" width="220">
          <template #default="{ row }">{{ row.lotteryName }}({{ row.lotteryCode }})</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">{{ row.lotteryStatus === 1 ? '启用' : '停用' }}</template>
        </el-table-column>
        <el-table-column label="开奖周期" align="center" prop="drawWeek" width="130" />
        <el-table-column label="每日期数" align="center" prop="drawsPerDay" width="110" />
        <el-table-column label="封盘提前(分)" align="center" prop="closeAheadMinutes" width="140" />
        <el-table-column label="币种" align="center" prop="currency" width="150" />
        <el-table-column label="备注" align="center" prop="remark" min-width="160" />
      </el-table>

      <!-- 玩法配置 / 操盘管理：号码网格 -->
      <el-table v-if="tab === 'play' || tab === 'operate'" v-loading="loading" border :data="playItems" height="560">
        <el-table-column label="玩法" align="center" prop="playName" width="110" />
        <el-table-column label="类别" align="center" prop="subName" width="150" />
        <el-table-column label="号码" align="center" prop="itemName" width="110">
          <template #default="{ row }">
            <el-tag :type="row.oddsOverRtp === 1 ? 'warning' : row.oddsModified === 1 ? 'danger' : 'info'">{{ row.itemName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="赔率" align="center" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.odds" :min="0.001" :precision="3" size="small" controls-position="right" style="width: 130px" />
          </template>
        </el-table-column>
        <el-table-column label="投注上限" align="center" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.betMax" :min="0" :precision="2" size="small" controls-position="right" style="width: 130px" />
          </template>
        </el-table-column>
        <el-table-column label="投注下限" align="center" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.betMin" :min="0" :precision="2" size="small" controls-position="right" style="width: 130px" />
          </template>
        </el-table-column>
        <el-table-column v-if="tab === 'operate'" label="当期覆盖" align="center" width="130">
          <template #default="{ row }">{{ row.operateOdds ?? '—' }}</template>
        </el-table-column>
      </el-table>

      <!-- 历史修改记录 -->
      <div v-if="tab === 'history'">
        <el-form :inline="true">
          <el-form-item label="时间">
            <el-date-picker v-model="historyRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
                            start-placeholder="开始时间" end-placeholder="结束时间" style="width: 380px" />
          </el-form-item>
          <el-form-item label="模块">
            <el-select v-model="historyQuery.module" placeholder="全部模块" clearable style="width: 150px">
              <el-option v-for="m in historyOptions.modules" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
          <el-form-item label="生效期数">
            <el-input v-model="historyQuery.issueNo" placeholder="请输入生效期数" style="width: 170px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadHistory">搜索</el-button>
            <el-button icon="Refresh" @click="resetHistory">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="historyRows">
          <el-table-column label="币种" align="center" prop="currency" width="140" />
          <el-table-column label="彩种名称(代码)" align="center" prop="lotteryName" width="200" />
          <el-table-column label="操作期数" align="center" prop="issueNo" width="120" />
          <el-table-column label="生效期数" align="center" prop="effectiveIssue" width="120" />
          <el-table-column label="模块" align="center" prop="module" width="110" />
          <el-table-column label="操作内容" align="center" prop="operateContent" min-width="240" />
          <el-table-column label="操作行为" align="center" width="100">
            <template #default="{ row }">{{ ['—', '手工', '自动', '批量'][row.operateAction] ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="操作人" align="center" prop="operatorId" width="110" />
          <el-table-column label="操作时间" align="center" prop="createdAt" width="180" />
        </el-table>
        <pagination v-show="historyTotal > 0" v-model:page="historyQuery.pageNum" v-model:limit="historyQuery.pageSize"
                    :total="historyTotal" @pagination="loadHistory" />
      </div>

      <!-- 自动降赔设置 -->
      <el-table v-if="tab === 'autoReduce'" v-loading="loading" border :data="autoRows">
        <el-table-column type="index" label="序号" align="center" width="80" />
        <el-table-column label="玩法" align="center" prop="playName" min-width="160" />
        <el-table-column label="最低赔率" align="center" prop="minOdds" width="130" />
        <el-table-column label="最高赔率" align="center" prop="maxOdds" width="130" />
        <el-table-column label="降赔设置详情" align="center" prop="levelDetail" min-width="240" />
        <el-table-column label="操作" align="center" width="120">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:lottery:autoreduce:edit']" link type="primary" @click="openAutoEdit(row)">设置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="operateDialog.visible" title="操盘记录" width="900px" append-to-body>
      <el-table border :data="operateRecords">
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="玩法" align="center" prop="playCode" width="130" />
        <el-table-column label="类别" align="center" prop="subCode" width="120" />
        <el-table-column label="号码" align="center" prop="itemCode" width="110" />
        <el-table-column label="当期赔率" align="center" prop="odds" width="120" />
        <el-table-column label="操作类型" align="center" width="110">
          <template #default="{ row }">{{ row.source === 2 ? '自动' : '手工' }}</template>
        </el-table-column>
        <el-table-column label="用户" align="center" prop="operatorId" width="110" />
        <el-table-column label="时间" align="center" prop="createTime" width="180" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="autoDialog.visible" title="自动降赔设置" width="560px" append-to-body>
      <el-form label-width="140px">
        <el-form-item label="玩法"><el-input v-model="autoDialog.playName" disabled /></el-form-item>
        <el-form-item label="最低赔率"><el-input-number v-model="autoDialog.minOdds" :min="0" :precision="3" controls-position="right" /></el-form-item>
        <el-form-item label="最高赔率"><el-input-number v-model="autoDialog.maxOdds" :min="0" :precision="3" controls-position="right" /></el-form-item>
        <el-form-item label="多阶调赔">
          <el-switch v-model="autoDialog.multiLevel" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="降赔设置详情">
          <el-input v-model="autoDialog.levelDetail" type="textarea" :rows="3" placeholder="JSON：level/condition/reduceType/reduceValue/scope" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitAuto">确 定</el-button>
        <el-button @click="autoDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  lotteryHeader,
  lotteryPlayItems,
  saveLotteryPlay,
  lotteryOperateHeader,
  lotteryOperateRecords,
  autoReduceHeader,
  autoReduceList,
  saveAutoReduce,
  lotteryHistoryList,
  lotteryHistoryOptions
} from '@/api/game/lottery';

defineOptions({ name: 'GameLottery' });

const tab = ref('game');
const loading = ref(false);
const saving = ref(false);
const header = reactive<any>({ lotteryGames: [], tiers: [], issues: [], tip: '', editable: false, remainMillis: 0 });
const autoHeader = reactive<any>({ tip: '' });
const query = reactive<any>({ lotteryCode: '133001', currency: 'VND1000:1', tierNo: 2, issueNo: undefined });
const playItems = ref<any[]>([]);
const operateRecords = ref<any[]>([]);
const autoRows = ref<any[]>([]);
const historyRows = ref<any[]>([]);
const historyTotal = ref(0);
const historyRange = ref<any>([]);
const historyOptions = reactive<any>({ modules: [], actions: [], operateContents: [] });
const historyQuery = reactive<any>({ pageNum: 1, pageSize: 10, module: undefined, issueNo: undefined });
const operateDialog = reactive({ visible: false });
const autoDialog = reactive<any>({ visible: false });
let timer: any = null;
const remain = ref(0);

const canEditPlay = computed(() => tab.value === 'play');
const countdownText = computed(() => {
  if (!header.issueNo) return '';
  const total = Math.max(remain.value, 0);
  const day = Math.floor(total / 86400000);
  const hour = Math.floor((total % 86400000) / 3600000);
  const minute = Math.floor((total % 3600000) / 60000);
  const second = Math.floor((total % 60000) / 1000);
  return `第 ${header.issueNo} 期 距离封盘时间还有 ${day}天${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
});

async function reload() {
  await loadHeader();
  if (tab.value === 'play' || tab.value === 'operate') await loadPlayItems();
  if (tab.value === 'operate') await loadOperateHeader();
  if (tab.value === 'autoReduce') await loadAutoReduce();
  if (tab.value === 'history') await loadHistory();
}

async function loadHeader() {
  // FIX 2026-09-23：本项目响应拦截器返回完整响应体 { code, msg, data }，R<T> 需取 .data
  Object.assign(header, ((await lotteryHeader(query.currency)) as unknown as any)?.data ?? {});
  if (!query.issueNo && header.issues?.length) query.issueNo = String(header.issues[0].issueNo);
}

async function loadPlayItems() {
  loading.value = true;
  try {
    playItems.value = ((await lotteryPlayItems({ ...query, issueNo: tab.value === 'operate' ? query.issueNo : undefined })) as unknown as any)?.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function savePlay() {
  saving.value = true;
  try {
    const items = playItems.value.map((r) => ({
      playCode: r.playCode, subCode: r.subCode, itemCode: r.itemCode, itemName: r.itemName,
      odds: r.odds, betMax: r.betMax, betMin: r.betMin, sortOrder: r.sortOrder
    }));
    const changed: any = ((await saveLotteryPlay({ ...query, items })) as unknown as any)?.data;
    ElMessage.success(`保存成功，共更新 ${changed} 项（赔率改动对新彩期生效）`);
  } finally {
    saving.value = false;
  }
}

async function loadOperateHeader() {
  const data: any = ((await lotteryOperateHeader(query)) as unknown as any)?.data;
  Object.assign(header, data || {});
  remain.value = data?.remainMillis ?? 0;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (remain.value > 0) remain.value -= 1000;
  }, 1000);
}

async function openOperateRecords() {
  operateRecords.value = ((await lotteryOperateRecords({ ...query })) as unknown as any)?.data ?? [];
  operateDialog.visible = true;
}

async function loadAutoReduce() {
  Object.assign(autoHeader, ((await autoReduceHeader(query)) as unknown as any)?.data ?? {});
  autoRows.value = ((await autoReduceList(query)) as unknown as any)?.data ?? [];
}

function openAutoEdit(row: any) {
  Object.assign(autoDialog, { ...row, visible: true });
}

async function submitAuto() {
  if (autoDialog.maxOdds > 0 && autoDialog.minOdds > autoDialog.maxOdds) {
    ElMessage.warning('最低赔率不可大于最高赔率');
    return;
  }
  await saveAutoReduce({ ...query, playCode: autoDialog.playCode, subCode: autoDialog.subCode,
    playName: autoDialog.playName, minOdds: autoDialog.minOdds, maxOdds: autoDialog.maxOdds,
    multiLevel: autoDialog.multiLevel, levelDetail: autoDialog.levelDetail });
  ElMessage.success('保存成功（上下限本期生效，赔率规则下期生效）');
  autoDialog.visible = false;
  loadAutoReduce();
}

async function loadHistory() {
  const params: any = { ...historyQuery };
  if (historyRange.value?.length === 2) {
    params.params = { beginTime: historyRange.value[0], endTime: historyRange.value[1] };
  }
  const res: any = await lotteryHistoryList(params);
  historyRows.value = res.rows ?? [];
  historyTotal.value = res.total ?? 0;
}

function resetHistory() {
  Object.assign(historyQuery, { pageNum: 1, module: undefined, issueNo: undefined });
  historyRange.value = [];
  loadHistory();
}

onMounted(async () => {
  historyOptions.modules = ((await lotteryHistoryOptions()) as unknown as any)?.data?.modules ?? [];
  await reload();
});

onUnmounted(() => timer && clearInterval(timer));
</script>

<style scoped>
.header-form {
  margin-bottom: 6px;
}
.countdown {
  margin: 0 12px;
  color: #e6a23c;
}
.tip-red {
  color: #f56c6c;
  font-size: 12px;
}
</style>
