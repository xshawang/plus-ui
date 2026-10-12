<template>
  <div class="p-2 app-container member-security-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>安全中心配置</h3>
            <p>控制安全绑定、登录两步验证、找回密码链路、提现资产验证与信任设备免验策略。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:security:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>

      <el-form v-loading="loading" label-width="300px">
        <el-divider content-position="left">账号安全</el-divider>
        <el-form-item v-for="control in accountControls" :key="control.key" :label="control.label">
          <el-switch v-if="control.type === 'switch'" v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <el-select v-else-if="control.type === 'select'" v-model="values[control.key]" style="width: 260px">
            <el-option v-for="opt in control.options" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input-number
            v-else-if="control.type === 'number'"
            v-model="values[control.key] as number"
            :min="0"
            :max="1000000"
            controls-position="right"
            style="width: 200px"
          />
          <el-select v-else-if="control.type === 'multi'" v-model="values[control.key] as string[]" multiple style="width: 420px">
            <el-option v-for="opt in control.multiOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input v-else v-model="values[control.key] as string" style="width: 420px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberSecurity" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listSecurityConfig, saveSecurityConfig } from '@/api/member/config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const verifyMethods = [
  { label: '短信', value: 'SMS' },
  { label: '邮箱', value: 'EMAIL' },
  { label: 'Google 验证器', value: 'GOOGLE_AUTH' },
  { label: '面容/指纹', value: 'FACE' },
  { label: '登录密码', value: 'LOGIN_PWD' },
  { label: '提现密码', value: 'WITHDRAW_PWD' },
  { label: '密保问题', value: 'SECURITY_QUESTION' }
];

/** 控件清单：与后端 security_center_config 的配置键一一对应（见批次 1 SQL 脚本） */
const controls: ConfigControl[] = [
  {
    key: 'reg_security_bind_type',
    label: '注册时安全绑定',
    type: 'select',
    options: [
      { label: '不强制', value: 0 },
      { label: '强制绑定安全项', value: 1 }
    ]
  },
  {
    key: 'login_2fa_type',
    label: '会员登录两步验证',
    type: 'select',
    options: [
      { label: '关闭', value: 0 },
      { label: '自愿验证', value: 1 },
      { label: '强制验证', value: 2 }
    ]
  },
  {
    key: 'leader_bind_strategy',
    label: '盟主账号强制安全绑定',
    type: 'select',
    options: [
      { label: '无', value: 0 },
      { label: '三选一', value: 1 },
      { label: '多选', value: 2 }
    ]
  },
  { key: 'leader_bind_items', label: '盟主验证项明细（逗号分隔，如 GOOGLE_AUTH,SMS）', type: 'text' },
  {
    key: 'cpf_verify_type',
    label: '注册/绑定提现账号 CPF 验证',
    type: 'select',
    options: [
      { label: '不验证', value: 0 },
      { label: '规则校验（本地免费）', value: 1 },
      { label: '第三方验证（收费）', value: 2 }
    ]
  },
  { key: 'cpf_daily_limit', label: '每日第三方验证次数上限（0=不限）', type: 'number' },
  { key: 'op_verify_switch', label: '安全中心操作验证总控', type: 'switch' },
  {
    key: 'op_verify_frequency_type',
    label: '验证频率模式',
    type: 'select',
    options: [
      { label: '每次', value: 1 },
      { label: '验证后 N 天免验', value: 2 },
      { label: '注册后同设备首次免验 + N 天', value: 3 },
      { label: '信任设备首次免验 + N 天', value: 4 }
    ]
  },
  { key: 'op_verify_exempt_days', label: '免验证天数间隔', type: 'number' },
  { key: 'op_verify_allowed_methods', label: '允许的验证方式', type: 'multi', multiOptions: verifyMethods },
  { key: 'asset_member_untrust_protect', label: '资产会员非信任设备保护', type: 'switch' },
  { key: 'pwd_find_step1_methods', label: '找回密码-第一步验证方式', type: 'multi', multiOptions: verifyMethods },
  { key: 'pwd_find_step2_methods', label: '找回密码-再次验证方式', type: 'multi', multiOptions: verifyMethods },
  {
    key: 'first_withdraw_pwd_verify_type',
    label: '首次设置提现密码安全项',
    type: 'select',
    options: [
      { label: '无需验证', value: 0 },
      { label: '需验证登录密码（信任设备免验）', value: 1 }
    ]
  },
  { key: 'withdraw_apply_2fa_switch', label: '申请提现两步验证', type: 'switch' },
  { key: 'bind_crypto_2fa_switch', label: '添加虚拟币地址两步验证', type: 'switch' },
  { key: 'bind_fiat_account_2fa_switch', label: '添加法币账号两步验证', type: 'switch' },
  { key: 'large_amount_2fa_methods', label: '大额提现两步验证项', type: 'multi', multiOptions: verifyMethods },
  { key: 'trust_cond_register_device', label: '信任设备条件-注册设备', type: 'switch' },
  { key: 'trust_cond_deposit_device', label: '信任设备条件-成功充值设备', type: 'switch' },
  { key: 'trust_device_pwd_exempt_items', label: '信任设备免登录密码可修改项', type: 'multi', multiOptions: verifyMethods },
  { key: 'biometric_login_switch', label: '生物识别（面容/指纹）开关', type: 'switch' },
  { key: 'gesture_lock_switch', label: '手势解锁开关', type: 'switch' },
  { key: 'guide_biometric_popup', label: '注册后引导开启生物识别', type: 'switch' },
  { key: 'prefer_biometric_login', label: '登录优先使用生物识别/手势', type: 'switch' }
];

const assetKeys = ['withdraw_apply_2fa_switch', 'bind_crypto_2fa_switch', 'bind_fiat_account_2fa_switch', 'large_amount_2fa_methods'];
const deviceKeys = [
  'trust_cond_register_device',
  'trust_cond_deposit_device',
  'trust_device_pwd_exempt_items',
  'biometric_login_switch',
  'gesture_lock_switch',
  'guide_biometric_popup',
  'prefer_biometric_login'
];
const pwdKeys = ['pwd_find_step1_methods', 'pwd_find_step2_methods', 'first_withdraw_pwd_verify_type'];

/** 账号安全 = 全部 - 资产安全 - 设备安全 - 找回密码 */
const accountControls = computed(() =>
  controls.filter((item) => !assetKeys.includes(item.key) && !deviceKeys.includes(item.key) && !pwdKeys.includes(item.key))
);

const { loading, saving, values, descMap, load, save } = useKvConfig(listSecurityConfig, saveSecurityConfig, controls);

const handleSave = async () => {
  const res = await save();
  modal.msgSuccess(`保存成功（更新 ${res?.data ?? 0} 项）`);
  await load();
};

load();
</script>
