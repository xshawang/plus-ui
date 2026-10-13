<template>
  <el-dialog
    :model-value="modelValue"
    title="详情"
    width="980px"
    top="4vh"
    append-to-body
    destroy-on-close
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <el-tabs v-model="activeTab">
      <!-- ===== 图3：工资与奖金 ===== -->
      <el-tab-pane label="工资与奖金" name="salary">
        <el-form label-width="200px">
          <el-form-item label="VIP升级时弹窗提醒">
            <el-switch v-model="settings.upgrade_popup_notice" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="保级开关">
            <el-switch v-model="settings.keep_level_enabled" :active-value="1" :inactive-value="0" />
            <span class="text-gray-400 ml-2">关 = 终身保级</span>
          </el-form-item>

          <el-divider content-position="center">每日工资</el-divider>
          <el-form-item label="领取时间">
            <el-radio-group v-model="settings.daily_salary_claim_type">
              <el-radio :value="1">次日</el-radio>
              <el-radio :value="2">实时领取(影响留存)</el-radio>
              <el-radio :value="3">每日</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="晋级时是否重复领取">
            <el-radio-group v-model="settings.daily_salary_repeat_claim">
              <el-radio :value="1">可重复领取(含跨级部分)</el-radio>
              <el-radio :value="2">只能领取最高一档</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="奖励领取过期天数">
            <el-input-number v-model="settings.daily_salary_expire_days" :min="0" :controls="false" style="width: 200px" />
            <span class="text-gray-400 ml-2">0 = 不过期</span>
          </el-form-item>

          <el-divider content-position="center">每周工资</el-divider>
          <el-form-item label="领取时间">
            <el-radio-group v-model="settings.weekly_salary_claim_type">
              <el-radio :value="1">次日</el-radio>
              <el-radio :value="2">下周</el-radio>
              <el-radio :value="3">实时领取(影响留存)</el-radio>
              <el-radio :value="4">每周</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="晋级时是否重复领取">
            <el-radio-group v-model="settings.weekly_salary_repeat_claim">
              <el-radio :value="1">可重复领取(含跨级部分)</el-radio>
              <el-radio :value="2">只能领取最高一档</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="奖励领取过期天数">
            <el-input-number v-model="settings.weekly_salary_expire_days" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="center">每月工资</el-divider>
          <el-form-item label="领取时间">
            <el-radio-group v-model="settings.monthly_salary_claim_type">
              <el-radio :value="1">次日</el-radio>
              <el-radio :value="2">下月</el-radio>
              <el-radio :value="3">实时领取(影响留存)</el-radio>
              <el-radio :value="4">每月</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="晋级时是否重复领取">
            <el-radio-group v-model="settings.monthly_salary_repeat_claim">
              <el-radio :value="1">可重复领取(含跨级部分)</el-radio>
              <el-radio :value="2">只能领取最高一档</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="奖励领取过期天数">
            <el-input-number v-model="settings.monthly_salary_expire_days" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="center">生日礼金</el-divider>
          <el-form-item label="领取时间">
            <el-radio-group v-model="settings.birthday_bonus_claim_type">
              <el-radio :value="1">仅限生日当天00点以后领取</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="奖励领取过期天数">
            <el-input-number v-model="settings.birthday_bonus_expire_days" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="center">日/周/月 生日 公共设置</el-divider>
          <el-form-item label="派发方式">
            <el-radio-group v-model="settings.salary_grant_mode">
              <el-radio :value="1">玩家自领-过期自动到账</el-radio>
              <el-radio :value="2">玩家自领-过期作废</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-divider content-position="center">晋级奖金</el-divider>
          <el-form-item label="领取时间">
            <el-radio-group v-model="settings.upgrade_bonus_claim_type">
              <el-radio :value="1">次日</el-radio>
              <el-radio :value="2">实时领取(影响留存)</el-radio>
              <el-radio :value="3">每日</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="晋级时是否重复领取">
            <el-radio-group v-model="settings.upgrade_bonus_repeat_claim">
              <el-radio :value="1">可重复领取(含跨级部分)</el-radio>
              <el-radio :value="2">只能领取最高一档</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="奖励领取过期天数">
            <el-input-number v-model="settings.upgrade_bonus_expire_days" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== 图5：其它设置 ===== -->
      <el-tab-pane label="其它设置" name="other">
        <el-form label-width="200px">
          <el-divider content-position="center">其它设置</el-divider>
          <el-form-item label="领取终端">
            <div>
              <el-checkbox-group v-model="allowTerminals">
                <el-checkbox v-for="t in ALLOW_TERMINALS" :key="t.value" :value="t.value">{{ t.label }}</el-checkbox>
              </el-checkbox-group>
              <div class="terminal-box">
                <el-checkbox-group v-model="terminals">
                  <el-checkbox v-for="t in APP_PACKAGES" :key="t.value" :value="t.value">{{ t.label }}</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="同登录设备号只能领取">
            <el-input-number v-model="limit.deviceLimit" :min="0" :max="10000" :controls="false" style="width: 150px" />
            <span class="ml-2">次（0=不限）</span>
          </el-form-item>
          <el-form-item label="同浏览器指纹只能领取">
            <el-input-number v-model="limit.fingerprintLimit" :min="0" :max="10000" :controls="false" style="width: 150px" />
            <span class="ml-2">次（0=不限）</span>
          </el-form-item>
          <el-form-item label="同登录IP号只能领取">
            <el-input-number v-model="limit.ipLimit" :min="0" :max="10000" :controls="false" style="width: 150px" />
            <span class="ml-2">次（0=不限）</span>
          </el-form-item>
          <el-form-item label="同姓名只能领取">
            <el-input-number v-model="limit.nameLimit" :min="0" :max="999999" :controls="false" style="width: 150px" />
            <span class="ml-2">次（0=不限）</span>
          </el-form-item>

          <el-form-item label="更多申领限制">
            <el-checkbox-group v-model="moreClaimLimits">
              <el-checkbox v-for="c in CLAIM_LIMITS" :key="c.value" :value="c.value" class="claim-limit-item">{{ c.label }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="最近N天领取条件">
            <div class="recent-rules">
              <div v-for="r in recentRules" :key="r.key" class="recent-rule-row">
                <el-checkbox v-model="r.enabled" />
                <span class="rule-label">最近</span>
                <el-input-number v-model="r.days" :min="1" :max="90" :controls="false" style="width: 90px" />
                <span class="rule-label">{{ r.label }}</span>
                <el-input-number v-model="r.value" :min="0" :controls="false" style="width: 140px" />
                <span class="rule-label">{{ r.unit }}</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="禁止参与层级(黑名单)">
            <el-select
              v-model="forbidLevelIds"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              placeholder="留空=不限制"
              style="width: 100%"
            >
              <el-option v-for="lv in levelOptions" :key="lv.levelId" :label="lv.levelName" :value="lv.levelId" />
            </el-select>
          </el-form-item>
          <el-form-item label="稽核倍数">
            <el-input-number v-model="settings.audit_turnover_multiple" :min="0" :precision="2" :controls="false" style="width: 200px" />
          </el-form-item>
          <el-form-item label="奖金稽核指定平台">
            <el-radio-group v-model="limit.auditScopeMode">
              <el-radio :value="1">不限制</el-radio>
              <el-radio :value="2">仅限勾选平台</el-radio>
              <el-radio :value="3">排除勾选平台</el-radio>
            </el-radio-group>
            <el-input v-model="limit.auditGameScope" placeholder="game_code，逗号分隔" style="width: 100%; margin-top: 6px" />
          </el-form-item>
          <el-form-item label="规则说明">
            <el-radio-group v-model="settings.vip_rule_desc_mode">
              <el-radio :value="1">自定义</el-radio>
              <el-radio :value="2">系统自带</el-radio>
            </el-radio-group>
            <el-input v-model="limit.ruleDesc" type="textarea" :rows="5" maxlength="1024" class="mt-2" placeholder="多语言文案可在此维护（按语言分段）" />
          </el-form-item>
          <el-form-item label="VIP常见问题">
            <el-switch v-model="settings.vip_faq_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="VIP展示方式">
            <el-radio-group v-model="settings.vip_show_mode">
              <el-radio :value="1">列表展示</el-radio>
              <el-radio :value="2">卡片展示</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="图标样式">
            <el-radio-group v-model="settings.vip_icon_style">
              <el-radio :value="1">样式1</el-radio>
              <el-radio :value="2">样式2</el-radio>
              <el-radio :value="3">样式3</el-radio>
              <el-radio :value="4">样式4</el-radio>
              <el-radio :value="5">样式5</el-radio>
              <el-radio :value="0">自定义</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button type="primary" :loading="saving" @click="submit">保 存</el-button>
      <el-button @click="emit('update:modelValue', false)">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { listVipRewardSetting, saveVipRewardSetting } from '@/api/member/vip';
import { listVipRewardLimit, saveVipRewardLimit, type VipRewardLimitVO } from '@/api/member/vip-extra';
import { listMemberLevelOptions } from '@/api/member/level';
import type { MemberLevelVO } from '@/api/member/level/types';

const props = defineProps<{ modelValue: boolean; defaultTab?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>();

const ALLOW_TERMINALS = [
  { label: 'Android_APP可领取', value: 'ANDROID_APP' },
  { label: 'iOS_APP可领取', value: 'IOS_APP' },
  { label: 'PC可领取', value: 'PC' },
  { label: 'Android_H5可领取', value: 'ANDROID_H5' },
  { label: 'iOS_H5可领取', value: 'IOS_H5' }
];

const APP_PACKAGES = [
  { label: '原生APP', value: 'NATIVE_APP' },
  { label: '极速APP', value: 'FAST_APP' },
  { label: '马甲包', value: 'MASK_PACKAGE' },
  { label: 'PWA快捷APP', value: 'PWA_APP' },
  { label: 'iOS描述签', value: 'IOS_DESC_SIGN' }
];

const CLAIM_LIMITS = [
  { label: '完成手机短信验证才能领取', value: 'sms_verify' },
  { label: '完成邮箱验证才能领取', value: 'email_verify' },
  { label: '完成生日设置才能领取', value: 'birthday_set' },
  { label: '完成银行卡绑定才能领取', value: 'bank_card' },
  { label: '绑定虚拟货币才能领取', value: 'crypto_wallet' },
  { label: '绑定三方钱包才能领取', value: 'third_wallet' },
  { label: '绑定收款方式才能领取', value: 'payee' },
  { label: '填写真实姓名才能领取', value: 'real_name' },
  { label: '绑定生物识别才可领取', value: 'biometric' },
  { label: '完成KYC认证才可领取', value: 'kyc' },
  { label: '绑定三方快捷登录才可领取', value: 'third_login' },
  { label: '完成首充才能领取', value: 'first_recharge' }
];

const RECENT_RULE_META = [
  { key: 'deposit_times', label: '天内，累计充值次数≥', unit: '次，才能领取' },
  { key: 'deposit_amount', label: '天内，累计充值金额≥', unit: '才能领取' },
  { key: 'deposit_days', label: '天内，累计充值天数≥', unit: '天，才能领取' },
  { key: 'bet_amount', label: '天内，累计打码金额≥', unit: '才能领取' },
  { key: 'bet_times_deposit', label: '天内打码是期间充值的', unit: '倍，才能领取' }
];

/** KV 标量口径（图3/图5 开关与枚举），键名与 member_vip_reward_setting 一一对应 */
const settings = reactive<Record<string, number>>({
  upgrade_popup_notice: 0,
  keep_level_enabled: 0,
  daily_salary_claim_type: 1,
  daily_salary_repeat_claim: 2,
  daily_salary_expire_days: 0,
  weekly_salary_claim_type: 1,
  weekly_salary_repeat_claim: 2,
  weekly_salary_expire_days: 0,
  monthly_salary_claim_type: 1,
  monthly_salary_repeat_claim: 2,
  monthly_salary_expire_days: 0,
  birthday_bonus_claim_type: 1,
  birthday_bonus_expire_days: 0,
  salary_grant_mode: 2,
  upgrade_bonus_claim_type: 2,
  upgrade_bonus_repeat_claim: 1,
  upgrade_bonus_expire_days: 0,
  audit_turnover_multiple: 1,
  vip_rule_desc_mode: 1,
  vip_faq_enabled: 0,
  vip_show_mode: 1,
  vip_icon_style: 1
});

const limit = reactive<VipRewardLimitVO>({ rewardType: 0, auditScopeMode: 1 });
const allowTerminals = ref<string[]>([]);
const terminals = ref<string[]>([]);
const moreClaimLimits = ref<string[]>([]);
const recentRules = ref<{ key: string; label: string; unit: string; enabled: boolean; days: number; value: number }[]>([]);
const forbidLevelIds = ref<number[]>([]);
const levelOptions = ref<MemberLevelVO[]>([]);
const activeTab = ref('salary');
const saving = ref(false);

const load = async () => {
  const s: any = await listVipRewardSetting();
  (s?.data ?? []).forEach((item: { configKey: string; configValue: string }) => {
    try {
      const parsed = JSON.parse(item.configValue);
      if (typeof parsed === 'number') {
        settings[item.configKey] = parsed;
      }
    } catch {
      // 非标量配置（数组/文案）不在本弹窗编辑，忽略
    }
  });
  const l: any = await listVipRewardLimit();
  const global = (l?.data ?? []).find((row: VipRewardLimitVO) => row.rewardType === 0) ?? { rewardType: 0, auditScopeMode: 1 };
  Object.assign(limit, global);
  allowTerminals.value = (global.allowTerminals || '').split(',').map((v: string) => v.trim()).filter(Boolean);
  terminals.value = parseArray(global.terminalsJson);
  moreClaimLimits.value = parseArray(global.moreClaimLimitsJson);
  const saved = parseObjectArray(global.recentRulesJson);
  recentRules.value = RECENT_RULE_META.map((meta) => {
    const hit = saved.find((r) => r.key === meta.key);
    return { ...meta, enabled: !!hit?.enabled, days: hit?.days ?? 1, value: hit?.value ?? 1 };
  });
  forbidLevelIds.value = (global.forbidLevels || '').split(',').map((v: string) => Number(v)).filter((v) => !!v);
  const lv: any = await listMemberLevelOptions();
  levelOptions.value = lv?.data ?? [];
};

const parseArray = (json?: string): string[] => {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
};

const parseObjectArray = (json?: string): { key: string; enabled?: boolean; days?: number; value?: number }[] => {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const submit = async () => {
  saving.value = true;
  try {
    const items = Object.entries(settings).map(([configKey, value]) => ({ configKey, configValue: String(value) }));
    await saveVipRewardSetting(items);
    await saveVipRewardLimit({
      ...limit,
      rewardType: 0,
      allowTerminals: allowTerminals.value.join(','),
      terminalsJson: JSON.stringify(terminals.value),
      moreClaimLimitsJson: JSON.stringify(moreClaimLimits.value),
      recentRulesJson: JSON.stringify(recentRules.value.map(({ key, enabled, days, value }) => ({ key, enabled, days, value }))),
      forbidLevels: forbidLevelIds.value.join(',')
    });
    ElMessage.success('保存成功');
    emit('saved');
    emit('update:modelValue', false);
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    saving.value = false;
  }
};

// 弹窗每次打开时重新拉取（配置可能被其它页签改过）；destroy-on-close 下组件会重建，这里仍保留 watch 以覆盖复用场景。
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      activeTab.value = props.defaultTab ?? 'salary';
      load();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.terminal-box {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 6px;
}

.claim-limit-item {
  width: 300px;
  margin-right: 0;
}

.recent-rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.rule-label {
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
</style>
