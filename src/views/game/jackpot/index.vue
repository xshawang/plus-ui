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
      <el-table v-loading="loading" border :data="rows" @selection-change="selection = $event">
        <el-table-column type="selection" width="50" align="center" />
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
      <div class="batch-bar">
        <span>已选择 {{ selection.length }} 条数据 | 共 {{ total }} 条</span>
        <el-button v-hasPermi="['game:jackpot:edit']" link type="primary" :disabled="!selection.length" @click="batchShow(1)">批量展示</el-button>
        <el-button v-hasPermi="['game:jackpot:edit']" link type="primary" :disabled="!selection.length" @click="batchShow(0)">批量不展示</el-button>
        <el-button v-hasPermi="['game:jackpot:remove']" link type="danger" :disabled="!selection.length" @click="batchDelete">批量删除</el-button>
      </div>
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
              <el-tabs v-model="numberTab" class="number-tabs">
                <el-tab-pane label="默认" name="default">
                  <el-radio-group v-model="form.numberStyle" class="style-row">
                    <el-radio value="style1" class="style-item">
                      <span class="amount style1" :style="previewStyle('style1')">12,345,678,900</span>
                    </el-radio>
                    <el-radio value="style2" class="style-item">
                      <span class="amount style2" :style="previewStyle('style2')">12,345,678,900</span>
                    </el-radio>
                  </el-radio-group>
                </el-tab-pane>
                <el-tab-pane label="自定义" name="custom">
                  <!-- 自定义金额样式：可视化编辑器（颜色/字号/字重/斜体/发光/前缀）+ 实时预览 -->
                  <div class="custom-editor">
                    <el-color-picker v-model="customStyle.color" />
                    <el-input-number v-model="customStyle.fontSize" :min="10" :max="72" size="small" controls-position="right" style="width: 110px" />
                    <el-select v-model="customStyle.fontWeight" size="small" style="width: 110px">
                      <el-option label="常规" value="400" /><el-option label="加粗" value="700" />
                    </el-select>
                    <el-checkbox v-model="customStyle.italic">斜体</el-checkbox>
                    <el-checkbox v-model="customStyle.shadow">发光</el-checkbox>
                    <el-input v-model="customStyle.prefix" size="small" placeholder="前缀，如 VND" style="width: 140px" />
                  </div>
                  <span class="amount" :style="previewStyle('custom')">{{ customStyle.prefix }}12,345,678,900</span>
                </el-tab-pane>
              </el-tabs>
            </el-form-item>
            <el-form-item label="彩金池底图样式" required>
              <el-radio-group v-model="form.skinStyle" class="style-grid">
                <el-radio v-for="i in 6" :key="i" :value="`style${i}`" class="skin-item">
                  <span class="skin" :class="`skin-${i}`">JACKPOT</span>
                </el-radio>
                <el-radio value="custom" class="skin-item"><span class="skin skin-custom">自定义</span></el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="form.skinStyle === 'custom'" label="自定义底图（png/jpg，≤2MB，建议 214×68）">
              <el-upload :action="uploadUrl" :headers="uploadHeaders" name="file" :show-file-list="false"
                         accept=".png,.jpg,.jpeg" :before-upload="beforeUpload" @success="onUploadSuccess" @error="onUploadError">
                <el-button type="primary" plain icon="Upload">点击上传底图</el-button>
              </el-upload>
              <el-image v-if="skinPreview" :src="skinPreview" style="width: 110px; height: 46px; margin-left: 10px" fit="cover" />
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
            <div class="preview-amount" :style="previewStyle(numberTab === 'custom' ? 'custom' : form.numberStyle)">
              {{ previewText }}
            </div>
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
import { getToken } from '@/utils/auth';
import { fetchGameImageObjectUrl } from '@/utils/game-image';
import { listJackpot, addJackpot, updateJackpot, delJackpot } from '@/api/game/display';

defineOptions({ name: 'GameJackpot' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const selection = ref<any[]>([]);
const numberTab = ref('default');
/** 上传地址：走本轮新增的 /infra/game/upload/image（本机 dev 未部署 OSS，接口保持可替换） */
const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/infra/game/upload/image`;
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${getToken()}` }));
/** 自定义金额样式编辑器状态（保存时序列化为 CSS 存 customNumberCss） */
const customStyle = reactive<any>({ color: '#FFD700', fontSize: 22, fontWeight: '700', italic: false, shadow: true, prefix: '' });
/** 自定义底图预览：带 token 拉取后转 objectURL（<img> 无法带 token） */
const skinPreview = ref('');
// FIX 2026-09-24：不能在这里直接 watch(form.imageUrl) —— form 在下方才声明，
// setup 阶段会抛 "Cannot access 'form' before initialization"（TDZ），页面整体空白。
// 改为在 onMounted 里注册监听（此时 form 已完成初始化）。
onMounted(() => {
  watch(() => form.imageUrl, async (url) => {
    skinPreview.value = url ? await fetchGameImageObjectUrl(url) : '';
  }, { immediate: true });
});

/** 上传前校验：仅 png/jpg 且 ≤2MB（截图要求） */
function beforeUpload(file: any) {
  const okType = ['image/png', 'image/jpeg'].includes(file.type);
  const okSize = file.size / 1024 / 1024 <= 2;
  if (!okType) ElMessage.error('仅支持 png/jpg 格式');
  if (!okSize) ElMessage.error('图片不能超过 2MB');
  return okType && okSize;
}

function onUploadSuccess(res: any) {
  if (res?.code === 200) {
    form.imageUrl = res.data.url;
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(res?.msg || '上传失败');
  }
}

function onUploadError() {
  ElMessage.error('上传失败，请检查登录状态或接口是否可用');
}

/** 库内存相对 URL（/infra/...），渲染时补 dev 代理前缀 */
function resolveUrl(url: string) {
  return url && url.startsWith('/infra') ? `${import.meta.env.VITE_APP_BASE_API}${url}` : url;
}

/** 金额样式预览：默认两样式固定视觉，自定义走编辑器 */
function previewStyle(style: string) {
  if (style === 'style1') return { color: '#e6a23c', fontWeight: 700, fontSize: '16px' };
  if (style === 'style2') return { color: '#f56c6c', fontWeight: 700, fontSize: '16px', textShadow: '0 0 4px #ffd8d8' };
  return {
    color: customStyle.color,
    fontSize: `${customStyle.fontSize}px`,
    fontWeight: customStyle.fontWeight,
    fontStyle: customStyle.italic ? 'italic' : 'normal',
    textShadow: customStyle.shadow ? `0 0 6px ${customStyle.color}` : 'none'
  };
}

/** 编辑器状态 → CSS 串（保存进 customNumberCss） */
function buildCustomCss() {
  return `color:${customStyle.color};font-size:${customStyle.fontSize}px;font-weight:${customStyle.fontWeight};`
    + `font-style:${customStyle.italic ? 'italic' : 'normal'};`
    + `text-shadow:${customStyle.shadow ? `0 0 6px ${customStyle.color}` : 'none'};`
    + `prefix:${customStyle.prefix}`;
}

/** CSS 串 → 编辑器状态（打开修改时回填） */
function parseCustomCss(css: string) {
  if (!css) return;
  const pick = (key: string) => css.match(new RegExp(`${key}:([^;]+)`))?.[1]?.trim();
  customStyle.color = pick('color') || customStyle.color;
  customStyle.fontSize = Number(pick('font-size')?.replace('px', '')) || customStyle.fontSize;
  customStyle.fontWeight = pick('font-weight') || customStyle.fontWeight;
  customStyle.italic = (pick('font-style') || '') === 'italic';
  customStyle.shadow = (pick('text-shadow') || 'none') !== 'none';
  customStyle.prefix = pick('prefix') || '';
}
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
  numberTab.value = row.numberStyle === 'custom' ? 'custom' : 'default';
  parseCustomCss(row.customNumberCss);
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
    // 自定义金额样式：编辑器状态序列化成 CSS 一并提交
    if (numberTab.value === 'custom') {
      form.numberStyle = 'custom';
      form.customNumberCss = buildCustomCss();
    }
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

/** 批量展示 / 不展示（列表批量操作） */
async function batchShow(status: number) {
  for (const row of selection.value) {
    await updateJackpot({ id: row.id, displayStatus: status });
  }
  ElMessage.success(`已${status === 1 ? '展示' : '不展示'} ${selection.value.length} 条`);
  getList();
}

/** 批量删除 */
async function batchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selection.value.length} 条彩金池配置？`, '提示', { type: 'warning' });
  for (const row of selection.value) {
    await delJackpot(row.id);
  }
  ElMessage.success('批量删除成功');
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
.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
.style-row {
  display: flex;
  gap: 16px;
}
.amount {
  font-weight: 700;
  letter-spacing: 1px;
}
.amount.style1 { color: #e6a23c; }
.amount.style2 { color: #f56c6c; text-shadow: 0 0 4px #ffd8d8; }
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.skin-item {
  margin-right: 0;
}
.skin {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 4px;
  font-weight: 700;
  color: #fff;
  font-size: 12px;
}
.skin-1 { background: linear-gradient(90deg, #d0021b, #f56c6c); }
.skin-2 { background: linear-gradient(90deg, #f56c6c, #fa8c16); }
.skin-3 { background: linear-gradient(90deg, #722ed1, #b37feb); }
.skin-4 { background: linear-gradient(90deg, #237804, #52c41a); }
.skin-5 { background: linear-gradient(90deg, #0050b3, #40a9ff); }
.skin-6 { background: linear-gradient(90deg, #c41d7f, #eb2f96); }
.skin-custom { background: #909399; }
.custom-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
</style>
