<template>
  <div class="p-2 app-container promotion-vip-setting-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP 奖励公共设置</h3>
            <p>决定 VIP 奖励的发放周期、保级与稽核口径；等级门槛与奖励金额矩阵在「会员管理 → VIP奖励配置」维护。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['promotion:config:edit']" type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
          </div>
        </div>
      </template>
      <el-form v-loading="loading" label-width="220px" class="config-form">
        <el-form-item v-for="control in controls" :key="control.key" :label="control.label">
          <el-switch v-if="control.type === 'switch'" v-model="values[control.key]" :active-value="1" :inactive-value="0" />
          <el-select v-else-if="control.type === 'select'" v-model="values[control.key]" style="width: 320px">
            <el-option v-for="opt in control.options ?? []" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input-number
            v-else-if="control.type === 'number'"
            v-model="values[control.key]"
            :min="0"
            :controls="false"
            style="width: 220px"
          />
          <el-input v-else v-model="values[control.key]" style="width: 420px" />
          <span class="config-tip">{{ descMap[control.key] || control.tip || '' }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="PromotionVipSetting" lang="ts">
import modal from '@/plugins/modal';
import { usePromoKvConfig, type PromoConfigControl } from '@/views/promotion/components/usePromoKvConfig';

/**
 * VIP 奖励公共设置页（需求文档 06 §3.3）。
 *
 * 为什么复用 KV 配置：本页 7 项均为单值开关或枚举，没有列表与流水，
 * 用 KV 表 + 通用取数组合式函数即可，无需为它单独建表建接口。
 */
const controls: PromoConfigControl[] = [
  { key: 'vip_reward_enabled', label: 'VIP奖励总开关', type: 'switch' },
  { key: 'promotion_auto', label: '自动晋级', type: 'switch', tip: '开启后按门槛自动晋级，关闭则需人工调整' },
  {
    key: 'salary_cycle',
    label: '工资发放周期',
    type: 'select',
    options: [
      { label: '每日', value: 'DAILY' },
      { label: '每周', value: 'WEEKLY' },
      { label: '每月', value: 'MONTHLY' }
    ]
  },
  { key: 'birthday_days', label: '生日礼金可领取天数', type: 'number' },
  { key: 'downgrade_enabled', label: '是否启用降级', type: 'switch' },
  { key: 'keep_level_days', label: '保级考核周期(天)', type: 'number' },
  { key: 'audit_multiple', label: '默认稽核倍数', type: 'json', tip: '奖励入账时写入稽核任务，例如 1.00' }
];

const { loading, saving, values, descMap, load, save } = usePromoKvConfig('vip-setting', controls);

const handleSave = async () => {
  await save();
  modal.msgSuccess('保存成功');
  await load();
};

load();
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.config-form {
  max-width: 900px;
}

.config-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
