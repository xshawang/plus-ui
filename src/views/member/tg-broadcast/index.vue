<template>
  <div class="p-2 app-container member-tg-broadcast-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>TG 消息群发配置</h3>
            <p>群发开关、默认目标群/频道、发送频率与每日上限；实际发送任务需独立 TG 服务执行。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:broadcast:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="240px">
        <el-divider content-position="left">开关与限流</el-divider>
        <el-form-item v-for="control in switchControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-form-item v-for="control in numberControls" :key="control.key" :label="control.label">
          <el-input-number v-model="values[control.key] as number" :min="0" :max="1000000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">默认目标与文案</el-divider>
        <el-form-item v-for="control in textControls" :key="control.key" :label="control.label">
          <el-input v-model="values[control.key]" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberTgBroadcast" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listTgBroadcastConfig, saveTgBroadcastConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'broadcast_enabled', label: '群发功能总开关', type: 'switch' },
  { key: 'allow_image', label: '允许带图发送', type: 'switch' },
  { key: 'send_interval_seconds', label: '同群发送间隔(秒)', type: 'number' },
  { key: 'daily_limit_per_target', label: '单群每日上限(条)', type: 'number' },
  { key: 'daily_limit_global', label: '全站每日上限(条)', type: 'number' },
  { key: 'retry_times', label: '失败重试次数', type: 'number' },
  { key: 'default_targets', label: '默认群组/频道', type: 'text' },
  { key: 'audience_type', label: '默认人群(ALL/BOUND/UNBOUND)', type: 'text' },
  { key: 'quiet_hours', label: '免打扰时段', type: 'text' },
  { key: 'default_content', label: '默认群发文案', type: 'text' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listTgBroadcastConfig, saveTgBroadcastConfig, controls);

const switchControls = computed(() => controls.filter((c) => c.type === 'switch'));
const numberControls = computed(() => controls.filter((c) => c.type === 'number'));
const textControls = computed(() => controls.filter((c) => c.type === 'text'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
