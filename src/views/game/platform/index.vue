<template>
  <div class="p-2 app-container game-platform-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="游戏类型">
          <el-select v-model="query.gameType" placeholder="棋牌" clearable style="width: 130px" @change="getList">
            <el-option v-for="item in typeOptions" :key="item.typeCode" :label="item.typeName" :value="item.typeCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="query.platformName" placeholder="全部平台" clearable filterable style="width: 170px">
            <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformName" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台跳转方式">
          <el-select v-model="query.jumpType" placeholder="请选择平台跳转方式" clearable style="width: 180px">
            <el-option label="外链" :value="1" />
            <el-option label="内嵌" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select v-model="query.maintenance" placeholder="维护状态" clearable style="width: 120px">
            <el-option label="维护中" :value="1" />
            <el-option label="正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台状态">
          <el-select v-model="query.platformStatus" placeholder="平台状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="主播展示状态">
          <el-select v-model="query.showToStreamer" placeholder="主播展示状态" clearable style="width: 140px">
            <el-option label="展示" :value="1" />
            <el-option label="不展示" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="算有效投注">
          <el-select v-model="query.countValidBet" placeholder="算有效投注" clearable style="width: 130px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障损失赔付">
          <el-select v-model="query.faultCompensation" placeholder="故障损失赔付" clearable style="width: 190px">
            <el-option label="支持(恶意或不合理除外)" :value="1" />
            <el-option label="未知或不支持" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险人工锁">
          <el-select v-model="query.riskManualLock" placeholder="风险人工锁" clearable style="width: 130px">
            <el-option label="已解除" :value="0" />
            <el-option label="锁定中" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="query.remark" placeholder="请输入备注" clearable style="width: 160px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading"><h3>平台管理</h3></div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['game:common:edit']" type="primary" plain icon="Setting" @click="openCommonConfig">
              游戏公共配置
            </el-button>
            <el-button v-hasPermi="['game:validbet:edit']" type="primary" plain icon="DataLine" @click="openValidBet">
              有效投注配置
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="排序" align="center" width="90">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" controls-position="right" style="width: 80px"
                             @change="handleSort(row)" />
          </template>
        </el-table-column>
        <el-table-column label="平台ID" align="center" prop="platformId" width="90" />
        <el-table-column label="平台名称" align="center" prop="platformName" min-width="130" />
        <el-table-column label="宣传图" align="center" width="100">
          <template #default="{ row }">
            <el-image v-if="row.bannerUrl" :src="row.bannerUrl" style="width: 70px; height: 32px" fit="cover" />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="热门开关" align="center" width="100">
          <template #default="{ row }">
            <div>模板一 <el-switch :model-value="row.hotTpl1 === 1" @change="v => switchField(row, 'hotTpl1', v)" /></div>
            <div>模板二 <el-switch :model-value="row.hotTpl2 === 1" @change="v => switchField(row, 'hotTpl2', v)" /></div>
          </template>
        </el-table-column>
        <el-table-column label="特色开关" align="center" width="100">
          <template #default="{ row }">
            <div>模板一 <el-switch :model-value="row.featureTpl1 === 1" @change="v => switchField(row, 'featureTpl1', v)" /></div>
            <div>模板二 <el-switch :model-value="row.featureTpl2 === 1" @change="v => switchField(row, 'featureTpl2', v)" /></div>
          </template>
        </el-table-column>
        <el-table-column label="维护开关" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.maintenance === 1" @change="v => openMaintenance(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="平台开关" align="center" width="100">
          <template #default="{ row }">
            <el-switch :model-value="row.platformStatus === 1" @change="v => switchField(row, 'platformStatus', v)" />
          </template>
        </el-table-column>
        <el-table-column label="展示给主播" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.showToStreamer === 1" @change="v => switchField(row, 'showToStreamer', v)" />
          </template>
        </el-table-column>
        <el-table-column label="算有效投注" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.countValidBet === 1" @change="v => switchField(row, 'countValidBet', v)" />
          </template>
        </el-table-column>
        <el-table-column label="子游戏数量" align="center" width="120">
          <template #default="{ row }">
            {{ row.subGameCount }} <el-link type="primary" @click="goSubGame(row)">管理</el-link>
          </template>
        </el-table-column>
        <el-table-column label="风险人工锁" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.riskManualLock === 1" @change="v => switchField(row, 'riskManualLock', v)" />
          </template>
        </el-table-column>
        <el-table-column label="最低准入" align="center" prop="minEntry" width="110" />
        <el-table-column label="平台跳转方式" align="center" width="150">
          <template #default="{ row }">
            <div>IOS:{{ jumpText(row.jumpIos) }}</div>
            <div>Android:{{ jumpText(row.jumpAndroid) }}</div>
            <div>H5:{{ jumpText(row.jumpH5) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="故障损失赔付(不含低杀率亏损)" align="center" width="200">
          <template #default="{ row }">
            {{ row.faultCompensation === 1 ? '支持(恶意或不合理除外)' : '未知或不支持' }}
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="120" />
        <el-table-column label="操作" align="center" width="130" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:platform:edit']" link type="primary" @click="openEdit(row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total"
                  @pagination="getList" />
    </el-card>

    <!-- 平台维护 -->
    <el-dialog v-model="maintenanceDialog.visible" title="平台维护" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="维护开关">
          <el-switch v-model="maintenanceDialog.maintenance" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="维护文案">
          <el-input v-model="maintenanceDialog.msg" type="textarea" :rows="3" placeholder="开启维护时必须填写维护文案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitMaintenance">确 定</el-button>
        <el-button @click="maintenanceDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 游戏公共配置（3 页签，其中后两个页签截图未展开，仅保留容器） -->
    <el-dialog v-model="commonDialog.visible" title="游戏公共配置" width="720px" append-to-body>
      <el-tabs v-model="commonDialog.tab">
        <el-tab-pane label="游戏相关设置" name="game">
          <el-form label-width="280px">
            <el-form-item label="返回大厅按钮">
              <el-radio-group v-model="commonForm.backHallConfirm">
                <el-radio :value="1">二次弹窗确认</el-radio>
                <el-radio :value="2">直接返回</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="已首充才能进入游戏(未充值无法进入)">
              <el-radio-group v-model="commonForm.needFirstRecharge">
                <el-radio :value="0">不限制</el-radio>
                <el-radio :value="1">开启</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="游戏名只显示一行，超过使用省略号展示">
              <el-radio-group v-model="commonForm.singleLineName">
                <el-radio :value="0">关闭</el-radio>
                <el-radio :value="1">开启</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="新游戏默认热门位置">
              <el-radio-group v-model="commonForm.newGameHotPosition">
                <el-radio :value="1">添加至第一位</el-radio>
                <el-radio :value="2">添加至最后一位</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="新游戏默认特色位置">
              <el-radio-group v-model="commonForm.newGameFeaturePosition">
                <el-radio :value="1">添加至第一位</el-radio>
                <el-radio :value="2">添加至最后一位</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="强制下载APP设置" name="download">
          <el-empty description="该页签字段以客户提供的截图/字段清单为准，本次仅保留配置容器" />
        </el-tab-pane>
        <el-tab-pane label="WG体育赔率设置" name="sport">
          <el-empty description="该页签字段以客户提供的截图/字段清单为准，本次仅保留配置容器" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button type="primary" :loading="commonDialog.loading" @click="submitCommonConfig">确 认</el-button>
        <el-button @click="commonDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 有效投注配置 -->
    <el-dialog v-model="validBetDialog.visible" title="有效投注配置" width="760px" append-to-body>
      <el-tabs v-model="validBetDialog.tab">
        <el-tab-pane label="体育和电竞" name="sport">
          <h4>体育</h4>
          <el-form label-width="260px">
            <el-form-item label="体育默认比例(0-100)">
              <el-input-number v-model="validBetForm.sportRatio" :min="0" :max="100" controls-position="right" />
              <span class="ml-1">%</span>
            </el-form-item>
            <el-form-item label="按输赢绝对值计算有效投注">
              <el-switch v-model="validBetForm.sportByAbs" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="取最小值作为有效投注">
              <el-switch v-model="validBetForm.sportTakeMin" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="按最大赔率计算有效投注">
              <el-switch v-model="validBetForm.sportByMaxOdds" :active-value="1" :inactive-value="0" />
              <el-input-number v-model="validBetForm.sportMaxOdds" :min="0" :precision="2" :disabled="validBetForm.sportByMaxOdds !== 1"
                               controls-position="right" style="margin-left: 12px" />
              <span class="ml-1">最大赔率</span>
            </el-form-item>
            <el-form-item label="低赔率不计算有效投注">
              <el-switch v-model="validBetForm.sportLowOddsSkip" :active-value="1" :inactive-value="0" />
              <el-input-number v-model="validBetForm.sportMinOdds" :min="0" :precision="2" :disabled="validBetForm.sportLowOddsSkip !== 1"
                               controls-position="right" style="margin-left: 12px" />
              <span class="ml-1">最小赔率</span>
            </el-form-item>
          </el-form>
          <h4>电竞</h4>
          <el-form label-width="260px">
            <el-form-item label="电竞默认比例(0-100)">
              <el-input-number v-model="validBetForm.esportRatio" :min="0" :max="100" controls-position="right" />
              <span class="ml-1">%</span>
            </el-form-item>
            <el-form-item label="按输赢绝对值计算有效投注">
              <el-switch v-model="validBetForm.esportByAbs" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="取最小值作为有效投注">
              <el-switch v-model="validBetForm.esportTakeMin" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="按最大赔率计算有效投注">
              <el-switch v-model="validBetForm.esportByMaxOdds" :active-value="1" :inactive-value="0" />
              <el-input-number v-model="validBetForm.esportMaxOdds" :min="0" :precision="2" :disabled="validBetForm.esportByMaxOdds !== 1"
                               controls-position="right" style="margin-left: 12px" />
              <span class="ml-1">最大赔率</span>
            </el-form-item>
            <el-form-item label="低赔率不计算有效投注">
              <el-switch v-model="validBetForm.esportLowOddsSkip" :active-value="1" :inactive-value="0" />
              <el-input-number v-model="validBetForm.esportMinOdds" :min="0" :precision="2" :disabled="validBetForm.esportLowOddsSkip !== 1"
                               controls-position="right" style="margin-left: 12px" />
              <span class="ml-1">最小赔率</span>
            </el-form-item>
          </el-form>
          <p class="tip-red">* 所有赔率设置均按照香港赔率计算方式进行设置</p>
          <p class="tip-red">* 如所有开关全部进行关闭，则有效投注值直接使用平台返回的默认有效投注值</p>
        </el-tab-pane>
        <el-tab-pane label="其他" name="other">
          <el-form label-width="260px">
            <el-form-item v-for="item in otherRatioFields" :key="item.field" :label="item.label + '(0-100)'">
              <el-input-number v-model="validBetForm[item.field]" :min="0" :max="100" controls-position="right" />
              <span class="ml-1">%</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button type="primary" :loading="validBetDialog.loading" @click="submitValidBet">确 认</el-button>
        <el-button @click="validBetDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listPlatform,
  platformOptions as fetchPlatformOptions,
  switchPlatformField,
  updatePlatformMaintenance,
  sortPlatform,
  gameTypeOptions,
  getCommonConfig,
  saveCommonConfig,
  getValidBetConfig,
  saveValidBetConfig
} from '@/api/game/manage';

defineOptions({ name: 'GamePlatform' });

const CURRENCY = 'VND1000:1';
const router = useRouter();

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const platformOptions = ref<any[]>([]);
const typeOptions = ref<any[]>([]);
const selected = ref<any[]>([]);

const query = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  gameType: 1,
  currency: CURRENCY,
  platformName: undefined,
  jumpType: undefined,
  maintenance: undefined,
  platformStatus: undefined,
  showToStreamer: undefined,
  countValidBet: undefined,
  faultCompensation: undefined,
  riskManualLock: undefined,
  remark: undefined
});

const maintenanceDialog = reactive({ visible: false, id: 0, maintenance: 0, msg: '' });
const commonDialog = reactive({ visible: false, tab: 'game', loading: false });
const validBetDialog = reactive({ visible: false, tab: 'sport', loading: false });
const commonForm = reactive<any>({});
const validBetForm = reactive<any>({});

const otherRatioFields = [
  { field: 'ratioCard', label: '棋牌计入比例' },
  { field: 'ratioFish', label: '捕鱼计入比例' },
  { field: 'ratioEsport', label: '电子计入比例' },
  { field: 'ratioLive', label: '真人计入比例' },
  { field: 'ratioCock', label: '斗鸡计入比例' },
  { field: 'ratioLottery', label: '彩票计入比例' },
  { field: 'ratioBlockchain', label: '区块链计入比例' }
];

const jumpText = (value: number) => (value === 2 ? '内嵌' : '外链');

async function getList() {
  loading.value = true;
  try {
    const res: any = await listPlatform(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, {
    pageNum: 1,
    platformName: undefined,
    jumpType: undefined,
    maintenance: undefined,
    platformStatus: undefined,
    showToStreamer: undefined,
    countValidBet: undefined,
    faultCompensation: undefined,
    riskManualLock: undefined,
    remark: undefined
  });
  getList();
}

function handleSelectionChange(value: any[]) {
  selected.value = value;
}

/** 开关单点切换（热门/特色开关会同步模板明细） */
async function switchField(row: any, field: string, value: any) {
  await switchPlatformField({ id: row.id, field, value: value ? 1 : 0 });
  row[field] = value ? 1 : 0;
  ElMessage.success('操作成功');
}

/** 维护开关：必须填写维护文案（与客户端提示文案同口径） */
function openMaintenance(row: any, value: any) {
  if (!value) {
    submitMaintenanceDirect(row, 0, '');
    return;
  }
  maintenanceDialog.id = row.id;
  maintenanceDialog.maintenance = 1;
  maintenanceDialog.msg = row.maintenanceMsg || '';
  maintenanceDialog.visible = true;
}

async function submitMaintenance() {
  if (maintenanceDialog.maintenance === 1 && !maintenanceDialog.msg) {
    ElMessage.warning('开启维护时必须填写维护文案');
    return;
  }
  await updatePlatformMaintenance({
    id: maintenanceDialog.id,
    maintenance: maintenanceDialog.maintenance,
    maintenanceMsg: maintenanceDialog.msg
  });
  maintenanceDialog.visible = false;
  ElMessage.success('操作成功');
  getList();
}

async function submitMaintenanceDirect(row: any, maintenance: number, msg: string) {
  await updatePlatformMaintenance({ id: row.id, maintenance, maintenanceMsg: msg });
  ElMessage.success('操作成功');
  getList();
}

/** 置顶/排序（截图「批量排序」） */
async function handleSort(row: any) {
  await sortPlatform([{ id: row.id, sortOrder: row.sortOrder }]);
  ElMessage.success('排序已保存');
}

/** 子游戏数量 → 子游戏管理（下钻带 platformCode 筛选） */
function goSubGame(row: any) {
  router.push({ path: '/game/subgame', query: { providerCode: row.providerCode, platformName: row.platformName } });
}

function openEdit(row: any) {
  ElMessage.info('平台修改入口：字段与截图一致，可通过接口 /infra/game/platform 提交整行（含跳转方式/赔付/最低准入）');
}

async function openCommonConfig() {
  // FIX 2026-09-23：本项目响应拦截器返回的是完整响应体 { code, msg, data }，
  // R<T> 类接口必须取 .data，否则会把包装对象当成业务数据（曾导致弹窗字段全空/页面一直 loading）。
  const res: any = await getCommonConfig(CURRENCY);
  Object.assign(commonForm, res.data ?? {});
  commonDialog.visible = true;
}

async function submitCommonConfig() {
  commonDialog.loading = true;
  try {
    await saveCommonConfig({ ...commonForm, currency: CURRENCY });
    ElMessage.success('保存成功');
    commonDialog.visible = false;
  } finally {
    commonDialog.loading = false;
  }
}

async function openValidBet() {
  const res: any = await getValidBetConfig(CURRENCY);
  Object.assign(validBetForm, res.data ?? {});
  validBetDialog.visible = true;
}

async function submitValidBet() {
  if (validBetForm.sportMaxOdds > 0 && validBetForm.sportMinOdds > validBetForm.sportMaxOdds) {
    ElMessage.warning('体育最小赔率不可大于最大赔率');
    return;
  }
  validBetDialog.loading = true;
  try {
    await saveValidBetConfig({ ...validBetForm, currency: CURRENCY });
    ElMessage.success('保存成功');
    validBetDialog.visible = false;
  } finally {
    validBetDialog.loading = false;
  }
}

onMounted(async () => {
  typeOptions.value = ((await gameTypeOptions(CURRENCY)) as unknown as any)?.data ?? [];
  platformOptions.value = ((await fetchPlatformOptions(undefined)) as unknown as any)?.data ?? [];
  getList();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-heading h3 {
  margin: 0;
  font-size: 15px;
}
.tip-red {
  color: #f56c6c;
  margin: 4px 0;
}
.ml-1 {
  margin-left: 4px;
}
</style>
