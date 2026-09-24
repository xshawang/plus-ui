<template>
  <div class="p-2 app-container member-register-config-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>注册与登录配置</h3>
            <p>注册开关、免注册/公共账号、验证方式、登录失败锁定与同 IP/设备注册限制。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:register:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="260px">
        <el-divider content-position="left">注册开关与账号形态</el-divider>
        <el-form-item v-for="control in switchControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">验证方式与限制</el-divider>
        <el-form-item label="注册验证方式">
          <el-select v-model="values.register_verify_type" style="width: 220px">
            <el-option label="不验证" value="NONE" />
            <el-option label="短信验证" value="SMS" />
            <el-option label="邮箱验证" value="EMAIL" />
          </el-select>
          <span class="ml-2 text-gray-400 text-sm">{{ descMap.register_verify_type }}</span>
        </el-form-item>
        <el-form-item v-for="control in numberControls" :key="control.key" :label="control.label">
          <el-input-number v-model="values[control.key] as number" :min="0" :max="100000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">展示样式与公告</el-divider>
        <el-form-item label="注册/登录页样式">
          <el-select v-model="values.show_style" style="width: 220px">
            <el-option label="经典" value="CLASSIC" />
            <el-option label="新版" value="MODERN" />
          </el-select>
          <span class="ml-2 text-gray-400 text-sm">{{ descMap.show_style }}</span>
        </el-form-item>
        <el-form-item label="登录页公告">
          <el-input v-model="values.login_notice" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap.login_notice }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberRegisterConfig" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listRegisterConfig, saveRegisterConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'register_enabled', label: '开放注册', type: 'switch' },
  { key: 'allow_guest_login', label: '允许免注册体验', type: 'switch' },
  { key: 'public_account_enabled', label: '允许公共账号登录', type: 'switch' },
  { key: 'invite_code_required', label: '注册必填邀请码', type: 'switch' },
  { key: 'allow_phone_multi_bind', label: '允许手机号重复绑定', type: 'switch' },
  { key: 'allow_email_multi_bind', label: '允许邮箱重复绑定', type: 'switch' },
  { key: 'register_verify_type', label: '注册验证方式', type: 'select' },
  { key: 'login_fail_lock_times', label: '连续失败锁定阈值(次)', type: 'number' },
  { key: 'login_fail_lock_minutes', label: '失败锁定时长(分钟)', type: 'number' },
  { key: 'register_ip_limit_per_day', label: '同 IP 每日注册上限', type: 'number' },
  { key: 'register_device_limit_per_day', label: '同设备每日注册上限', type: 'number' },
  { key: 'show_style', label: '注册/登录页样式', type: 'select' },
  { key: 'login_notice', label: '登录页公告', type: 'text' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listRegisterConfig, saveRegisterConfig, controls);

const switchControls = computed(() => controls.filter((c) => c.type === 'switch'));
const numberControls = computed(() => controls.filter((c) => c.type === 'number'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
