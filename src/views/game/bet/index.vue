<template>
  <div class="p-2 app-container game-bet-page">
    <el-card shadow="hover">
      <el-tabs v-model="tab" @tab-change="onTabChange">
        <el-tab-pane label="投注明细" name="DETAIL" />
        <el-tab-pane label="投注统计" name="STAT" />
        <el-tab-pane label="主播号投注明细" name="STREAMER" />
        <el-tab-pane label="投注明细(按代理线)" name="AGENT" />
      </el-tabs>

      <!-- 截图：右上固定「导出报表 / 操作教程」 -->
      <div class="bet-toolbar">
        <span />
        <span>
          <el-button icon="Download" @click="exportReport">导出报表</el-button>
          <el-button link type="primary" icon="Document" @click="openGuide">操作教程</el-button>
        </span>
      </div>

      <el-form :inline="true">
        <!-- 截图：「投注时间 ▾」是字段下拉（投注时间/结算时间）+ 日/周/月 快捷 + 区间 -->
        <el-form-item>
          <el-select v-model="query.timeField" style="width: 120px">
            <el-option label="投注时间" value="BET" />
            <el-option label="结算时间" value="SETTLE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="period" @change="applyPeriod">
            <el-radio-button value="DAY">日</el-radio-button>
            <el-radio-button value="WEEK">周</el-radio-button>
            <el-radio-button value="MONTH">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="range" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
                          start-placeholder="开始时间" end-placeholder="结束时间" style="width: 360px"
                          @change="rangeTouched = true" />
        </el-form-item>
        <!-- 截图：「请选择类型/平台」下拉（类型与平台二选一，传 gameType / providerCode） -->
        <!-- 截图（投注统计）：筛选只有 日/周/月 + 区间 + 会员账号 + 搜索/重置，故此处按页签隐藏 -->
        <el-form-item v-if="tab !== 'STAT'">
          <el-select v-model="query.platformKey" placeholder="请选择类型/平台" clearable filterable style="width: 190px">
            <el-option v-for="o in platformChoices" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <!-- 截图：「模糊子游戏名称」下拉 + 文本输入 -->
        <el-form-item v-if="tab !== 'STAT'">
          <el-select v-model="gameNameField" style="width: 140px">
            <el-option label="模糊子游戏名称" value="GAME_NAME" />
          </el-select>
          <el-input v-model="query.gameName" placeholder="请输入子游戏名称" clearable
                    style="width: 170px; margin-left: 6px" @keyup.enter="reload" />
        </el-form-item>
        <!-- 投注明细 / 投注统计 / 主播号：会员账号（主播号）下拉 + 输入 -->
        <el-form-item v-if="tab !== 'AGENT'">
          <el-select v-model="query.accountField" style="width: 140px">
            <el-option v-for="f in accountFields" :key="f" :label="fieldLabel(f)" :value="f" />
          </el-select>
          <el-input v-model="query.accountValue" :placeholder="accountPlaceholder" clearable
                    style="width: 200px; margin-left: 6px" @keyup.enter="reload" />
        </el-form-item>
        <!-- 截图（按代理线）：上级代理账号下拉 + 输入 -->
        <el-form-item v-if="tab === 'AGENT'">
          <el-select v-model="agentField" style="width: 150px">
            <el-option label="上级代理账号" value="PARENT_AGENT" />
          </el-select>
          <el-input v-model="query.parentAgent" placeholder="请输入上级代理账号" clearable
                    style="width: 190px; margin-left: 6px" @keyup.enter="reload" />
        </el-form-item>
        <!-- 截图（按代理线）：注单编号下拉 + 输入 -->
        <el-form-item v-if="tab === 'AGENT'">
          <el-select v-model="bizNoField" style="width: 140px">
            <el-option label="注单编号" value="BIZ_NO" />
          </el-select>
          <el-input v-model="query.bizNo" placeholder="请输入注单编号" clearable
                    style="width: 190px; margin-left: 6px" @keyup.enter="reload" />
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
          <!-- 截图：明细类页签末列固定「操作」 -->
          <el-table-column label="操作" align="center" width="110" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openRowRemark(row)">备注</el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 截图底部：投注明细=「全选当前页 + 批量操作 ▾ + 已选择 N 条 + 共 N 条」；其余页签只显示「共 N 条」 -->
        <div class="footer-bar">
          <span v-if="tab === 'DETAIL'">全选当前页 | 已选择 {{ selection.length }} 条数据 | 共 {{ total }} 条</span>
          <span v-else>共 {{ total }} 条</span>
          <el-dropdown v-if="tab === 'DETAIL'" @command="onBatchCommand">
            <el-button>批量操作 ▾</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="REMARK">批量备注</el-dropdown-item>
                <el-dropdown-item command="EXPORT">导出选中</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadDetail" />
      </template>

      <!-- 投注统计 -->
      <template v-else>
        <!-- 口径提示：投注统计读「用户游戏日汇总」（T+1），当天注单次日才可见 -->
        <el-alert v-if="statLoaded && !loading && !(stat.typeStat?.length) && !(stat.gameStat?.length)"
                  type="warning" :closable="false" show-icon style="margin-bottom: 8px"
                  title="所选区间暂无汇总数据：投注统计按「日汇总（T+1）」出数——当天注单要等次日 01:30 汇总后才可见。"
                  description="需要看当天数据请切到「投注明细」页签（实时读注单表）；或由运维补跑日汇总接口。" />
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
import { listGameBetDetail, gameBetOptions, gameBetStat, saveGameBetRemark, gameBetDefaultRange } from '@/api/game/bet';
import { gameTypeOptions, platformOptions } from '@/api/game/manage';

defineOptions({ name: 'GameBet' });

const tab = ref('DETAIL');
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const selection = ref<any[]>([]);
const range = ref<any>([]);
const options = reactive<any>({ tip: '' });
const stat = ref<any>({});
/** 统计页签是否已完成过一次加载（避免首屏空数据时误弹口径提示） */
const statLoaded = ref(false);
/** 用户是否手动动过区间：未动过时切到「投注统计」自动放宽到近 7 天（统计为 T+1 口径，查当天必空） */
const rangeTouched = ref(false);
const remarkDialog = reactive({ visible: false, remark: '' });
/** 时间档位（截图「日/周/月」快捷） */
const period = ref('DAY');
/** 「模糊子游戏名称」是固定维度，保留下拉以对齐截图形态 */
const gameNameField = ref('GAME_NAME');
/** 按代理线页签：上级代理账号维度固定 */
const agentField = ref('PARENT_AGENT');
/** 按代理线页签：注单编号维度固定 */
const bizNoField = ref('BIZ_NO');
/** 「请选择类型/平台」候选（值编码 TYPE:{类型码} / PLATFORM:{平台码}） */
const platformChoices = ref<Array<{ label: string; value: string }>>([]);
const query = reactive<any>({ pageNum: 1, pageSize: 10, tab: 'DETAIL', accountField: 'ACCOUNT', accountValue: undefined,
  parentAgent: undefined, settleStatus: undefined, betAmountMin: undefined, betAmountMax: undefined,
  timeField: 'BET', gameName: undefined, platformKey: undefined, bizNo: undefined });

const accountFields = computed<string[]>(() => options.accountFields || []);
const accountPlaceholder = computed(() => (tab.value === 'STREAMER' ? '请输入主播号' : '请输入会员账号'));

const fieldLabel = (field: string) =>
  ({ ACCOUNT: '精准会员账号', UID: '会员ID', BIZ_NO: '注单编号', ROUND_NO: '牌局编号',
     PROVIDER_ACCOUNT: '游戏方账号', STREAMER: '主播号', STREAMER_ID: '主播号ID' }[field] ?? field);

const statusText = (status: number) =>
  ({ 1: '已结算', 2: '未结算', 3: '已取消', 4: '已退款', 5: '风控挂起' }[status] ?? '—');

function buildParams() {
  const params: any = { ...query, tab: tab.value };
  // 「请选择类型/平台」下拉按 TYPE:/PLATFORM: 前缀拆回后端参数（类型与平台互斥，避免两个条件叠加后查空）
  delete params.platformKey;
  const key = query.platformKey || '';
  if (key.startsWith('TYPE:')) {
    params.gameType = Number(key.slice(5));
  } else if (key.startsWith('PLATFORM:')) {
    params.providerCode = key.slice(9);
  }
  // 按代理线页签的「注单编号」独立输入框 → 复用后端 accountField=BIZ_NO 精确匹配
  if (tab.value === 'AGENT') {
    params.accountField = 'BIZ_NO';
    params.accountValue = query.bizNo;
    delete params.bizNo;
  } else {
    params.accountField = query.accountField;
    delete params.bizNo;
  }
  if (range.value?.length === 2) {
    params.params = { beginTime: range.value[0], endTime: range.value[1] };
  }
  return params;
}

/** 日/周/月 快捷：按截图回填区间（周=近 7 天含今日，月=近 30 天含今日） */
function applyPeriod() {
  // 用户显式选了日/周/月 ⇒ 后续切页签不再自动改写区间
  rangeTouched.value = true;
  const end = new Date();
  const start = new Date();
  if (period.value === 'WEEK') start.setDate(end.getDate() - 6);
  else if (period.value === 'MONTH') start.setDate(end.getDate() - 29);
  const p = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date, tail: string) =>
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${tail}`;
  range.value = [fmt(start, '00:00:00'), fmt(end, '23:59:59')];
  reload();
}

/** 导出报表：按当前筛选条件导全部命中行（前端 CSV，表头用中文列名） */
async function exportReport() {
  if (tab.value === 'STAT') {
    ElMessage.warning('投注统计为聚合视图，请使用页面表格查看');
    return;
  }
  const res: any = await listGameBetDetail({ ...buildParams(), pageNum: 1, pageSize: 5000 });
  const list = res.rows ?? [];
  if (!list.length) {
    ElMessage.warning('暂无可导出数据');
    return;
  }
  const cols: Array<[string, string]> = [
    ['注单编号', 'bizNo'], ['牌局编号', 'roundNo'], ['会员账号', 'loginName'], ['会员ID', 'uid'],
    ['上级代理账号', 'parentAgent'], ['上级代理ID', 'parentAgentId'],
    ['顶层代理账号', 'topAgent'], ['顶层代理ID', 'topAgentId'],
    ['子游戏名称', 'gameName'], ['平台名称', 'platformName'], ['投注时间', 'betTime'],
    ['结算时间', 'settleTime'], ['投注结算时间差(秒)', 'settleCostSeconds'], ['币种', 'currency'],
    ['投注金额', 'betAmount'], ['有效投注', 'validBet'], ['预扣税', 'taxAmount'],
    ['会员输赢', 'memberWin'], ['投注后余额', 'afterBalance'], ['状态', 'settleStatus']
  ];
  const head = cols.map((c) => c[0]).join(',');
  const body = list
    .map((row: any) => cols.map((c) => `"${row[c[1]] ?? ''}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${head}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `投注记录_${tab.value}_${range.value?.[0] ?? ''}_${range.value?.[1] ?? ''}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** 操作教程：指向本目录的测试/需求文档入口（无独立教程页时的落点） */
function openGuide() {
  ElMessage.info('操作教程见 docs/运营后台DOC/游戏管理模块测试流程文档/04-投注记录与会员投注细目-截图字段级需求与差异清单.md');
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
    statLoaded.value = true;
  }
}

/**
 * 页签切换。
 *
 * 为什么单独处理「投注统计」：该页签读的是 `user_game_daily_summary`（日汇总，T+1 口径，
 * 无参聚合的是"昨天"），默认区间若是"当天"则**必然空表**，运营会误判为功能坏了。
 * 因此用户没手动改过区间时，切到该页签自动放宽为近 7 天（与截图 2026-09-08~2026-09-14 一致）。
 */
async function onTabChange(name: string) {
  if (name === 'STAT' && !rangeTouched.value) {
    try {
      const r: any = ((await gameBetDefaultRange()) as unknown as any)?.data;
      if (Array.isArray(r) && r.length === 2) {
        range.value = [`${r[0]} 00:00:00`, `${r[1]} 23:59:59`];
      }
    } catch {
      // 取不到区间时保持原值，不影响页面可用性
    }
  }
  await reload();
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
    settleStatus: undefined, betAmountMin: undefined, betAmountMax: undefined,
    timeField: 'BET', gameName: undefined, platformKey: undefined, bizNo: undefined });
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

/** 行内「操作 → 备注」：单选一行后直接进入批量备注弹窗（与截图的操作列对齐） */
function openRowRemark(row: any) {
  selection.value = [row];
  openRemark();
}

function onBatchCommand(command: string) {
  if (command === 'REMARK') {
    openRemark();
  } else if (command === 'EXPORT') {
    if (!selection.value.length) {
      ElMessage.warning('请先选择注单');
      return;
    }
    const cols: Array<[string, string]> = [
      ['注单编号', 'bizNo'], ['牌局编号', 'roundNo'], ['会员账号', 'loginName'], ['会员ID', 'uid'],
      ['投注时间', 'betTime'], ['结算时间', 'settleTime'], ['投注金额', 'betAmount'],
      ['有效投注', 'validBet'], ['会员输赢', 'memberWin'], ['状态', 'settleStatus']
    ];
    const head = cols.map((c) => c[0]).join(',');
    const body = selection.value.map((row: any) => cols.map((c) => `"${row[c[1]] ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([`\ufeff${head}\n${body}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `投注记录_选中${selection.value.length}条.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
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

/** 「请选择类型/平台」候选：类型来自 /game/type/options，平台来自 /game/platform/options（截图同一个下拉） */
async function loadPlatformChoices() {
  try {
    const types: any = ((await gameTypeOptions('VND1000:1')) as unknown as any)?.data ?? [];
    const plats: any = ((await platformOptions()) as unknown as any)?.data ?? [];
    platformChoices.value = [
      ...(types || []).map((t: any) => ({ label: `类型：${t.typeName}`, value: `TYPE:${t.typeCode}` })),
      ...(plats || []).map((p: any) => ({
        label: `平台：${p.platformName || p.providerCode}`,
        value: `PLATFORM:${p.providerCode ?? p.platformCode}`
      }))
    ];
  } catch {
    platformChoices.value = [];
  }
}

onMounted(async () => {
  applyPeriodDefaults();
  await loadPlatformChoices();
  await reload();
});

/** 首屏按「日」给区间（截图默认当日 00:00:00 ~ 23:59:59），不触发查询 */
function applyPeriodDefaults() {
  const end = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date, tail: string) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${tail}`;
  range.value = [fmt(end, '00:00:00'), fmt(end, '23:59:59')];
}
</script>

<style scoped>
.bet-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -8px 0 8px;
}
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
