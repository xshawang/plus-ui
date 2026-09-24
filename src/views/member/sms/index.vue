<template>
  <div class="p-2 app-container member-sms-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>短信配置</h3>
            <p>通道开关、验证码策略与短信召回配置；保存后由 player / go88-job 侧读取生效。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:sms:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="260px">
        <el-divider content-position="left">通道与验证码</el-divider>
        <el-form-item v-for="control in switchControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-form-item v-for="control in numberControls" :key="control.key" :label="control.label">
          <el-input-number v-model="values[control.key] as number" :min="0" :max="100000000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">通道参数与召回文案</el-divider>
        <el-form-item v-for="control in textControls" :key="control.key" :label="control.label">
          <el-input v-model="values[control.key]" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberSms" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listSmsConfig, saveSmsConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'sms_enabled', label: '短信通道总开关', type: 'switch' },
  { key: 'recall_enabled', label: '短信召回开关', type: 'switch' },
  { key: 'code_length', label: '验证码位数', type: 'number' },
  { key: 'code_expire_seconds', label: '验证码有效期(秒)', type: 'number' },
  { key: 'send_interval_seconds', label: '同号码发送间隔(秒)', type: 'number' },
  { key: 'daily_limit_per_phone', label: '同号码每日上限(条)', type: 'number' },
  { key: 'daily_limit_global', label: '全站每日上限(条)', type: 'number' },
  { key: 'recall_inactive_days', label: '召回人群:未登录天数', type: 'number' },
  { key: 'default_channel', label: '默认通道', type: 'text' },
  { key: 'signature', label: '短信签名', type: 'text' },
  { key: 'recall_content', label: '召回文案', type: 'text' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listSmsConfig, saveSmsConfig, controls);

const switchControls = computed(() => controls.filter((c) => c.type === 'switch'));
const numberControls = computed(() => controls.filter((c) => c.type === 'number'));
const textControls = computed(() => controls.filter((c) => c.type === 'text'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
