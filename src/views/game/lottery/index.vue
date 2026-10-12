<template>
  <div class="p-2 app-container game-lottery-page">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="彩种参数" name="game" />
        <el-tab-pane label="玩法配置" name="play" />
        <el-tab-pane label="历史修改记录" name="history" />
        <el-tab-pane label="操盘管理" name="operate" />
        <el-tab-pane label="自动降赔设置" name="autoReduce" />
      </el-tabs>

      <el-form :inline="true" class="header-form">
        <el-form-item label="彩种">
          <el-select v-model="query.lotteryCode" style="width: 200px" @change="onHeaderChange">
            <el-option v-for="item in header.lotteryGames" :key="item.lotteryCode"
                       :label="`${item.lotteryName}(${item.lotteryCode})`" :value="String(item.lotteryCode)" />
          </el-select>
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="query.currency" style="width: 190px" @change="onHeaderChange">
            <el-option label="越南(VND1000:1)" value="VND1000:1" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab === 'play'" label="档位">
          <el-radio-group v-model="query.tierNo" @change="onTierChange">
            <el-radio-button v-for="t in header.tiers" :key="t.tierNo" :value="t.tierNo">{{ t.tierName }}</el-radio-button>
          </el-radio-group>
          <el-button class="ml" icon="Sort" @click="tierNoteDialog.visible = true">排序设置</el-button>
        </el-form-item>
        <el-form-item v-if="tab === 'game'">
          <span class="tip">彩种参数未在截图中展开，本页按玩法配置所依赖的最小主数据展示</span>
        </el-form-item>
      </el-form>

      <LotteryParamsPanel v-if="tab === 'game'" :lottery-code="query.lotteryCode" :currency="query.currency" />
      <PlayConfigPanel v-else-if="tab === 'play'" :lottery-code="query.lotteryCode" :currency="query.currency"
                       :tier-no="query.tierNo" :tier-note="header.tierNote" @refresh="loadHeader" />
      <HistoryPanel v-else-if="tab === 'history'" :lottery-code="query.lotteryCode" :currency="query.currency" />
      <OperatePanel v-else-if="tab === 'operate'" :lottery-code="query.lotteryCode" :currency="query.currency"
                    :tier-no="query.tierNo" :issues="header.issues" @refresh="loadHeader" />
      <AutoReducePanel v-else :lottery-code="query.lotteryCode" :currency="query.currency" :issues="header.issues" />
    </el-card>

    <!-- 排序设置入口（玩法配置页头按钮；实际排序在玩法配置面板内维护，这里给出档位级说明） -->
    <el-dialog v-model="tierNoteDialog.visible" title="排序设置 / 档位备注" width="560px" append-to-body>
      <p class="tip">玩法与号码项的排序在「玩法配置」各玩法区域内维护（每个玩法区块底部「排序设置」）。</p>
      <el-form label-width="110px">
        <el-form-item label="当前档位">
          <el-input :model-value="currentTierName" disabled />
        </el-form-item>
        <el-form-item label="档位备注">
          <el-input v-model="tierNoteDialog.note" type="textarea" :rows="3" placeholder="请输入该档位备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveTierNote">保 存</el-button>
        <el-button @click="tierNoteDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { lotteryHeader, saveTierNote as saveTierNoteApi } from '@/api/game/lottery';
import LotteryParamsPanel from './components/LotteryParamsPanel.vue';
import PlayConfigPanel from './components/PlayConfigPanel.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import OperatePanel from './components/OperatePanel.vue';
import AutoReducePanel from './components/AutoReducePanel.vue';

/**
 * WG 彩票管理（游戏 → WG彩票管理，5 个页签）。
 *
 * 背景：截图 5 个页签（彩种参数 / 玩法配置 / 历史修改记录 / 操盘管理 / 自动降赔设置）
 * 共用「彩种 + 币种 + 档位/期号」维度，页头与状态由本壳组件统一维护，
 * 各页签实现拆到 components/ 下，保证单文件职责单一、行数可控。
 * 协作关系：/infra/game/lottery/* 接口；子面板通过 props 接收维度、通过 @refresh 回流刷新页头。
 */
defineOptions({ name: 'GameLottery' });

const tab = ref('play');
const header = reactive<any>({ lotteryGames: [], tiers: [], issues: [], tierNote: '', defaultTier: 2 });
const query = reactive<any>({ lotteryCode: '133001', currency: 'VND1000:1', tierNo: 2 });
const tierNoteDialog = reactive({ visible: false, note: '' });

const currentTierName = computed(() => {
  const tier = (header.tiers || []).find((t: any) => t.tierNo === query.tierNo);
  return tier?.tierName ?? `档位${query.tierNo}`;
});

async function loadHeader() {
  const data: any = ((await lotteryHeader(query.currency)) as unknown as any)?.data ?? {};
  Object.assign(header, data);
  if (!query.tierNo && data.defaultTier) {
    query.tierNo = data.defaultTier;
  }
  if (!query.lotteryCode && data.lotteryGames?.length) {
    query.lotteryCode = String(data.lotteryGames[0].lotteryCode);
  }
}

function onHeaderChange() {
  loadHeader();
}

function onTierChange() {
  loadHeader();
}

async function saveTierNote() {
  await saveTierNoteApi({ lotteryCode: query.lotteryCode, currency: query.currency, tierNo: query.tierNo, note: tierNoteDialog.note });
  ElMessage.success('档位备注已保存');
  tierNoteDialog.visible = false;
  loadHeader();
}

onMounted(async () => {
  await loadHeader();
  tierNoteDialog.note = header.tierNote || '';
});
</script>

<style scoped>
.header-form {
  margin-bottom: 6px;
}
.ml {
  margin-left: 8px;
}
.tip {
  color: #909399;
  font-size: 12px;
}
</style>
