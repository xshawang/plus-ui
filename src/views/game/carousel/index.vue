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

      <el-table v-loading="loading" border :data="rows" @selection-change="selection = $event">
        <el-table-column type="selection" width="50" align="center" />
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
      <div class="batch-bar">
        <span>已选择 {{ selection.length }} 条数据 | 共 {{ total }} 条</span>
        <el-button v-hasPermi="['game:carousel:offline']" link type="danger" :disabled="!selection.length" @click="batchOffline">批量下架</el-button>
        <el-button v-hasPermi="['game:carousel:edit']" link type="primary" :disabled="!selection.length" @click="batchOnline">批量上架</el-button>
      </div>
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
              <!-- 截图：7 个带缩略图的样式（用 CSS 底图模拟，不引入二进制素材） -->
              <el-radio-group v-model="form.styleCode" class="style-grid">
                <el-radio v-for="i in 7" :key="i" :value="`style${i}`" class="style-item">
                  <span class="thumb" :class="`thumb-${i}`">样式{{ i }}</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="背景图片">
              <el-upload :action="uploadUrl" :headers="uploadHeaders" name="file" :show-file-list="false"
                         accept=".png,.jpg,.jpeg" :before-upload="beforeUpload" @success="onUploadSuccess" @error="onUploadError">
                <el-button type="primary" plain icon="Upload">点击上传背景图</el-button>
              </el-upload>
              <span class="tip">仅 png/jpg，且不超过 1MB，宽度为 710px；建议尺寸: 710px * 137px</span>
<el-image v-if="backgroundPreview" :src="backgroundPreview"
                        style="width: 220px; height: 42px; margin-top: 6px" fit="cover" />
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
              <!-- 截图：树形多选（热门游戏/棋牌/捕鱼/电子/真人/体育…），勾选结果写入 gameScope -->
              <el-tree ref="gameTreeRef" :data="gameTree" show-checkbox node-key="value" default-expand-all
                       :props="{ label: 'label', children: 'children' }"
                       style="width: 100%; border: 1px solid #ebeef5; padding: 6px"
                       @check="onGameScopeChange" />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="9">
          <h4>预览图</h4>
          <!-- 按截图还原「大奖记录」三卡片预览（脱敏账号 + K/M 化金额 + 跑马灯动画） -->
          <div class="preview-box" :style="previewBoxStyle">
            <p>大奖记录</p>
            <div class="marquee">
              <div v-for="(row, index) in marqueeRows" :key="index" class="preview-card" :style="cardStyle">
                <span class="game-icon">{{ gameIcon(row.gameCode) }}</span>
                <span class="card-text" :style="{ color: form.colorUser || '#fff' }">恭喜
                  <b :style="{ color: form.colorAmount || '#FFD700' }">{{ row.accountMask || row.uid }}</b> 赢得
                  <b :style="{ color: form.colorAmount || '#FFD700' }">{{ row.amountText }}</b>
                </span>
              </div>
            </div>
            <el-empty v-if="!marqueeRows.length" description="暂无预览数据" />
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
import { computed, nextTick, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth';
import { fetchGameImageObjectUrl } from '@/utils/game-image';
import { listCarousel, addCarousel, updateCarousel, previewCarousel, offlineCarousel, onlineCarousel } from '@/api/game/display';

defineOptions({ name: 'GameCarousel' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const selection = ref<any[]>([]);
const previewRows = ref<any[]>([]);
const gameTreeRef = ref<any>(null);
/** 上传地址：走 /infra/game/upload/image（与彩金池共用一套本地上传实现） */
const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/infra/game/upload/image`;
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${getToken()}` }));
/** 背景图预览：带 token 拉取后转 objectURL（img 标签无法带 token，直连会 401） */
const backgroundPreview = ref('');
// FIX 2026-09-24：同彩金池页——form 在下方才声明，setup 阶段 watch 会触发 TDZ 报错导致页面空白，
// 因此改到 onMounted 注册。
onMounted(() => {
  watch(() => form.backgroundUrl, async (url) => {
    backgroundPreview.value = url ? await fetchGameImageObjectUrl(url) : '';
  }, { immediate: true });
});

/** 预览只滚动展示 3 张卡片（截图样式），不足 3 条时用虚拟数据补齐 */
const marqueeRows = computed(() => {
  const rows = previewRows.value.slice(0, 3);
  while (rows.length > 0 && rows.length < 3) {
    rows.push(rows[rows.length - 1]);
  }
  return rows;
});

/** 预览卡片样式：背景图优先，其次按展示样式给不同底色 */
const previewBoxStyle = computed(() => ({
  backgroundImage: backgroundPreview.value ? `url(${backgroundPreview.value})` : 'none',
  backgroundSize: '710px 137px',
  backgroundRepeat: 'no-repeat'
}));
const cardStyle = computed(() => ({
  background: form.styleCode === 'style2' ? 'rgba(0,0,0,0.35)'
    : form.styleCode === 'style3' ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.15)'
}));

/** 游戏图标位：无素材时用类型首字占位（截图是游戏 icon） */
function gameIcon(gameCode: string) {
  return (gameCode || 'G').slice(0, 1).toUpperCase();
}

function beforeUpload(file: any) {
  const okType = ['image/png', 'image/jpeg'].includes(file.type);
  const okSize = file.size / 1024 / 1024 <= 1;
  if (!okType) ElMessage.error('仅支持 png/jpg 格式');
  if (!okSize) ElMessage.error('图片不能超过 1MB（截图要求）');
  return okType && okSize;
}

function onUploadSuccess(res: any) {
  if (res?.code === 200) {
    form.backgroundUrl = res.data.url;
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(res?.msg || '上传失败');
  }
}

function onUploadError() {
  ElMessage.error('上传失败，请检查登录状态或接口是否可用');
}

function resolveUrl(url: string) {
  return url && url.startsWith('/infra') ? `${import.meta.env.VITE_APP_BASE_API}${url}` : url;
}

/** 「展示的游戏」树（类型维度与游戏域的展示类型字典一致） */
const gameTree = [
  { label: '热门游戏', value: 'HOT' },
  { label: '棋牌', value: 'CARD' }, { label: '捕鱼', value: 'FISH' }, { label: '电子', value: 'ESPORT_GAME' },
  { label: '真人', value: 'LIVE' }, { label: '体育', value: 'SPORT' }, { label: '斗鸡', value: 'COCK' },
  { label: '电竞', value: 'E_GAME' }, { label: '彩票', value: 'LOTTERY' }, { label: '区块链', value: 'BLOCKCHAIN' }
];

/** 树勾选 → gameScope（逗号分隔类型编码） */
function onGameScopeChange() {
  const checked = gameTreeRef.value?.getCheckedKeys() ?? [];
  form.gameScope = checked.join(',');
}
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
  await nextTick();
  gameTreeRef.value?.setCheckedKeys((row.gameScope || '').split(',').filter((v: string) => v));
  previewRows.value = ((await previewCarousel(row.id)) as unknown as any)?.data ?? [];
  dialog.title = '修改';
  dialog.visible = true;
}

async function openDetail(row: any) {
  Object.assign(form, row);
  await nextTick();
  gameTreeRef.value?.setCheckedKeys((row.gameScope || '').split(',').filter((v: string) => v));
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

/** 批量下架 / 批量上架（列表批量操作） */
async function batchOffline() {
  for (const row of selection.value) {
    await offlineCarousel(row.id);
  }
  ElMessage.success(`已下架 ${selection.value.length} 条`);
  getList();
}

async function batchOnline() {
  for (const row of selection.value) {
    await onlineCarousel(row.id);
  }
  ElMessage.success(`已上架 ${selection.value.length} 条`);
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
.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.style-item {
  margin-right: 0;
}
.thumb {
  display: inline-block;
  width: 92px;
  padding: 6px 0;
  text-align: center;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}
.thumb-1 { background: #d0021b; }
.thumb-2 { background: #f56c6c; }
.thumb-3 { background: #fa8c16; }
.thumb-4 { background: #722ed1; }
.thumb-5 { background: #237804; }
.thumb-6 { background: #0050b3; }
.thumb-7 { background: #c41d7f; }
.marquee {
  display: flex;
  gap: 10px;
  overflow: hidden;
  animation: marquee-scroll 12s linear infinite;
}
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-30%); }
}
.preview-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  min-width: 210px;
}
.game-icon {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 4px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
}
.card-text { font-size: 12px; color: #fff; }
.tip { color: #909399; font-size: 12px; margin-left: 8px; }
</style>
