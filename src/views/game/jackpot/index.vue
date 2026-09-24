<template>
  <div class="p-2 app-container game-jackpot-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true">
        <el-form-item label="ID"><el-input v-model="query.id" placeholder="请输入ID" clearable style="width: 150px" /></el-form-item>
        <el-form-item label="展示形式">
          <el-select v-model="query.displayMode" placeholder="展示形式" clearable style="width: 140px">
            <el-option label="单独展示" :value="1" /><el-option label="多个轮播" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否展示">
          <el-select v-model="query.displayStatus" placeholder="是否展示" clearable style="width: 130px">
            <el-option label="展示" :value="1" /><el-option label="不展示" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据来源">
          <el-select v-model="query.sourceType" placeholder="数据来源" clearable style="width: 220px">
            <el-option label="WG真实彩金池(真实派发)" :value="1" /><el-option label="纯虚拟彩金池" :value="2" />
          </el-select>
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
          <div class="table-heading"><h3>彩金池管理</h3></div>
          <el-button v-hasPermi="['game:jackpot:add']" type="primary" plain icon="Plus" @click="openAdd">新增</el-button>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="ID" align="center" prop="id" width="200" />
        <el-table-column label="币种" align="center" prop="currency" width="140" />
        <el-table-column label="数据来源" align="center" width="220">
          <template #default="{ row }">{{ row.sourceType === 1 ? 'WG真实彩金池(真实派发)' : '纯虚拟彩金池' }}</template>
        </el-table-column>
        <el-table-column label="展示形式" align="center" width="120">
          <template #default="{ row }">{{ row.displayMode === 2 ? '多个轮播' : '单独展示' }}</template>
        </el-table-column>
        <el-table-column label="展示位置" align="center" width="140">
          <template #default="{ row }">{{ positionText(row.positionCode) }}</template>
        </el-table-column>
        <el-table-column label="是否展示" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.displayStatus === 1 ? 'success' : 'info'">{{ row.displayStatus === 1 ? '展示' : '不展示' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" align="center" prop="updateBy" width="120" />
        <el-table-column label="操作时间" align="center" prop="updateTime" width="180" />
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:jackpot:edit']" link type="primary" @click="openEdit(row)">修改</el-button>
            <el-button v-hasPermi="['game:jackpot:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1080px" append-to-body>
      <el-row :gutter="16">
        <el-col :span="15">
          <el-form :model="form" label-width="190px">
            <el-form-item label="币种" required>
              <el-select v-model="form.currency" style="width: 100%">
                <el-option label="越南(VND1000:1)" value="VND1000:1" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据来源" required>
              <el-radio-group v-model="form.sourceType">
                <el-radio :value="1">WG真实彩金池(真实派发)</el-radio>
                <el-radio :value="2">纯虚拟彩金池</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="展示形式" required>
              <el-radio-group v-model="form.displayMode">
                <el-radio :value="1">单独展示</el-radio><el-radio :value="2">多个轮播</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="彩金池底图" required>
              <el-radio-group v-model="form.poolImageMode">
                <el-radio :value="1">迷你图(推荐)</el-radio><el-radio :value="2">大图</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="展示位置" required>
              <el-select v-model="form.positionCode" style="width: 100%">
                <el-option label="中部菜单上方" :value="1" /><el-option label="顶部横幅" :value="2" />
                <el-option label="底部菜单上方" :value="3" /><el-option label="大厅左侧" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="跳转类型" required>
              <el-radio-group v-model="form.jumpType">
                <el-radio v-for="item in jumpTypes" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="展示金额范围" required>
              <el-input-number v-model="form.amountMin" :min="0" controls-position="right" />
              <span class="mx">~</span>
              <el-input-number v-model="form.amountMax" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item label="小数点位数" required>
              <el-select v-model="form.decimalPlaces" style="width: 100%">
                <el-option label="0 (无小数点)" :value="0" /><el-option label="1 位" :value="1" /><el-option label="2 位" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="金额数字样式" required>
              <el-radio-group v-model="form.numberStyle">
                <el-radio value="style1">样式1</el-radio><el-radio value="style2">样式2</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="彩金池底图样式" required>
              <el-radio-group v-model="form.skinStyle">
                <el-radio v-for="i in 6" :key="i" :value="`style${i}`">样式{{ i }}</el-radio>
                <el-radio value="custom">自定义</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="form.skinStyle === 'custom'" label="自定义底图">
              <el-input v-model="form.imageUrl" placeholder="png/jpg，≤2MB，建议 214px × 68px" />
            </el-form-item>
            <el-form-item label="是否展示">
              <el-switch v-model="form.displayStatus" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="后台备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
          </el-form>
        </el-col>
        <el-col :span="9">
          <h4>预览</h4>
          <div class="preview-box">
            <span>JACKPOT</span>
            <div class="preview-amount">{{ previewText }}</div>
          </div>
        </el-col>
      </el-row>
      <template #footer>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确 认</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listJackpot, addJackpot, updateJackpot, delJackpot } from '@/api/game/display';

defineOptions({ name: 'GameJackpot' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 10 });
const dialog = reactive({ visible: false, title: '新增', loading: false });
const form = reactive<any>({ currency: 'VND1000:1', sourceType: 2, displayMode: 1, poolImageMode: 1,
  positionCode: 1, jumpType: 'NONE', amountMin: 2000000, amountMax: 2000000, decimalPlaces: 0,
  numberStyle: 'style1', skinStyle: 'style1', displayStatus: 0, virtualBaseAmount: 0, virtualGrowthPerHour: 0 });

const jumpTypes = [
  { label: '无', value: 'NONE' }, { label: '棋牌', value: 'CARD' }, { label: '捕鱼', value: 'FISH' },
  { label: '电子', value: 'ESPORT' }, { label: '真人', value: 'LIVE' }, { label: '体育', value: 'SPORT' },
  { label: '斗鸡', value: 'COCK' }, { label: '电竞', value: 'E_GAME' }, { label: '彩票', value: 'LOTTERY' },
  { label: '区块链', value: 'BLOCKCHAIN' }, { label: 'TG内置游戏', value: 'TG_GAME' },
  { label: '活动', value: 'ACTIVITY' }, { label: '任务', value: 'TASK' }, { label: '外部链接', value: 'EXTERNAL' }
];

const positionText = (code: number) => (['—', '中部菜单上方', '顶部横幅', '底部菜单上方', '大厅左侧'][code] ?? '—');
const previewText = computed(() =>
  Number(form.amountMin || 0).toLocaleString('en-US', { minimumFractionDigits: form.decimalPlaces || 0 }));

async function getList() {
  loading.value = true;
  try {
    const res: any = await listJackpot(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, id: undefined, displayMode: undefined, displayStatus: undefined, sourceType: undefined });
  getList();
}

function openAdd() {
  Object.assign(form, { id: undefined, currency: 'VND1000:1', sourceType: 2, displayMode: 1, poolImageMode: 1,
    positionCode: 1, jumpType: 'NONE', amountMin: 2000000, amountMax: 2000000, decimalPlaces: 0,
    numberStyle: 'style1', skinStyle: 'style1', displayStatus: 0 });
  dialog.title = '新增';
  dialog.visible = true;
}

function openEdit(row: any) {
  Object.assign(form, row);
  dialog.title = '修改';
  dialog.visible = true;
}

async function submitForm() {
  if (form.amountMax > 0 && form.amountMin > form.amountMax) {
    ElMessage.warning('展示金额范围下限不能大于上限');
    return;
  }
  if (form.jumpType === 'EXTERNAL' && !form.jumpTarget) {
    ElMessage.warning('跳转类型为外部链接时必须填写跳转目标');
    return;
  }
  dialog.loading = true;
  try {
    if (form.id) {
      await updateJackpot(form);
    } else {
      await addJackpot(form);
    }
    ElMessage.success('保存成功');
    dialog.visible = false;
    getList();
  } finally {
    dialog.loading = false;
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确认删除该彩金池配置？', '提示', { type: 'warning' });
  await delJackpot(row.id);
  ElMessage.success('删除成功');
  getList();
}

onMounted(getList);
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
.mx {
  margin: 0 6px;
}
.preview-box {
  border: 1px solid #ebeef5;
  padding: 16px;
  text-align: center;
}
.preview-amount {
  font-size: 22px;
  font-weight: 700;
  color: #e6a23c;
}
</style>
