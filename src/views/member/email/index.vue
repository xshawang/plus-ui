<template>
  <div class="p-2 app-container member-email-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>邮箱验证配置</h3>
            <p>SMTP 账号池参数、验证码策略与邮件召回配置；密码仅保存密文，页面不回国明文。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:email:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="260px">
        <el-divider content-position="left">开关与验证码</el-divider>
        <el-form-item v-for="control in switchControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-form-item v-for="control in numberControls" :key="control.key" :label="control.label">
          <el-input-number v-model="values[control.key] as number" :min="0" :max="100000000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">SMTP 与发件人</el-divider>
        <el-form-item v-for="control in textControls" :key="control.key" :label="control.label">
          <el-input v-model="values[control.key]" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberEmail" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listEmailConfig, saveEmailConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'email_enabled', label: '邮箱验证总开关', type: 'switch' },
  { key: 'smtp_ssl', label: 'SMTP 使用 SSL', type: 'switch' },
  { key: 'recall_enabled', label: '邮箱召回开关', type: 'switch' },
  { key: 'smtp_port', label: 'SMTP 端口', type: 'number' },
  { key: 'code_expire_seconds', label: '验证码有效期(秒)', type: 'number' },
  { key: 'daily_limit_per_email', label: '同邮箱每日上限(封)', type: 'number' },
  { key: 'recall_inactive_days', label: '召回人群:未登录天数', type: 'number' },
  { key: 'smtp_host', label: 'SMTP 服务器', type: 'text' },
  { key: 'smtp_username', label: 'SMTP 账号', type: 'text' },
  { key: 'smtp_password', label: 'SMTP 密码', type: 'text' },
  { key: 'from_address', label: '发件人邮箱', type: 'text' },
  { key: 'from_name', label: '发件人名称', type: 'text' },
  { key: 'recall_subject', label: '召回邮件主题', type: 'text' },
  { key: 'recall_content', label: '召回邮件正文', type: 'text' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listEmailConfig, saveEmailConfig, controls);

const switchControls = computed(() => controls.filter((c) => c.type === 'switch'));
const numberControls = computed(() => controls.filter((c) => c.type === 'number'));
const textControls = computed(() => controls.filter((c) => c.type === 'text'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
