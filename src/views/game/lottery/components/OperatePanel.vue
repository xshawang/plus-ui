<template>
  <div v-loading="loading">
    <el-form :inline="true">
      <el-form-item label="期数">
        <el-select v-model="issueNo" style="width: 170px" @change="reload">
          <el-option v-for="i in issues" :key="i.issueNo" :label="`第${i.issueNo}期`" :value="String(i.issueNo)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="reload">刷新</el-button>
        <el-select v-model="refreshSeconds" style="width: 110px; margin-left: 8px" @change="applyRefresh">
          <el-option label="不刷新" :value="0" />
          <el-option label="10秒" :value="10" />
          <el-option label="30秒" :value="30" />
          <el-option label="60秒" :value="60" />
        </el-select>
        <span class="countdown">{{ countdownText }}</span>
        <el-button link type="primary" @click="openRecords">操盘记录</el-button>
        <el-button link type="primary" @click="colorDialog.visible = true">色阶设置</el-button>
      </el-form-item>
    </el-form>
    <p class="tip-red">{{ tip }}</p>

    <el-tabs v-model="activePlay" @tab-change="onPlayChange">
      <el-tab-pane v-for="play in playList" :key="play.code" :name="play.code"
                   :label="`${play.name}(${counts[play.code] ?? 0})`" />
    </el-tabs>

    <!-- 快速选择号码（截图 6 组按钮） -->
    <div class="quick-panel">
      <div class="quick-title">快速选择号码</div>
      <div v-for="(row, idx) in quickRows" :key="idx" class="quick-row">
        <el-button v-for="btn in row" :key="btn.key" size="small" plain
                   :type="selected.includes(btn.key) ? 'primary' : 'default'"
                   @click="toggleRule(btn.key)">{{ btn.label }}</el-button>
      </div>
      <div class="quick-row">
        <el-button v-for="btn in tailButtons" :key="btn.key" size="small" plain
                   :type="selected.includes(btn.key) ? 'primary' : 'default'"
                   @click="toggleRule(btn.key)">{{ btn.label }}</el-button>
      </div>
      <div class="quick-row">
        <el-button size="small" type="primary" plain @click="quickAll('ALL')">全部</el-button>
        <el-button size="small" plain @click="clearSelection">取消</el-button>
        <el-button size="small" plain @click="quickAll('FIRST5')">前5</el-button>
        <el-button size="small" plain @click="quickAll('FIRST10')">前10</el-button>
        <el-button size="small" type="warning" :disabled="!selectedItems.length" @click="applyToSelected">应用到已选号码</el-button>
        <span class="ml">统一赔率</span>
        <el-input-number v-model="batchOdds" :min="0.001" :precision="3" size="small" controls-position="right" style="width: 130px" />
        <el-button size="small" type="danger" :disabled="!selectedItems.length || !batchOdds" @click="assignOdds">批量赋值</el-button>
        <span class="selected-tip">已选 {{ selectedItems.length }} 个号码</span>
      </div>
    </div>

    <el-table ref="tableRef" border height="420" :data="items" @selection-change="onSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="类别" align="center" prop="subName" width="130" />
      <el-table-column label="号码" align="center" prop="itemName" width="110">
        <template #default="{ row }">
          <el-tag :type="row.oddsOverRtp === 1 ? 'warning' : row.oddsModified === 1 ? 'danger' : 'info'">{{ row.itemName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="配置赔率" align="center" width="120">
        <template #default="{ row }">{{ row.odds }}</template>
      </el-table-column>
      <el-table-column label="当期赔率" align="center" width="150">
        <template #default="{ row }">
          <el-input-number v-model="row.operateOdds" :min="0.001" :precision="3" size="small"
                           controls-position="right" style="width: 130px" />
        </template>
      </el-table-column>
      <el-table-column label="投注上限" align="center" width="150">
        <template #default="{ row }">{{ row.operateBetMax ?? row.betMax }}</template>
      </el-table-column>
      <el-table-column label="投注下限" align="center" width="150">
        <template #default="{ row }">{{ row.operateBetMin ?? row.betMin }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.oddsModified === 1" type="danger">已操盘</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer">
      <el-button type="primary" :disabled="!editable" @click="submit(false)">保存操盘（当期生效）</el-button>
      <el-button :disabled="!editable" @click="submit(true)">恢复玩法配置赔率</el-button>
      <span v-if="!editable" class="tip-red">该期已封盘，仅可查看</span>
    </div>

    <el-dialog v-model="recordsDialog.visible" title="操盘记录" width="940px" append-to-body>
      <el-table border :data="records">
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="游戏名称" align="center" prop="lotteryName" width="170" />
        <el-table-column label="期数" align="center" prop="issueNo" width="100" />
        <el-table-column label="币种" align="center" prop="currency" width="120" />
        <el-table-column label="玩法" align="center" prop="playName" width="110" />
        <el-table-column label="类别" align="center" prop="subName" width="120" />
        <el-table-column label="改前赔率" align="center" prop="beforeOdds" width="100" />
        <el-table-column label="改后赔率" align="center" prop="afterOdds" width="100" />
        <el-table-column label="操作类型" align="center" width="100">
          <template #default="{ row }">{{ ['—', '手工', '自动', '批量'][row.operateAction] ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="用户" align="center" prop="operatorId" width="100" />
        <el-table-column label="时间" align="center" prop="createdAt" width="170" />
      </el-table>
      <template #footer><el-button @click="recordsDialog.visible = false">关 闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="colorDialog.visible" title="色阶设置" width="520px" append-to-body>
      <el-form label-width="140px">
        <el-form-item label="修改色"><el-color-picker v-model="colorDialog.modifyColor" /></el-form-item>
        <el-form-item label="超赔色"><el-color-picker v-model="colorDialog.overOddsColor" /></el-form-item>
        <el-form-item label="RTP 系数">
          <el-input-number v-model="colorDialog.rtpFactor" :min="0.01" :max="1" :precision="4" controls-position="right" />
          <span class="ml">满赔 × 系数 = 橙底阈值</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveColor">确 定</el-button>
        <el-button @click="colorDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  lotteryHistoryList, lotteryOperate, lotteryOperateHeader,
  lotteryPlayItems, lotteryQuickSelect, saveColorLevel
} from '@/api/game/lottery';

/**
 * 操盘管理页签（截图「操盘管理」）。
 *
 * 背景：操盘只对当期有效（页头提示原文），封盘后只读；页面提供「快速选择号码」批量操作、
 * 「不刷新」间隔、封盘倒计时、「操盘记录」弹窗与「色阶设置」。
 * 协作关系：/infra/game/lottery/operate/* 与 /color-level 接口；
 * 快速选择的规则解析在服务端（依赖 lottery_number_attr），前端只传规则标识。
 */
const props = defineProps<{ lotteryCode: string; currency: string; tierNo: number; issues: any[] }>();
const emit = defineEmits<{ (e: 'refresh'): void }>();

const loading = ref(false);
const items = ref<any[]>([]);
const issueNo = ref('');
const tip = ref('');
const editable = ref(false);
const remain = ref(0);
const refreshSeconds = ref(0);
const counts = reactive<Record<string, number>>({});
const selectedRules = ref<string[]>([]);
const selectedItems = ref<any[]>([]);
const batchOdds = ref<number | undefined>(undefined);
const tableRef = ref<any>(null);
const recordsDialog = reactive({ visible: false });
const records = ref<any[]>([]);
const colorDialog = reactive<any>({ visible: false, modifyColor: '#FF4D4F', overOddsColor: '#FA8C16', rtpFactor: 0.99 });
let timer: any = null;

const activePlay = ref('TE_MA');
const selected = computed(() => selectedRules.value);

const playList = [
  { code: 'TE_MA', name: '特码' }, { code: 'TE_FACE', name: '特码两面' },
  { code: 'HEAD_TAIL', name: '特码头尾' }, { code: 'COLOR_HALF', name: '色波半波' },
  { code: 'TE_ZODIAC', name: '特肖' }, { code: 'HE_ZODIAC', name: '合肖' },
  { code: 'WUXING', name: '五行' }, { code: 'ZHENG_MA', name: '正码' },
  { code: 'ZHENG_TE', name: '正码特' }, { code: 'ZHENG_ZODIAC', name: '正肖' },
  { code: 'ZODIAC_TAIL', name: '一肖尾数' }, { code: 'ZONG_ZODIAC', name: '总肖' },
  { code: 'SEVEN_WAVE', name: '七色波' }, { code: 'SUM_FACE', name: '两面' },
  { code: 'LIAN_ZODIAC_TAIL', name: '连肖连尾' }, { code: 'LIAN_MA', name: '连码' },
  { code: 'ZIXUAN_BUZHONG', name: '自选不中' }
];

/** 快速选择按钮（与截图分组一致，key 为服务端规则标识） */
const quickRows = [
  [
    { key: 'DAN', label: '单' }, { key: 'DA', label: '大' }, { key: 'DA_DAN', label: '大单' },
    { key: 'XIAO_DAN', label: '小单' }, { key: 'HE_DAN', label: '合单' },
    { key: 'TE_WEI_DA', label: '特尾大' }, { key: 'HE_WEI_DA', label: '合尾大' }
  ],
  [
    { key: 'SHUANG', label: '双' }, { key: 'XIAO', label: '小' }, { key: 'DA_SHUANG', label: '大双' },
    { key: 'XIAO_SHUANG', label: '小双' }, { key: 'HE_SHUANG', label: '合双' },
    { key: 'TE_WEI_XIAO', label: '特尾小' }, { key: 'HE_WEI_XIAO', label: '合尾小' }
  ],
  [
    { key: 'RED_DAN', label: '红单' }, { key: 'GREEN_DAN', label: '绿单' }, { key: 'BLUE_DAN', label: '蓝单' },
    { key: 'RED_DA', label: '红大' }, { key: 'GREEN_DA', label: '绿大' }, { key: 'BLUE_DA', label: '蓝大' }
  ],
  [
    { key: 'RED_SHUANG', label: '红双' }, { key: 'GREEN_SHUANG', label: '绿双' }, { key: 'BLUE_SHUANG', label: '蓝双' },
    { key: 'RED_XIAO', label: '红小' }, { key: 'GREEN_XIAO', label: '绿小' }, { key: 'BLUE_XIAO', label: '蓝小' }
  ],
  [
    { key: 'POULTRY', label: '家禽' }, { key: 'ZODIAC:牛', label: '牛' }, { key: 'ZODIAC:马', label: '马' },
    { key: 'ZODIAC:羊', label: '羊' }, { key: 'ZODIAC:鸡', label: '鸡' }, { key: 'ZODIAC:狗', label: '狗' },
    { key: 'ZODIAC:猪', label: '猪' }
  ],
  [
    { key: 'WILD', label: '野兽' }, { key: 'ZODIAC:猴', label: '猴' }, { key: 'ZODIAC:鼠', label: '鼠' },
    { key: 'ZODIAC:兔', label: '兔' }, { key: 'ZODIAC:龙', label: '龙' }, { key: 'ZODIAC:蛇', label: '蛇' }
  ],
  [{ key: 'RED', label: '红' }, { key: 'GREEN', label: '绿' }, { key: 'BLUE', label: '蓝' }]
];

const tailButtons = [
  { key: 'TAIL:0', label: '0尾' }, { key: 'TAIL:1', label: '1尾' }, { key: 'TAIL:2', label: '2尾' },
  { key: 'TAIL:3', label: '3尾' }, { key: 'TAIL:4', label: '4尾' }, { key: 'TAIL:5', label: '5尾' },
  { key: 'TAIL:6', label: '6尾' }, { key: 'TAIL:7', label: '7尾' }, { key: 'TAIL:8', label: '8尾' },
  { key: 'TAIL:9', label: '9尾' }
];

const countdownText = computed(() => {
  const total = Math.max(remain.value, 0);
  const day = Math.floor(total / 86400000);
  const hour = Math.floor((total % 86400000) / 3600000);
  const minute = Math.floor((total % 3600000) / 60000);
  const second = Math.floor((total % 60000) / 1000);
  return `第 ${issueNo.value} 期 距离封盘时间还有 ${day}天${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
});

function applyRefresh() {
  if (timer) clearInterval(timer);
  if (refreshSeconds.value > 0) {
    timer = setInterval(() => reload(), refreshSeconds.value * 1000);
  }
}

async function reload() {
  const header: any = ((await lotteryOperateHeader({ lotteryCode: props.lotteryCode, currency: props.currency, issueNo: issueNo.value })) as unknown as any)?.data;
  if (header) {
    issueNo.value = header.issueNo ?? issueNo.value;
    tip.value = header.tip ?? '';
    editable.value = !!header.editable;
    remain.value = header.remainMillis ?? 0;
  }
  loading.value = true;
  try {
    const data: any = ((await lotteryPlayItems({
      lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo,
      issueNo: issueNo.value, playCode: activePlay.value
    })) as unknown as any)?.data;
    items.value = data ?? [];
    for (const row of items.value) {
      if (row.operateOdds == null) {
        row.operateOdds = row.odds;
      }
      const key = row.playCode;
      counts[key] = (counts[key] ?? 0) + (row.oddsModified === 1 ? 1 : 0);
    }
  } finally {
    loading.value = false;
  }
}

function onPlayChange() {
  Object.keys(counts).forEach((k) => delete counts[k]);
  reload();
}

function onSelectionChange(rows: any[]) {
  selectedItems.value = rows;
}

function toggleRule(key: string) {
  const idx = selectedRules.value.indexOf(key);
  if (idx >= 0) selectedRules.value.splice(idx, 1);
  else selectedRules.value.push(key);
}

function clearSelection() {
  selectedRules.value = [];
  selectedItems.value = [];
  tableRef.value?.clearSelection();
}

/** 全部/前5/前10：把规则交给服务端解析后，在表格中自动勾选匹配行 */
async function quickAll(rule: string) {
  const codes: any = ((await lotteryQuickSelect({
    lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo,
    playCode: activePlay.value, rules: [rule]
  })) as unknown as any)?.data ?? [];
  await nextTick();
  for (const row of items.value) {
    if (codes.includes(row.itemCode)) {
      tableRef.value?.toggleRowSelection(row, true);
    }
  }
  selectedItems.value = items.value.filter((r) => codes.includes(r.itemCode));
}

/** 把已选号码按当前规则批量赋值（此处按规则解析结果勾选，再由用户确认后保存） */
async function applyToSelected() {
  if (!selectedRules.value.length) {
    ElMessage.warning('请先点击快速选择按钮');
    return;
  }
  const codes: any = ((await lotteryQuickSelect({
    lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo,
    playCode: activePlay.value, rules: selectedRules.value
  })) as unknown as any)?.data ?? [];
  if (!codes.length) {
    ElMessage.warning('当前规则在该玩法下没有匹配号码');
    return;
  }
  tableRef.value?.clearSelection();
  await nextTick();
  for (const row of items.value) {
    if (codes.includes(row.itemCode)) {
      tableRef.value?.toggleRowSelection(row, true);
    }
  }
  selectedItems.value = items.value.filter((r) => codes.includes(r.itemCode));
  ElMessage.success(`已按规则勾选 ${selectedItems.value.length} 个号码，修改赔率后点「保存操盘」`);
}

/** 批量赋值：把「统一赔率」写入所有已勾选号码（再点保存操盘落库） */
function assignOdds() {
  if (!selectedItems.value.length || !batchOdds.value) {
    ElMessage.warning('请先勾选号码并填写统一赔率');
    return;
  }
  for (const row of selectedItems.value) {
    row.operateOdds = batchOdds.value;
  }
  ElMessage.success(`已把赔率 ${batchOdds.value} 赋值给 ${selectedItems.value.length} 个号码，请点「保存操盘」提交`);
}

async function submit(reset: boolean) {
  if (!selectedItems.value.length) {
    ElMessage.warning('请先选择要操盘的号码');
    return;
  }
  const payload = {
    lotteryCode: props.lotteryCode, currency: props.currency, issueNo: issueNo.value,
    playCode: activePlay.value, resetToTemplate: reset,
    items: selectedItems.value.map((r) => ({
      subCode: r.subCode, itemCode: r.itemCode, itemName: r.itemName,
      odds: r.operateOdds, betMax: r.operateBetMax ?? r.betMax, betMin: r.operateBetMin ?? r.betMin
    }))
  };
  const count: any = ((await lotteryOperate(payload)) as unknown as any)?.data;
  ElMessage.success(reset ? `已恢复 ${count} 个号码的配置赔率` : `操盘成功，共 ${count} 个号码（仅当期生效）`);
  clearSelection();
  reload();
  emit('refresh');
}

async function openRecords() {
  const res: any = await lotteryHistoryList({ pageNum: 1, pageSize: 100, module: '操盘管理', issueNo: issueNo.value });
  records.value = res.rows ?? [];
  recordsDialog.visible = true;
}

async function saveColor() {
  await saveColorLevel({ lotteryCode: props.lotteryCode, currency: props.currency, ...colorDialog });
  ElMessage.success('色阶设置已保存');
  colorDialog.visible = false;
}

onMounted(async () => {
  if (props.issues?.length) {
    issueNo.value = String(props.issues[0].issueNo);
  }
  reload();
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (remain.value > 0) remain.value -= 1000;
  }, 1000);
});

watch(() => props.issues, (list) => {
  if (!issueNo.value && list?.length) issueNo.value = String(list[0].issueNo);
});

onUnmounted(() => timer && clearInterval(timer));
</script>

<style scoped>
.quick-panel {
  border: 1px solid #f0e6e6;
  background: #fffafa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.quick-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
  align-items: center;
}
.countdown { margin: 0 12px; color: #e6a23c; }
.tip-red { color: #f56c6c; font-size: 12px; }
.footer { margin-top: 10px; display: flex; align-items: center; gap: 10px; }
.selected-tip { color: #909399; font-size: 12px; }
.ml { margin-left: 8px; }
</style>
