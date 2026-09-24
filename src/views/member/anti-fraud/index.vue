<template>
  <div class="p-2 app-container member-anti-fraud-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>防刷风控配置</h3>
            <p>控制注册/登录人机校验、首充前后的绑定与验证拦截、设备指纹注册限制。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:anti-fraud:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>

      <el-form v-loading="loading" label-width="260px">
        <el-divider content-position="left">账户与资金流转拦截</el-divider>
        <el-form-item v-for="control in accountControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>

        <el-divider content-position="left">注册风控配置（环境与设备指纹）</el-divider>
        <el-form-item v-for="control in envControls" :key="control.key" :label="control.label">
          <el-select v-if="control.type === 'select'" v-model="values[control.key]" style="width: 220px">
            <el-option v-for="opt in control.options" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input-number
            v-else
            v-model="values[control.key] as number"
            :min="0"
            :max="1000000"
            controls-position="right"
            style="width: 220px"
          />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberAntiFraud" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listAntiFraudConfig, saveAntiFraudConfig } from '@/api/member/config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

/** 控件清单：与后端 anti_fraud_config 的配置键一一对应（见批次 1 SQL 脚本） */
const controls: ConfigControl[] = [
  { key: 'sms_verify_after_first_deposit', label: '首次充值后进入游戏时再次短信验证', type: 'switch' },
  { key: 'bind_withdraw_before_first_deposit', label: '首次充值前强制绑定提现账号', type: 'switch' },
  { key: 'bind_withdraw_after_first_deposit', label: '首次充值后进入游戏时强制绑定提现账号', type: 'switch' },
  { key: 'bind_withdraw_before_first_game', label: '首次进入游戏时强制绑定提现账号', type: 'switch' },
  { key: 'forbid_member_change_phone', label: '禁止会员自主修改手机号码', type: 'switch' },
  { key: 'forbid_member_change_email', label: '禁止会员自主修改邮箱', type: 'switch' },
  { key: 'allow_phone_multi_bind', label: '是否允许手机重复绑定', type: 'switch' },
  { key: 'allow_email_multi_bind', label: '是否允许邮箱重复绑定', type: 'switch' },
  {
    key: 'register_verify_web',
    label: '注册行为验证（Web）',
    type: 'select',
    options: [
      { label: '不限制', value: 'NONE' },
      { label: '图形验证码', value: 'CAPTCHA' },
      { label: '滑块拼图', value: 'SLIDER' },
      { label: 'Google reCAPTCHA', value: 'RECAPTCHA' }
    ]
  },
  {
    key: 'register_verify_app',
    label: '注册行为验证（APP）',
    type: 'select',
    options: [
      { label: '不限制', value: 'NONE' },
      { label: '图形验证码', value: 'CAPTCHA' },
      { label: '滑块拼图', value: 'SLIDER' },
      { label: 'Google reCAPTCHA', value: 'RECAPTCHA' }
    ]
  },
  {
    key: 'login_verify_web',
    label: '登录行为验证（Web）',
    type: 'select',
    options: [
      { label: '不限制', value: 'NONE' },
      { label: '图形验证码', value: 'CAPTCHA' },
      { label: '滑块拼图', value: 'SLIDER' },
      { label: 'Google reCAPTCHA', value: 'RECAPTCHA' }
    ]
  },
  {
    key: 'login_verify_app',
    label: '登录行为验证（APP）',
    type: 'select',
    options: [
      { label: '不限制', value: 'NONE' },
      { label: '图形验证码', value: 'CAPTCHA' },
      { label: '滑块拼图', value: 'SLIDER' },
      { label: 'Google reCAPTCHA', value: 'RECAPTCHA' }
    ]
  },
  { key: 'device_register_limit_rule', label: '设备指纹注册上限（0=不限制）', type: 'number' }
];

const accountKeys = [
  'sms_verify_after_first_deposit',
  'bind_withdraw_before_first_deposit',
  'bind_withdraw_after_first_deposit',
  'bind_withdraw_before_first_game',
  'forbid_member_change_phone',
  'forbid_member_change_email',
  'allow_phone_multi_bind',
  'allow_email_multi_bind'
];

const accountControls = computed(() => controls.filter((item) => accountKeys.includes(item.key)));
const envControls = computed(() => controls.filter((item) => !accountKeys.includes(item.key)));

const { loading, saving, values, descMap, load, save } = useKvConfig(listAntiFraudConfig, saveAntiFraudConfig, controls);

const handleSave = async () => {
  const res = await save();
  modal.msgSuccess(`保存成功（更新 ${res?.data ?? 0} 项）`);
  await load();
};

load();
</script>
