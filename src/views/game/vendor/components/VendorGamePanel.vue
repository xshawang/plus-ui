<template>
  <div class="vendor-game-panel">
    <!--
      三方游戏展示与上下架：厂商级（整家停用/维护/排序）+ 游戏级（上下架/维护/置顶排序）。
      生效口径：玩家大厅只显示"游戏上架且厂商上架"的游戏；维护中仍显示但置灰、不能进入；
      下架或维护后，新的进入请求与新投注回调都会被拒绝，已下注的派奖/回滚照常结算。改动即时同步到玩家大厅。
    -->
    <el-card shadow="hover" class="mb12">
      <template #header>
        <div class="panel-header">
          <span class="title">厂商</span>
          <span class="muted">厂商下架 = 该厂商全部游戏从玩家大厅消失；排序值越小越靠前</span>
          <el-button icon="Refresh" size="small" class="ml-auto" @click="loadPlatforms">刷新</el-button>
        </div>
      </template>
      <el-table v-loading="platformLoading" :data="platforms" border size="small" empty-text="还没有导入的厂商，请先在「厂商同步」导入">
        <el-table-column label="厂商" min-width="150">
          <template #default="{ row }">
            <div class="strong">{{ row.vendorName }}</div>
            <div class="muted">{{ row.providerCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="上架" width="90" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" :disabled="!canEdit" :loading="busy === 'p-status-' + row.providerCode"
              @change="(v: boolean) => togglePlatformStatus(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="维护" min-width="150">
          <template #default="{ row }">
            <el-switch :model-value="row.maintenance === 1" :disabled="!canEdit" :loading="busy === 'p-mt-' + row.providerCode"
              @change="(v: boolean) => togglePlatformMaintenance(row, v)" />
            <span v-if="row.maintenance === 1" class="muted ml8">{{ row.maintenanceMsg }}</span>
          </template>
        </el-table-column>
        <el-table-column label="游戏上架 / 总数" width="130" align="center">
          <template #default="{ row }">
            <b>{{ row.gameListed }}</b> / {{ row.gameTotal }}
            <div v-if="row.gameMaintenance" class="muted">维护 {{ row.gameMaintenance }}</div>
          </template>
        </el-table-column>
        <el-table-column label="置顶 / 排序" width="190">
          <template #default="{ row }">
            <el-switch v-model="row.isTop" :active-value="1" :inactive-value="0" :disabled="!canEdit" size="small"
              @change="savePlatformDisplay(row)" />
            <el-input-number v-model="row.sortOrder" :min="0" :max="999999" :disabled="!canEdit" size="small" controls-position="right"
              class="sort-input ml8" @change="savePlatformDisplay(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="230">
          <template #default="{ row }">
            <el-button link type="primary" @click="filterBy(row.providerCode)">查看游戏</el-button>
            <template v-if="canEdit">
              <el-button link type="success" :disabled="row.gameListed === row.gameTotal" @click="setAllGames(row, 1)">全部上架</el-button>
              <el-button link type="danger" :disabled="row.gameListed === 0" @click="setAllGames(row, 0)">全部下架</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover">
      <el-form :inline="true" class="query-form">
        <el-form-item label="厂商">
          <el-select v-model="query.providerCode" clearable placeholder="全部" style="width: 170px" @change="search">
            <el-option v-for="p in platforms" :key="p.providerCode" :label="p.vendorName" :value="p.providerCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="上下架">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 110px" @change="search">
            <el-option label="已上架" :value="1" /><el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护">
          <el-select v-model="query.maintenance" clearable placeholder="全部" style="width: 110px" @change="search">
            <el-option label="维护中" :value="1" /><el-option label="正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="代码 / 名称" style="width: 180px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="canEdit" class="batch-bar">
        <span class="muted">已选 {{ selected.length }} 款</span>
        <el-button type="success" plain size="small" :disabled="!selected.length" @click="batchStatus(1)">批量上架</el-button>
        <el-button type="danger" plain size="small" :disabled="!selected.length" @click="batchStatus(0)">批量下架</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" border row-key="gameCode" @selection-change="(s: VendorGameVO[]) => (selected = s)">
        <el-table-column v-if="canEdit" type="selection" width="44" />
        <el-table-column label="图标" width="68" align="center">
          <template #default="{ row }">
            <el-image v-if="row.iconUrl" :src="row.iconUrl" fit="cover" class="icon" lazy>
              <template #error><div class="icon icon-fallback">{{ (row.gameName || row.gameCode).slice(0, 1) }}</div></template>
            </el-image>
            <div v-else class="icon icon-fallback">{{ (row.gameName || row.gameCode).slice(0, 1) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="游戏" min-width="180">
          <template #default="{ row }">
            <div class="strong">{{ row.gameName }}</div>
            <div class="muted">{{ row.gameCode }}<template v-if="row.gameNameVn"> · {{ row.gameNameVn }}</template></div>
          </template>
        </el-table-column>
        <el-table-column label="厂商" prop="vendorName" min-width="110" />
        <el-table-column label="分类" prop="category" width="90" />
        <el-table-column label="上架" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" :disabled="!canEdit" :loading="busy === 'g-status-' + row.gameCode"
              @change="(v: boolean) => toggleGameStatus(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="维护" min-width="140">
          <template #default="{ row }">
            <el-switch :model-value="row.maintenance === 1" :disabled="!canEdit" :loading="busy === 'g-mt-' + row.gameCode"
              @change="(v: boolean) => toggleGameMaintenance(row, v)" />
            <span v-if="row.maintenance === 1" class="muted ml8">{{ row.maintenanceMsg }}</span>
          </template>
        </el-table-column>
        <el-table-column label="置顶 / 排序" width="190">
          <template #default="{ row }">
            <el-switch v-model="row.isTop" :active-value="1" :inactive-value="0" :disabled="!canEdit" size="small"
              @change="saveGameDisplay(row)" />
            <el-input-number v-model="row.sortOrder" :min="0" :max="999999" :disabled="!canEdit" size="small" controls-position="right"
              class="sort-input ml8" @change="saveGameDisplay(row)" />
          </template>
        </el-table-column>
        <el-table-column label="玩家端" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip :content="visibilityTip(row)" placement="top">
              <el-tag :type="row.launchable ? 'success' : row.playerVisible ? 'warning' : 'info'">
                {{ row.launchable ? '可玩' : row.playerVisible ? '置灰' : '不显示' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" width="165" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { checkPermi } from '@/utils/permission';
import {
  listVendorGames,
  listVendorPlatforms,
  setVendorGameDisplay,
  setVendorGameMaintenance,
  setVendorGamesStatus,
  setVendorPlatformDisplay,
  setVendorPlatformGamesStatus,
  setVendorPlatformMaintenance,
  setVendorPlatformStatus
} from '@/api/game/vendor';
import type { VendorGameVO, VendorPlatformVO } from '@/api/game/vendor/types';

const canEdit = computed(() => checkPermi(['game:vendor:edit']));
const platforms = ref<VendorPlatformVO[]>([]);
const platformLoading = ref(false);
const rows = ref<VendorGameVO[]>([]);
const total = ref(0);
const loading = ref(false);
const busy = ref('');
const selected = ref<VendorGameVO[]>([]);
const query = reactive<Record<string, any>>({ pageNum: 1, pageSize: 20 });

async function loadPlatforms() {
  platformLoading.value = true;
  try {
    const res: any = await listVendorPlatforms();
    platforms.value = res.data ?? [];
  } finally {
    platformLoading.value = false;
  }
}

async function getList() {
  loading.value = true;
  try {
    const res: any = await listVendorGames({ ...query });
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function refreshAll() {
  loadPlatforms();
  getList();
}

function search() {
  query.pageNum = 1;
  getList();
}

function reset() {
  Object.keys(query).forEach((k) => {
    if (k !== 'pageNum' && k !== 'pageSize') delete query[k];
  });
  search();
}

function filterBy(providerCode: string) {
  query.providerCode = providerCode;
  search();
}

/** 统一执行：带 loading 标记、成功提示与刷新；取消确认框不报错。 */
async function run(key: string, action: () => Promise<unknown>, okText: string) {
  busy.value = key;
  try {
    await action();
    ElMessage.success(okText);
    refreshAll();
  } finally {
    busy.value = '';
  }
}

async function confirm(text: string) {
  try {
    await ElMessageBox.confirm(text, '确认', { type: 'warning' });
    return true;
  } catch {
    return false;
  }
}

async function askMessage(defaultText: string) {
  try {
    const { value } = await ElMessageBox.prompt('玩家端看到的维护提示（可留空）', '设为维护', {
      inputValue: defaultText,
      inputValidator: (v: string) => (v ?? '').length <= 255 || '最多 255 个字'
    });
    return { ok: true, text: value ?? '' };
  } catch {
    return { ok: false, text: '' };
  }
}

async function togglePlatformStatus(row: VendorPlatformVO, on: boolean) {
  if (!on && !(await confirm(`下架厂商「${row.vendorName}」后，其全部游戏会从玩家大厅消失，且不能进入、不能下新注。确定下架？`))) return;
  await run('p-status-' + row.providerCode, () => setVendorPlatformStatus(row.providerCode, on ? 1 : 0), on ? '厂商已上架' : '厂商已下架');
}

async function togglePlatformMaintenance(row: VendorPlatformVO, on: boolean) {
  let text = '';
  if (on) {
    const r = await askMessage(row.maintenanceMsg || '厂商维护中，请稍后再来');
    if (!r.ok) return;
    text = r.text;
  }
  await run('p-mt-' + row.providerCode, () => setVendorPlatformMaintenance(row.providerCode, on ? 1 : 0, text), on ? '已设为维护' : '已解除维护');
}

async function savePlatformDisplay(row: VendorPlatformVO) {
  await run('p-display-' + row.providerCode, () => setVendorPlatformDisplay(row.providerCode, row.isTop ?? 0, row.sortOrder ?? 0), '排序已保存');
}

async function setAllGames(row: VendorPlatformVO, status: number) {
  const word = status === 1 ? '上架' : '下架';
  if (!(await confirm(`把「${row.vendorName}」的全部 ${row.gameTotal} 款游戏${word}？`))) return;
  await run('p-all-' + row.providerCode, () => setVendorPlatformGamesStatus(row.providerCode, status), `已全部${word}`);
}

async function toggleGameStatus(row: VendorGameVO, on: boolean) {
  await run('g-status-' + row.gameCode, () => setVendorGamesStatus([row.gameCode], on ? 1 : 0), on ? '已上架' : '已下架');
}

async function toggleGameMaintenance(row: VendorGameVO, on: boolean) {
  let text = '';
  if (on) {
    const r = await askMessage(row.maintenanceMsg || '游戏维护中，请稍后再来');
    if (!r.ok) return;
    text = r.text;
  }
  await run('g-mt-' + row.gameCode, () => setVendorGameMaintenance(row.gameCode, on ? 1 : 0, text), on ? '已设为维护' : '已解除维护');
}

async function saveGameDisplay(row: VendorGameVO) {
  await run('g-display-' + row.gameCode, () => setVendorGameDisplay(row.gameCode, row.isTop ?? 0, row.sortOrder ?? 0), '排序已保存');
}

async function batchStatus(status: number) {
  const codes = selected.value.map((r) => r.gameCode);
  const word = status === 1 ? '上架' : '下架';
  if (!(await confirm(`确定${word}选中的 ${codes.length} 款游戏？`))) return;
  await run('batch', () => setVendorGamesStatus(codes, status), `已${word} ${codes.length} 款`);
}

function visibilityTip(row: VendorGameVO) {
  if (row.platformStatus !== 1) return '所属厂商已下架，游戏不在玩家大厅显示';
  if (row.status !== 1) return '游戏已下架，不在玩家大厅显示';
  if (row.platformMaintenance === 1) return '所属厂商维护中：大厅显示但置灰，不能进入';
  if (row.maintenance === 1) return '游戏维护中：大厅显示但置灰，不能进入';
  return '玩家大厅可见，可以进入游戏';
}

onMounted(refreshAll);
</script>

<style scoped>
.panel-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.panel-header .title { font-weight: 600; }
.ml-auto { margin-left: auto; }
.ml8 { margin-left: 8px; }
.mb12 { margin-bottom: 12px; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; }
.strong { font-weight: 600; }
.batch-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sort-input { width: 100px; }
.icon { width: 40px; height: 40px; border-radius: 8px; display: block; margin: 0 auto; }
.icon-fallback {
  display: flex; align-items: center; justify-content: center; font-weight: 600;
  background: var(--el-fill-color); color: var(--el-text-color-secondary);
}
</style>
