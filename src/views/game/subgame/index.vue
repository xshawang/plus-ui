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
        <el-form-item>
          <el-select v-model="query.gameField" style="width: 120px">
            <el-option label="子游戏ID" value="GAME_ID" /><el-option label="子游戏名称" value="GAME_NAME" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.gameValue" placeholder="请输入子游戏ID" clearable style="width: 170px" @keyup.enter="getList" />
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
        <!-- 排序：置顶 + 排序号（截图「排序 / 批量排序」） -->
        <el-table-column label="排序" align="center" width="130">
          <template #default="{ row }">
            <el-tooltip content="置顶" placement="top">
              <el-icon class="top-icon" :class="{ active: row.isTop === 1 }" @click="toggleTop(row)"><Top /></el-icon>
            </el-tooltip>
            <el-input-number v-model="row.sortOrder" :min="0" size="small" controls-position="right" style="width: 70px" />
          </template>
        </el-table-column>
        <el-table-column label="平台名称" align="center" prop="platformName" width="130" />
        <el-table-column label="子游戏ID" align="center" prop="gameCode" width="120" />
        <el-table-column label="子游戏名称" align="center" prop="gameName" min-width="170" />
        <el-table-column label="子游戏名称（越南语）" align="center" prop="gameNameVn" min-width="180" show-overflow-tooltip />
        <el-table-column label="子类型" align="center" prop="gameTypeName" width="110" />
        <el-table-column label="有效投注比例" align="center" width="130">
          <template #default="{ row }">
            <span v-if="row.validBetRatio !== null && row.validBetRatio !== undefined">
              {{ Number(row.validBetRatio).toFixed(4) }}%
            </span>
            <el-tag v-else type="warning" size="small">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="备注" align="center" prop="remark" min-width="110" />
        <el-table-column label="系统备注" align="center" prop="sysRemark" min-width="110" />
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:subgame:edit']" link type="primary" @click="openRemark(row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="batch-bar">
        <el-button v-hasPermi="['game:subgame:edit']" type="primary" plain icon="Sort" @click="saveBatchSort">批量排序</el-button>
      </div>
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
import { Top } from '@element-plus/icons-vue';
import {
  listSubGame,
  switchSubGameField,
  updateSubGameMaintenance,
  updateSubGameRemark,
  sortSubGame,
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

/** 置顶 / 取消置顶（只改排序列，不回写其它运营字段） */
async function toggleTop(row: any) {
  row.isTop = row.isTop === 1 ? 0 : 1;
  await sortSubGame([{ id: row.id, sortOrder: row.sortOrder ?? 0, isTop: row.isTop }]);
  ElMessage.success(row.isTop === 1 ? '已置顶' : '已取消置顶');
  getList();
}

/** 批量排序（截图「批量排序」） */
async function saveBatchSort() {
  if (!rows.value.length) {
    ElMessage.warning('当前页没有可排序数据');
    return;
  }
  await sortSubGame(rows.value.map((r) => ({ id: r.id, sortOrder: r.sortOrder ?? 0, isTop: r.isTop ?? 0 })));
  ElMessage.success('批量排序已保存');
  getList();
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
.top-icon {
  cursor: pointer;
  color: #c0c4cc;
  margin-right: 6px;
}
.top-icon.active {
  color: #409eff;
}
.batch-bar {
  margin-top: 8px;
}
</style>
