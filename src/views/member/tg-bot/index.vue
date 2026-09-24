<template>
  <div class="p-2 app-container member-tg-bot-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>TG 机器人配置</h3>
            <p>机器人账号、绑定方式、欢迎语与客服转接配置；消息收发需独立 TG 服务，本页仅维护参数。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:robot:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="240px">
        <el-divider content-position="left">机器人开关</el-divider>
        <el-form-item v-for="control in switchControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">账号与绑定</el-divider>
        <el-form-item v-for="control in numberControls" :key="control.key" :label="control.label">
          <el-input-number v-model="values[control.key] as number" :min="0" :max="100000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-form-item v-for="control in textControls" :key="control.key" :label="control.label">
          <el-input v-model="values[control.key]" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberTgBot" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listTgBotConfig, saveTgBotConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'bot_enabled', label: 'TG 机器人总开关', type: 'switch' },
  { key: 'welcome_enabled', label: '开启欢迎语', type: 'switch' },
  { key: 'cs_enabled', label: '开启客服转接', type: 'switch' },
  { key: 'group_notify_enabled', label: '开启群组通知', type: 'switch' },
  { key: 'bind_code_expire_minutes', label: '绑定码有效期(分钟)', type: 'number' },
  { key: 'bot_username', label: '机器人用户名', type: 'text' },
  { key: 'bot_token', label: 'Bot Token', type: 'text' },
  { key: 'welcome_text', label: '欢迎语文案', type: 'text' },
  { key: 'bind_option_type', label: '绑定方式', type: 'text' },
  { key: 'cs_accounts', label: '客服账号', type: 'text' },
  { key: 'cs_work_time', label: '客服工作时间', type: 'text' },
  { key: 'default_language', label: '默认语言', type: 'text' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listTgBotConfig, saveTgBotConfig, controls);

const switchControls = computed(() => controls.filter((c) => c.type === 'switch'));
const numberControls = computed(() => controls.filter((c) => c.type === 'number'));
const textControls = computed(() => controls.filter((c) => c.type === 'text'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
