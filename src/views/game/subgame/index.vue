<template>
  <div class="p-2 app-container game-subgame-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="游戏类型">
          <el-select v-model="query.gameType" placeholder="棋牌" clearable style="width: 120px" @change="getList">
            <el-option v-for="item in typeOptions" :key="item.typeCode" :label="item.typeName" :value="item.typeCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台名称">
          <el-select v-model="query.providerCode" placeholder="平台名称" clearable filterable style="width: 170px" @change="getList">
            <el-option v-for="item in platformList" :key="item.providerCode" :label="item.platformName" :value="item.providerCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="子类别">
          <el-select v-model="query.subCategory" placeholder="全部子类别" clearable style="width: 140px">
            <el-option label="桌面游戏" value="桌面游戏" />
            <el-option label="街机游戏" value="街机游戏" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select v-model="query.maintenance" placeholder="维护状态" clearable style="width: 120px">
            <el-option label="维护中" :value="1" /><el-option label="正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏状态">
          <el-select v-model="query.status" placeholder="游戏状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" /><el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="角标名称">
          <el-select v-model="query.cornerName" placeholder="角标名称" clearable style="width: 120px">
            <el-option label="无" value="无" /><el-option label="热门" value="热门" />
            <el-option label="新" value="新" /><el-option label="推荐" value="推荐" />
          </el-select>
        </el-form-item>
        <el-form-item label="主播展示状态">
          <el-select v-model="query.showToStreamer" placeholder="主播展示状态" clearable style="width: 140px">
            <el-option label="展示" :value="1" /><el-option label="不展示" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="独立展示到类型">
          <el-select v-model="query.independentType" placeholder="独立展示到类型" clearable style="width: 160px">
            <el-option label="打开" :value="1" /><el-option label="关闭" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.gameField" style="width: 120px">
            <el-option label="子游戏ID" value="GAME_ID" /><el-option label="子游戏名称" value="GAME_NAME" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.gameValue" placeholder="请输入子游戏ID" clearable style="width: 170px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="算有效投注">
          <el-select v-model="query.countValidBet" placeholder="算有效投注" clearable style="width: 130px">
            <el-option label="是" :value="1" /><el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险人工锁">
          <el-select v-model="query.riskManualLock" placeholder="风险人工锁" clearable style="width: 130px">
            <el-option label="已解除" :value="0" /><el-option label="锁定中" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证">
          <el-select v-model="query.authStatus" placeholder="认证" clearable style="width: 120px">
            <el-option label="已认证" :value="1" /><el-option label="未认证" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统备注">
          <el-select v-model="query.remarkField" style="width: 120px">
            <el-option label="系统备注" value="LIKE" /><el-option label="精确匹配" value="EQ" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.remarkValue" placeholder="请输入系统备注" clearable style="width: 170px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header><div class="table-heading"><h3>子游戏管理</h3></div></template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="平台名称" align="center" prop="platformName" width="130" />
        <el-table-column label="子类别" align="center" prop="subCategory" width="110" />
        <el-table-column label="子游戏ID" align="center" prop="gameCode" width="120" />
        <el-table-column label="子游戏名称" align="center" prop="gameName" min-width="170" />
        <el-table-column label="icon缩略图" align="center" width="100">
          <template #default="{ row }">
            <el-image v-if="row.iconUrl" :src="row.iconUrl" style="width: 36px; height: 36px" fit="cover" />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="认证" align="center" width="90">
          <template #default="{ row }">{{ row.authStatus === 1 ? '已认证' : '—' }}</template>
        </el-table-column>
        <el-table-column label="热门开关" align="center" width="100">
          <template #default="{ row }">
            <div>一 <el-switch :model-value="row.hotTpl1 === 1" @change="v => switchField(row, 'hot_tpl1', 'hotTpl1', v, 'hot_1', 1)" /></div>
            <div>二 <el-switch :model-value="row.hotTpl2 === 1" @change="v => switchField(row, 'hot_tpl2', 'hotTpl2', v, 'hot_2', 1)" /></div>
          </template>
        </el-table-column>
        <el-table-column label="特色开关" align="center" width="100">
          <template #default="{ row }">
            <div>一 <el-switch :model-value="row.featureTpl1 === 1" @change="v => switchField(row, 'feature_tpl1', 'featureTpl1', v, 'feature_1', 2)" /></div>
            <div>二 <el-switch :model-value="row.featureTpl2 === 1" @change="v => switchField(row, 'feature_tpl2', 'featureTpl2', v, 'feature_2', 2)" /></div>
          </template>
        </el-table-column>
        <el-table-column label="角标名称" align="center" prop="cornerName" width="100" />
        <el-table-column label="维护开关" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.maintenance === 1" @change="v => openMaintenance(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="游戏开关" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="v => switchField(row, 'status', 'status', v, null, null)" />
          </template>
        </el-table-column>
        <el-table-column label="展示给主播" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.showToStreamer === 1" @change="v => switchField(row, 'show_to_streamer', 'showToStreamer', v, null, null)" />
          </template>
        </el-table-column>
        <el-table-column label="独立展示到类型" align="center" width="140">
          <template #default="{ row }">{{ row.independentType === 1 ? '打开' : '关闭' }}</template>
        </el-table-column>
        <el-table-column label="算有效投注" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.countValidBet === 1" @change="v => switchField(row, 'count_valid_bet', 'countValidBet', v, null, null)" />
          </template>
        </el-table-column>
        <el-table-column label="风险人工锁" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.riskManualLock === 1" @change="v => switchField(row, 'risk_manual_lock', 'riskManualLock', v, null, null)" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="110" />
        <el-table-column label="系统备注" align="center" prop="sysRemark" min-width="110" />
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:subgame:edit']" link type="primary" @click="openRemark(row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="maintenanceDialog.visible" title="子游戏维护" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="维护开关">
          <el-switch v-model="maintenanceDialog.maintenance" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="维护文案">
          <el-input v-model="maintenanceDialog.msg" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitMaintenance">确 定</el-button>
        <el-button @click="maintenanceDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="remarkDialog.visible" title="备注维护" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="备注"><el-input v-model="remarkDialog.remark" /></el-form-item>
        <el-form-item label="系统备注"><el-input v-model="remarkDialog.sysRemark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitRemark">确 定</el-button>
        <el-button @click="remarkDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  listSubGame,
  switchSubGameField,
  updateSubGameMaintenance,
  updateSubGameRemark,
  platformOptions as fetchPlatformOptions,
  gameTypeOptions
} from '@/api/game/manage';

defineOptions({ name: 'GameSubGame' });

const CURRENCY = 'VND1000:1';
const route = useRoute();
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const platformList = ref<any[]>([]);
const typeOptions = ref<any[]>([]);

const query = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  gameType: 1,
  currency: CURRENCY,
  providerCode: (route.query.providerCode as string) || undefined
});

const maintenanceDialog = reactive({ visible: false, id: 0, maintenance: 0, msg: '' });
const remarkDialog = reactive({ visible: false, id: 0, remark: '', sysRemark: '' });

async function getList() {
  loading.value = true;
  try {
    const res: any = await listSubGame(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, providerCode: undefined, subCategory: undefined, maintenance: undefined,
    status: undefined, cornerName: undefined, showToStreamer: undefined, independentType: undefined,
    gameValue: undefined, countValidBet: undefined, riskManualLock: undefined, authStatus: undefined, remarkValue: undefined });
  getList();
}

/** 开关切换：热门/特色开关会同步模板明细（需带 gameCode + templateCode） */
async function switchField(row: any, field: string, camel: string, value: any, templateCode: string | null, templateType: number | null) {
  await switchSubGameField({
    id: row.id,
    field,
    gameCode: row.gameCode,
    providerCode: row.providerCode,
    currency: row.currency || CURRENCY,
    value: value ? 1 : 0,
    templateCode,
    templateType
  });
  row[camel] = value ? 1 : 0;
  ElMessage.success('操作成功');
}

function openMaintenance(row: any, value: any) {
  if (!value) {
    updateSubGameMaintenance({ id: row.id, maintenance: 0, maintenanceMsg: '' }).then(() => {
      ElMessage.success('操作成功');
      getList();
    });
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
  await updateSubGameMaintenance({ id: maintenanceDialog.id, maintenance: maintenanceDialog.maintenance, maintenanceMsg: maintenanceDialog.msg });
  maintenanceDialog.visible = false;
  ElMessage.success('操作成功');
  getList();
}

function openRemark(row: any) {
  remarkDialog.id = row.id;
  remarkDialog.remark = row.remark || '';
  remarkDialog.sysRemark = row.sysRemark || '';
  remarkDialog.visible = true;
}

async function submitRemark() {
  await updateSubGameRemark({ id: remarkDialog.id, remark: remarkDialog.remark, sysRemark: remarkDialog.sysRemark });
  remarkDialog.visible = false;
  ElMessage.success('保存成功');
  getList();
}

onMounted(async () => {
  typeOptions.value = ((await gameTypeOptions(CURRENCY)) as unknown as any)?.data ?? [];
  platformList.value = ((await fetchPlatformOptions(undefined)) as unknown as any)?.data ?? [];
  getList();
});
</script>

<style scoped>
.table-heading h3 {
  margin: 0;
  font-size: 15px;
}
</style>
