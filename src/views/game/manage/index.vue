<template>
  <div class="p-2 app-container game-manage-page">
    <!--
      游戏管理（单页面 + 8 页签）

      背景：原站「游戏管理」是一个页面，页面内用页签切换 8 个区块
      （平台管理 / 子游戏管理 / 热门模板一(生效中) / 热门模板二 / 特色模板一 / 特色模板二 / 类型管理 / 游戏全网排名）。
      历史实现把每个区块做成了独立菜单，并把 4 个模板页签合并进单个「模板管理」页，
      导致菜单树与截图不一致（2026-10-11 用户核对指出）。本页按截图把 8 个区块收敛为一个页面的页签，
      各区块仍复用原有页面组件与接口（零重复实现）。

      为什么用 v-if 懒挂载：8 个区块各自有列表请求，全部同时挂载会一次打出十余个接口；
      按页签懒加载与 WG彩票管理页（拆 components/）保持同一模式。
    -->
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="平台管理" name="platform" />
        <el-tab-pane label="子游戏管理" name="subgame" />
        <!-- 模板页签名称与「(生效中)」标记来自模板主数据，设为生效后标签随之变化 -->
        <el-tab-pane v-for="tpl in templates" :key="tpl.templateCode" :name="tpl.templateCode"
                     :label="tpl.templateName + (tpl.templateStatus === 1 ? '(生效中)' : '')" />
        <el-tab-pane label="类型管理" name="gametype" />
        <el-tab-pane label="游戏全网排名" name="rank" />
      </el-tabs>

      <PlatformPanel v-if="tab === 'platform'" />
      <SubGamePanel v-else-if="tab === 'subgame'" />
      <TemplatePanel v-else-if="isTemplateTab" :template-code="tab" embedded @active-changed="loadTemplates" />
      <GameTypePanel v-else-if="tab === 'gametype'" />
      <RankPanel v-else-if="tab === 'rank'" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { listTemplate } from '@/api/game/manage';
import PlatformPanel from '../platform/index.vue';
import SubGamePanel from '../subgame/index.vue';
import TemplatePanel from '../template/index.vue';
import GameTypePanel from '../gametype/index.vue';
import RankPanel from '../rank/index.vue';

defineOptions({ name: 'GameManage' });

/** 与平台/类型页一致：本地按越南币种（VND1000:1）配置 */
const CURRENCY = 'VND1000:1';

const tab = ref('platform');
const templates = ref<any[]>([]);
const templateCodes = computed(() => templates.value.map((t) => t.templateCode));
const isTemplateTab = computed(() => templateCodes.value.includes(tab.value));

/** 模板主数据（4 个模板页签的标题与生效标记） */
async function loadTemplates() {
  try {
    templates.value = ((await listTemplate(CURRENCY)) as unknown as any)?.data ?? [];
  } catch (e) {
    templates.value = [];
    ElMessage.warning('模板列表加载失败，模板页签暂不可用');
  }
}

onMounted(loadTemplates);
</script>

<style scoped>
.game-manage-page .tab-body {
  margin-top: 4px;
}
</style>
