<template>
  <div class="p-2 app-container member-info-config-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>会员基本信息设置</h3>
            <p>控制采集哪些会员资料、哪些必填，以及会员自主修改与每日修改次数上限。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:info-config:edit']" type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="260px">
        <el-divider content-position="left">采集项</el-divider>
        <el-form-item v-for="control in collectControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-divider content-position="left">必填约束与修改限制</el-divider>
        <el-form-item v-for="control in requiredControls" :key="control.key" :label="control.label">
          <el-switch v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
        </el-form-item>
        <el-form-item label="每日修改上限(次)">
          <el-input-number v-model="values.profile_edit_limit_per_day as number" :min="0" :max="1000" controls-position="right" style="width: 220px" />
          <span class="ml-2 text-gray-400 text-sm">{{ descMap.profile_edit_limit_per_day }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="MemberInfoConfig" lang="ts">
import { computed } from 'vue';
import modal from '@/plugins/modal';
import { listInfoConfig, saveInfoConfig } from '@/api/member/module-config';
import { useKvConfig, type ConfigControl } from '../components/useKvConfig';

const controls: ConfigControl[] = [
  { key: 'collect_real_name', label: '采集真实姓名', type: 'switch' },
  { key: 'collect_birthday', label: '采集生日(生日礼金依据)', type: 'switch' },
  { key: 'collect_gender', label: '采集性别', type: 'switch' },
  { key: 'collect_email', label: '采集邮箱', type: 'switch' },
  { key: 'collect_phone', label: '采集手机号', type: 'switch' },
  { key: 'collect_address', label: '采集居住地址', type: 'switch' },
  { key: 'collect_id_card', label: '采集证件号(KYC)', type: 'switch' },
  { key: 'birthday_required', label: '生日必填', type: 'switch' },
  { key: 'email_required', label: '邮箱必填', type: 'switch' },
  { key: 'phone_required', label: '手机号必填', type: 'switch' },
  { key: 'allow_member_edit_profile', label: '允许会员自主修改资料', type: 'switch' },
  { key: 'profile_edit_limit_per_day', label: '每日修改上限(次)', type: 'number' }
];

const { loading, saving, values, descMap, load, save } = useKvConfig(listInfoConfig, saveInfoConfig, controls);

const collectControls = computed(() => controls.filter((c) => c.key.startsWith('collect_')));
const requiredControls = computed(() => controls.filter((c) => c.key.endsWith('_required') || c.key === 'allow_member_edit_profile'));

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
};

load();
</script>
