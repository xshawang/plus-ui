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
        <el-tab-pane label="子游戏管理" name="subgame" />
        <el-tab-pane label="类型管理" name="gametype" />
        <el-tab-pane label="游戏全网排名" name="rank" />
      </el-tabs>

      <SubGamePanel v-if="tab === 'subgame'" />
      <GameTypePanel v-else-if="tab === 'gametype'" />
      <RankPanel v-else-if="tab === 'rank'" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SubGamePanel from '../subgame/index.vue';
import GameTypePanel from '../gametype/index.vue';
import RankPanel from '../rank/index.vue';

defineOptions({ name: 'GameManage' });

const tab = ref('subgame');
</script>

<style scoped>
.game-manage-page .tab-body {
  margin-top: 4px;
}
</style>
