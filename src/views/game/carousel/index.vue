<template>
  <div class="p-2 app-container game-carousel-page">
    <el-card shadow="hover">
      <el-tabs v-model="query.tab" @tab-change="getList">
        <el-tab-pane label="展示中" name="active" />
        <el-tab-pane label="草稿及下架" name="draft" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>
      <el-form :inline="true">
        <el-form-item label="时间">
          <el-date-picker v-model="range" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
                          start-placeholder="开始时间" end-placeholder="结束时间" style="width: 380px" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="query.currency" placeholder="请选择币种" clearable style="width: 140px">
            <el-option label="VND" value="VND" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示位置">
          <el-select v-model="query.positionCode" placeholder="展示位置" clearable style="width: 150px">
            <el-option label="中部菜单上方" :value="1" /><el-option label="顶部横幅" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="query.operatorId" placeholder="请输入操作人" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button v-hasPermi="['game:carousel:add']" type="primary" plain icon="Plus" @click="openAdd">新建</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="ID" align="center" prop="id" width="200" />
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="展示位置" align="center" width="140">
          <template #default="{ row }">{{ positionText(row.positionCode) }}</template>
        </el-table-column>
        <el-table-column label="展示样式" align="center" prop="styleCode" width="120" />
        <el-table-column label="展示金额区间" align="center" width="190">
          <template #default="{ row }">{{ row.amountMin }}-{{ row.amountMax }}</template>
        </el-table-column>
        <el-table-column label="展示高倍区间" align="center" width="190">
          <template #default="{ row }">{{ row.highMin }}-{{ row.highMax }}</template>
        </el-table-column>
        <el-table-column label="注单有效时长(H)" align="center" prop="orderValidHours" width="140" />
        <el-table-column label="是否生成虚拟数据" align="center" width="160">
          <template #default="{ row }">{{ row.genVirtual === 1 ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="展示游戏品牌" align="center" prop="gameScope" width="150" />
        <el-table-column label="数据统计频率(M)" align="center" prop="statFreqMinutes" width="150" />
        <el-table-column label="最低展示数据量" align="center" prop="minDisplayCount" width="140" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.configStatus === 1 ? 'success' : 'info'">
              {{ row.configStatus === 1 ? '展示中' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="后台备注" align="center" prop="remark" min-width="120" />
        <el-table-column label="操作人" align="center" prop="operatorId" width="110" />
        <el-table-column label="操作时间" align="center" prop="updateTime" width="180" />
        <el-table-column label="操作" align="center" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-hasPermi="['game:carousel:edit']" link type="primary" @click="openEdit(row)">修改</el-button>
            <el-button v-hasPermi="['game:carousel:offline']" link type="danger" :disabled="row.configStatus !== 1" @click="offline(row)">下架</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1200px" append-to-body>
      <el-row :gutter="16">
        <el-col :span="15">
          <h4>基础配置</h4>
          <el-form :model="form" label-width="170px">
            <el-form-item label="币种" required>
              <el-select v-model="form.currency" style="width: 100%"><el-option label="越南(VND1000:1)" value="VND" /></el-select>
            </el-form-item>
            <el-form-item label="展示位置" required>
              <el-select v-model="form.positionCode" style="width: 100%">
                <el-option label="中部菜单上方" :value="1" /><el-option label="顶部横幅" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="展示样式" required>
              <el-radio-group v-model="form.styleCode">
                <el-radio v-for="i in 7" :key="i" :value="`style${i}`">样式{{ i }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="背景图片">
              <el-input v-model="form.backgroundUrl" placeholder="png/jpg ≤1MB，建议 710px × 137px" />
            </el-form-item>
            <el-form-item label="字体颜色">
              <el-color-picker v-model="form.colorUser" /> 颜色1(用户信息)
              <el-color-picker v-model="form.colorAmount" class="ml" /> 颜色2(金额)
              <el-color-picker v-model="form.colorOther" class="ml" /> 颜色3(其他)
            </el-form-item>
          </el-form>

          <h4>会员中奖数据</h4>
          <el-form :model="form" label-width="170px">
            <el-form-item label="中奖用户展示信息" required>
              <el-radio-group v-model="form.userDisplayType">
                <el-radio :value="1">账号</el-radio><el-radio :value="2">ID</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="展示金额区间" required>
              <el-input-number v-model="form.amountMin" :min="1" :max="99999999" controls-position="right" />
              <span class="mx">~</span>
              <el-input-number v-model="form.amountMax" :min="1" :max="99999999" controls-position="right" />
            </el-form-item>
            <el-form-item label="展示高倍区间" required>
              <el-input-number v-model="form.highMin" :min="1" :max="9999999" controls-position="right" />
              <span class="mx">~</span>
              <el-input-number v-model="form.highMax" :min="1" :max="9999999" controls-position="right" />
            </el-form-item>
            <el-form-item label="注单有效时长(H)" required>
              <el-input-number v-model="form.orderValidHours" :min="0.01" :precision="2" controls-position="right" />
            </el-form-item>
            <el-form-item label="数据统计频率(M)" required>
              <el-input-number v-model="form.statFreqMinutes" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="展示全部真实数据" required>
              <el-radio-group v-model="form.showAllReal">
                <el-radio :value="1">展示</el-radio><el-radio :value="0">跟随虚拟游戏数据配置</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="后台备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
            </el-form-item>
          </el-form>

          <h4>虚拟中奖数据</h4>
          <el-form :model="form" label-width="170px">
            <el-form-item label="是否生成虚拟数据" required>
              <el-radio-group v-model="form.genVirtual">
                <el-radio :value="1">生成</el-radio><el-radio :value="0">不生成(纯真实)</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="最低展示数据量" required>
              <el-input-number v-model="form.minDisplayCount" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item label="展示的游戏">
              <el-input v-model="form.gameScope" placeholder="逗号分隔，如 捕鱼,电子" />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="9">
          <h4>预览图</h4>
          <div class="preview-box">
            <p>大奖记录</p>
            <div v-for="(row, index) in previewRows" :key="index" class="preview-row">
              <span>恭喜 {{ row.accountMask || row.uid }} 赢得 {{ row.amountText }}</span>
            </div>
            <el-empty v-if="!previewRows.length" description="暂无预览数据" />
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
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listCarousel, addCarousel, updateCarousel, previewCarousel, offlineCarousel } from '@/api/game/display';

defineOptions({ name: 'GameCarousel' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const previewRows = ref<any[]>([]);
const range = ref<any>([]);
const query = reactive<any>({ pageNum: 1, pageSize: 10, tab: 'active' });
const dialog = reactive({ visible: false, title: '新建', loading: false });
const form = reactive<any>({});

const positionText = (code: number) => (['—', '中部菜单上方', '顶部横幅', '底部菜单上方', '大厅左侧'][code] ?? '—');

async function getList() {
  loading.value = true;
  try {
    const params: any = { ...query };
    if (range.value?.length === 2) {
      params.params = { beginTime: range.value[0], endTime: range.value[1] };
    }
    const res: any = await listCarousel(params);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, currency: undefined, positionCode: undefined, operatorId: undefined });
  range.value = [];
  getList();
}

function defaultForm() {
  return { currency: 'VND', positionCode: 1, styleCode: 'style2', userDisplayType: 2, amountMin: 8888,
    amountMax: 99999999, highMin: 150, highMax: 9999999, orderValidHours: 0.1, statFreqMinutes: 30,
    showAllReal: 1, genVirtual: 1, minDisplayCount: 30, gameScope: '捕鱼,电子', configStatus: 1 };
}

function openAdd() {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, defaultForm());
  previewRows.value = [];
  dialog.title = '新建';
  dialog.visible = true;
}

async function openEdit(row: any) {
  Object.assign(form, row);
  previewRows.value = ((await previewCarousel(row.id)) as unknown as any)?.data ?? [];
  dialog.title = '修改';
  dialog.visible = true;
}

async function openDetail(row: any) {
  Object.assign(form, row);
  previewRows.value = ((await previewCarousel(row.id)) as unknown as any)?.data ?? [];
  dialog.title = '详情';
  dialog.visible = true;
}

async function submitForm() {
  if (form.amountMin > form.amountMax) {
    ElMessage.warning('展示金额区间下限不能大于上限');
    return;
  }
  if (form.highMin > form.highMax) {
    ElMessage.warning('展示高倍区间下限不能大于上限');
    return;
  }
  dialog.loading = true;
  try {
    if (form.id) {
      await updateCarousel(form);
    } else {
      await addCarousel(form);
    }
    ElMessage.success('保存成功');
    dialog.visible = false;
    getList();
  } finally {
    dialog.loading = false;
  }
}

async function offline(row: any) {
  await offlineCarousel(row.id);
  ElMessage.success('已下架');
  getList();
}

onMounted(getList);
</script>

<style scoped>
.mx {
  margin: 0 6px;
}
.ml {
  margin-left: 12px;
}
.preview-box {
  border: 1px solid #ebeef5;
  padding: 12px;
  min-height: 120px;
}
.preview-row {
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
  font-size: 13px;
}
</style>
