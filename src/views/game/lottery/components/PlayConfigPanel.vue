<template>
  <div v-loading="loading">
    <el-tabs v-model="activePlay" @tab-change="renderPlay">
      <el-tab-pane v-for="play in playList" :key="play.code" :name="play.code" :label="play.name" />
    </el-tabs>

    <template v-for="group in visibleGroups" :key="group.key">
      <!-- 三层开关：玩法级 / 子段级 / 单项限额开关 + 单项最高（截图每个玩法固定三层） -->
      <div class="switch-row level-1">
        <span class="label">{{ group.playName }}</span>
        <el-switch v-model="group.playStatus" :active-value="1" :inactive-value="0"
                   @change="v => markSwitch(group, 'playStatus', v)" />
      </div>
      <div v-if="group.subCode !== ''" class="switch-row level-2">
        <span class="label">{{ group.subName }}</span>
        <el-switch v-model="group.subStatus" :active-value="1" :inactive-value="0"
                   @change="v => markSwitch(group, 'subStatus', v)" />
      </div>
      <div class="switch-row level-3">
        <span class="label">{{ group.subCode === '' ? group.playName : group.subName }}</span>
        <el-switch v-model="group.limitSwitch" :active-value="1" :inactive-value="0"
                   @change="v => markSwitch(group, 'limitSwitch', v)" />
        <span class="single-max">{{ group.subCode === '' ? group.playName : group.subName }}单项最高</span>
        <el-input-number v-model="group.singleMax" :min="0" :precision="0" controls-position="right"
                         size="small" style="width: 140px" @change="markSwitch(group, 'singleMax', null)" />
        <el-tooltip content="单项最高：该玩法单个号码项允许的最大投注额" placement="top"><el-icon><QuestionFilled /></el-icon></el-tooltip>
      </div>

      <!-- 号码项网格：号码 / 赔率 / 投注上限 / 投注下限（截图每行 5 列号码） -->
      <div class="item-grid">
        <div class="grid-head">
          <span>号码</span><span>赔率</span><span>投注上限</span><span>投注下限</span>
        </div>
        <div v-for="item in group.items" :key="group.key + '-' + item.itemCode" class="grid-cell">
          <div class="grid-head">
            <span>号码</span><span>赔率</span><span>投注上限</span><span>投注下限</span>
          </div>
          <div class="grid-row">
            <span class="num" :class="{ modified: item.oddsModified === 1, over: item.oddsOverRtp === 1 }">{{ item.itemName }}</span>
            <el-input-number v-model="item.odds" :min="0.001" :precision="3" size="small"
                             controls-position="right" style="width: 100%" />
            <el-input-number v-model="item.betMax" :min="0" :precision="2" size="small"
                             controls-position="right" style="width: 100%" />
            <el-input-number v-model="item.betMin" :min="0" :precision="2" size="small"
                             controls-position="right" style="width: 100%" />
          </div>
        </div>
      </div>
    </template>

    <div class="footer">
      <span class="tier-note-label">档位备注：</span>
      <el-input v-model="tierNote" placeholder="请输入该档位备注（保存后随档位展示）" style="max-width: 520px" />
      <el-button link type="primary" class="ml" @click="saveTierNote">保存档位备注</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存玩法配置</el-button>
      <el-button icon="Sort" @click="sortDialog.visible = true">排序设置</el-button>
    </div>

    <!-- 排序设置（截图「排序设置」按钮） -->
    <el-dialog v-model="sortDialog.visible" title="排序设置" width="620px" append-to-body>
      <p class="tip">按「玩法 → 号码项」维护展示顺序，仅影响后台与客户端展示，不影响结算。</p>
      <el-table :data="flatItems" height="360">
        <el-table-column label="玩法" align="center" prop="playName" width="110" />
        <el-table-column label="号码" align="center" prop="itemName" width="110" />
        <el-table-column label="排序" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" controls-position="right" style="width: 110px" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="saveSort">保存排序</el-button>
        <el-button @click="sortDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import { lotteryPlayItems, saveLotteryPlay, saveLotteryPlaySort, saveTierNote as saveTierNoteApi } from '@/api/game/lottery';

/**
 * 玩法配置页签（截图「玩法配置」，17 个玩法页签）。
 *
 * 背景：截图每个玩法固定三层开关（玩法级 / 子段级 / 单项限额开关 + 「XXX单项最高」），
 * 并按子段（半波/特半半波/特色波、正1特~正6特、二~五连肖、旧/新三中二等）分段展示号码项网格；
 * 页面底部还有「档位备注」与「排序设置」。
 * 协作关系：/infra/game/lottery/play/* 接口；保存为差量提交（服务端只写变化行并落审计日志）。
 */
const props = defineProps<{ lotteryCode: string; currency: string; tierNo: number; tierNote: string }>();
const emit = defineEmits<{ (e: 'refresh'): void }>();

const loading = ref(false);
const saving = ref(false);
const activePlay = ref('TE_MA');
const tierNote = ref('');
const sortDialog = reactive({ visible: false });
const rawItems = ref<any[]>([]);

/** 17 个玩法页签（顺序与截图一致） */
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

/** 按「玩法 + 子段」分组，取组内首行作为开关与单项最高的承载值 */
const groups = computed(() => {
  const map = new Map<string, any>();
  for (const item of rawItems.value) {
    const key = `${item.playCode}::${item.subCode}`;
    if (!map.has(key)) {
      map.set(key, {
        key, playCode: item.playCode, playName: item.playName, subCode: item.subCode, subName: item.subName,
        playStatus: item.playStatus, subStatus: item.subStatus, limitSwitch: item.limitSwitch,
        singleMax: item.singleMax, items: []
      });
    }
    map.get(key)?.items.push(item);
  }
  return Array.from(map.values());
});

const visibleGroups = computed(() => groups.value.filter((g) => g.playCode === activePlay.value));
const flatItems = computed(() => visibleGroups.value.flatMap((g) => g.items));

function renderPlay() {
  // 玩法切换仅切换渲染分组，数据一次性取回（避免每次切页签都发请求）
  activePlay.value = activePlay.value || 'TE_MA';
}

async function load() {
  loading.value = true;
  try {
    const data: any = ((await lotteryPlayItems({
      lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo
    })) as unknown as any)?.data;
    rawItems.value = data ?? [];
    tierNote.value = props.tierNote || '';
  } finally {
    loading.value = false;
  }
}

function markSwitch(group: any, field: string, _value: any) {
  // 开关值直接反映在分组上，保存时随 playConfigs 提交（无需单独接口）
  group[field] = group[field];
}

async function save() {
  saving.value = true;
  try {
    const items = flatItems.value.map((r) => ({
      playCode: r.playCode, subCode: r.subCode, itemCode: r.itemCode, itemName: r.itemName,
      odds: r.odds, betMax: r.betMax, betMin: r.betMin, sortOrder: r.sortOrder
    }));
    const playConfigs = groups.value.map((g) => ({
      playCode: g.playCode, playName: g.playName, subCode: g.subCode, subName: g.subName,
      playStatus: g.playStatus, subStatus: g.subStatus, limitSwitch: g.limitSwitch, singleMax: g.singleMax
    }));
    const changed: any = ((await saveLotteryPlay({
      lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo, items, playConfigs
    })) as unknown as any)?.data;
    ElMessage.success(`保存成功，共更新 ${changed} 项（赔率改动对新彩期生效）`);
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

async function saveTierNote() {
  await saveTierNoteApi({ lotteryCode: props.lotteryCode, currency: props.currency, tierNo: props.tierNo, note: tierNote.value });
  ElMessage.success('档位备注已保存');
}

async function saveSort() {
  await saveLotteryPlaySort(flatItems.value.map((r) => ({ id: r.itemId, sortOrder: r.sortOrder })));
  ElMessage.success('排序已保存');
  sortDialog.visible = false;
}

watch(() => [props.lotteryCode, props.currency, props.tierNo], () => load(), { immediate: true });
watch(() => props.tierNote, (v) => (tierNote.value = v || ''));
</script>

<style scoped>
.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fdf2f2;
  padding: 8px 12px;
  border-bottom: 1px solid #f5e6e6;
}
.level-1 { padding-left: 12px; }
.level-2 { padding-left: 48px; }
.level-3 { padding-left: 80px; }
.label { min-width: 90px; color: #606266; }
.single-max { margin-left: 24px; color: #606266; }
.item-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  padding: 8px;
}
.grid-head {
  display: grid;
  grid-template-columns: 70px 1fr 1fr 1fr;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}
.grid-cell .grid-head { display: none; }
.grid-row {
  display: grid;
  grid-template-columns: 70px 1fr 1fr 1fr;
  gap: 4px;
  align-items: center;
  margin-bottom: 4px;
}
.num {
  display: inline-block;
  text-align: center;
  background: #f56c6c;
  color: #fff;
  border-radius: 3px;
  padding: 2px 0;
  font-size: 12px;
}
.num.modified { background: #ff4d4f; box-shadow: 0 0 0 2px #ffd8d8 inset; }
.num.over { background: #fa8c16; }
.footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid #ebeef5;
}
.tier-note-label { color: #606266; }
.ml { margin-left: 6px; }
.tip { color: #909399; font-size: 12px; }
</style>
