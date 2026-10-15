<template>
  <div class="p-2 app-container game-jackpot-page">
    <!--
      彩金池管理（单页面 + 6 页签，2026-10-15 重定位）

      背景：本菜单此前只做「大厅展示配置」（jackpot_display_config）的 CRUD，
      与「彩金池管理」的名字不符——运营在这个页面看不到项目在跑的奖池本身。
      重定位后主体是真实奖池数据：
        奖池台账 slot_jackpot_pool（每 game_code + jackpot_type 一行：初始值/本轮累积/池值/必爆点/触发次数/累计注资）
        派奖流水 slot_jackpot_record（每次爆奖一行）
        注入逐笔 slot_jackpot_contribution（每局每层一行）
        参数变更 slot_jackpot_pool_audit（初始值改动的审计）
        资金日报 game_jackpot_daily（复用 /infra/report/rtp/jackpot-daily）
      而「大厅展示配置」退为最后一个页签（能力与接口零变化）。

      为什么用 v-if 懒挂载：6 个页签各有列表请求，全部同挂会一次打出 6 个接口；
      与游戏管理容器页（views/game/manage）保持同一模式。

      为什么奖池总览不提供「新增/删除奖池」：池由游戏侧按 slot 代码里的层级配置懒建
      （JackpotService.ensureLoaded → createLevelPool），后台插入的行若不在该游戏的层级配置里就是死行，
      而门槛/上限/份额/期望倍数都来自代码配置与 Redis。因此本页只开放「修改初始值」这一条已由
      Dubbo 契约（setJackpotInitialAmount）支撑的写路径，其余为只读台账。
    -->
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="奖池总览" name="pool" />
        <el-tab-pane label="派奖流水" name="record" />
        <el-tab-pane label="注入逐笔" name="contribution" />
        <el-tab-pane label="参数变更" name="audit" />
        <el-tab-pane label="资金日报" name="daily" />
        <el-tab-pane label="大厅展示配置" name="display" />
      </el-tabs>

      <PoolOverviewPanel v-if="tab === 'pool'" />
      <PoolRecordPanel v-else-if="tab === 'record'" />
      <PoolContributionPanel v-else-if="tab === 'contribution'" />
      <PoolAuditPanel v-else-if="tab === 'audit'" />
      <PoolDailyPanel v-else-if="tab === 'daily'" />
      <DisplayConfigPanel v-else-if="tab === 'display'" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PoolOverviewPanel from './components/PoolOverviewPanel.vue';
import PoolRecordPanel from './components/PoolRecordPanel.vue';
import PoolContributionPanel from './components/PoolContributionPanel.vue';
import PoolAuditPanel from './components/PoolAuditPanel.vue';
import PoolDailyPanel from './components/PoolDailyPanel.vue';
import DisplayConfigPanel from './components/DisplayConfigPanel.vue';

defineOptions({ name: 'GameJackpot' });

/** 默认停在「奖池总览」：进页面第一眼要看到项目在跑的各奖池，而不是展示配置 */
const tab = ref('pool');
</script>
