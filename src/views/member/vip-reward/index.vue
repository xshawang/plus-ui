<template>
  <div class="p-2 app-container member-vip-reward-page">
    <el-alert
      type="warning"
      :closable="false"
      class="mb-2"
      title="资金提示：发放会经钱包核心真实入账；同一会员+等级+奖励类型+周期只会发放一次（幂等键 TX:VIP_*:{uid}:{周期}），失败记录可重试。"
    />

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP 奖励矩阵</h3>
            <p>门槛与金额单位：分（1 VND = 100 分）；封顶填 0 表示不封顶。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="currentLevel" style="width: 150px" @change="loadConfig">
              <el-option v-for="level in levelOptions" :key="level" :label="'VIP' + level" :value="level" />
            </el-select>
            <el-button v-hasPermi="['member:vip-reward:edit']" type="primary" :loading="saving" @click="saveConfig">保存矩阵</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="matrix">
        <el-table-column label="奖励类型" align="center" width="130">
          <template #default="{ row }">{{ rewardTypeLabel(row.rewardType) }}</template>
        </el-table-column>
        <el-table-column label="本周期充值门槛(分)" align="center" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.needDeposit" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="本周期打码门槛(分)" align="center" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.needBet" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="奖励金额(分)" align="center" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.amount" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="周期封顶(分,0=不限)" align="center" width="170">
          <template #default="{ row }">
            <el-input-number v-model="row.capAmount" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="启用" align="center" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>发放规则</h3>
            <p>默认口径：次日发放、需稽核（倍数可配）、过期天数可配；终端与层级限制暂由配置键承载。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:vip-reward:edit']" type="primary" plain :loading="saving" @click="saveSettings">保存规则</el-button>
          </div>
        </div>
      </template>
      <el-form label-width="260px">
        <el-form-item label="VIP升级弹窗提醒">
          <el-switch v-model="settings.upgrade_popup_notice" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="保级开关（关闭=终身保级）">
          <el-switch v-model="settings.keep_level_enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="日工资领取时间">
          <el-select v-model="settings.daily_salary_claim_type" style="width: 220px">
            <el-option label="次日" :value="1" />
            <el-option label="实时" :value="2" />
            <el-option label="每日" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="周工资领取时间">
          <el-select v-model="settings.weekly_salary_claim_type" style="width: 220px">
            <el-option label="次日" :value="1" />
            <el-option label="下周" :value="2" />
            <el-option label="实时" :value="3" />
            <el-option label="每周" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="月工资领取时间">
          <el-select v-model="settings.monthly_salary_claim_type" style="width: 220px">
            <el-option label="次日" :value="1" />
            <el-option label="下月" :value="2" />
            <el-option label="实时" :value="3" />
            <el-option label="每月" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励稽核倍数">
          <el-input-number v-model="settings.audit_turnover_multiple" :min="0" :precision="2" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="日/周/月/生日 过期天数">
          <el-input-number v-model="settings.daily_salary_expire_days" :min="0" :controls="false" style="width: 110px" />
          <el-input-number v-model="settings.weekly_salary_expire_days" :min="0" :controls="false" style="width: 110px" class="ml-2" />
          <el-input-number v-model="settings.monthly_salary_expire_days" :min="0" :controls="false" style="width: 110px" class="ml-2" />
          <el-input-number v-model="settings.birthday_bonus_expire_days" :min="0" :controls="false" style="width: 110px" class="ml-2" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>发放记录</h3>
            <p>共 {{ recordTotal }} 条；异常记录可重试（复用同一幂等键，不会重复入账）。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="disburseForm.rewardType" style="width: 130px">
              <el-option label="晋级奖金" :value="1" />
              <el-option label="日工资" :value="2" />
              <el-option label="周工资" :value="3" />
              <el-option label="月工资" :value="4" />
              <el-option label="生日礼金" :value="5" />
            </el-select>
            <el-date-picker
              v-if="disburseForm.rewardType !== 1"
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 250px"
            />
            <el-input v-else v-model="disburseForm.uid" placeholder="晋级奖金需填会员ID" style="width: 190px" />
            <el-button v-hasPermi="['member:vip-reward:edit']" type="primary" :loading="saving" @click="handleDisburse">触发发放</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="recordLoading" border :data="records">
        <el-table-column label="时间" prop="createdAt" align="center" width="180" />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="等级" align="center" width="80">
          <template #default="{ row }">VIP{{ row.vipLevel }}</template>
        </el-table-column>
        <el-table-column label="奖励类型" align="center" width="110">
          <template #default="{ row }">{{ rewardTypeLabel(row.rewardType) }}</template>
        </el-table-column>
        <el-table-column label="周期" prop="periodKey" align="center" width="120" />
        <el-table-column label="金额(分)" prop="amount" align="right" width="120" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : row.status === 4 ? 'danger' : 'warning'">{{ recordStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="钱包业务号" prop="bizNo" align="left" min-width="220" show-overflow-tooltip />
        <el-table-column label="失败原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.failReason || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:vip-reward:edit']" link type="primary" :disabled="row.status !== 4" @click="handleRetry(row as VipRewardRecordVO)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="recordTotal > 0"
        v-model:page="recordQuery.pageNum"
        v-model:limit="recordQuery.pageSize"
        :total="recordTotal"
        @pagination="loadRecords"
      />
    </el-card>

    <!-- 领取限制（06 文档 §4）：终端 / 同设备 / 同指纹 / 层级黑名单 / 稽核平台范围 -->
    <el-card shadow="hover" class="mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>奖励领取限制</h3>
            <p>reward_type=0 为全局默认；未单独配置的奖励类型回落全局行</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="loadLimits">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="limitLoading" border :data="limitRows">
        <el-table-column label="奖励类型" prop="rewardTypeLabel" align="center" width="130" />
        <el-table-column label="允许终端" prop="allowTerminals" align="center" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.allowTerminals || '不限制' }}</template>
        </el-table-column>
        <el-table-column label="同设备限领" align="center" width="120">
          <template #default="{ row }">{{ row.deviceLimit ? row.deviceLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="同指纹限领" align="center" width="120">
          <template #default="{ row }">{{ row.fingerprintLimit ? row.fingerprintLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="禁止参与层级" prop="forbidLevels" align="center" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.forbidLevels || '无' }}</template>
        </el-table-column>
        <el-table-column label="稽核范围" align="center" width="130">
          <template #default="{ row }">{{ auditScopeLabel(row.auditScopeMode) }}</template>
        </el-table-column>
        <el-table-column label="稽核平台" prop="auditGameScope" align="center" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditGameScope || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="110" />
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:vip-reward:edit']" link type="primary" @click="openLimit(row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 保级考核（06 文档 §3）：先预演再执行，降级会写 user_vip_log -->
    <el-card shadow="hover" class="mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP 保级考核</h3>
            <p>{{ keepResult.message || '按 member_vip_reward_setting 的 keep_level_* 规则考核（月度自动执行）' }}</p>
          </div>
          <div class="toolbar-actions">
            <el-button plain icon="View" :loading="keepLoading" @click="previewKeep">预演</el-button>
            <el-button v-hasPermi="['member:vip-reward:edit']" type="danger" plain icon="Bottom" :loading="keepLoading" @click="runKeep">执行降级</el-button>
          </div>
        </div>
      </template>
      <el-alert class="mb-2" type="warning" :closable="false" title="执行降级会同步修改 player_account / player_profile 的 VIP 等级并写入 user_vip_log（change_type=3），请先预演确认名单。" />
      <el-alert class="mb-2" type="info" :closable="false" :title="keepReclaimTip" />
      <el-table v-loading="keepLoading" border :data="keepResult.items ?? []" max-height="320">
        <el-table-column label="会员UID" prop="uid" align="center" width="200" show-overflow-tooltip />
        <el-table-column label="当前等级" prop="beforeLevel" align="center" width="110" />
        <el-table-column label="降级后" prop="afterLevel" align="center" width="110" />
        <el-table-column label="周期充值(分)" prop="periodDeposit" align="right" width="140" />
        <el-table-column label="周期打码(分)" prop="periodBet" align="right" width="140" />
        <el-table-column label="回收奖励(分)" align="right" width="140">
          <template #default="{ row }">{{ row.reclaimAmount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="回收结果" align="center" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.reclaimResult" :type="row.reclaimResult === '已回收' ? 'success' : 'warning'">{{ row.reclaimResult }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="判定依据" prop="reason" align="left" min-width="300" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-dialog v-model="limitDialog.visible" title="奖励领取限制配置" width="640px" append-to-body destroy-on-close>
      <el-form :model="limitDialog.form" label-width="150px">
        <el-form-item label="奖励类型">
          <el-select v-model="limitDialog.form.rewardType" :disabled="true" style="width: 100%">
            <el-option label="全局默认" :value="0" />
            <el-option label="晋级奖金" :value="1" />
            <el-option label="日工资" :value="2" />
            <el-option label="周工资" :value="3" />
            <el-option label="月工资" :value="4" />
            <el-option label="生日礼金" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="允许终端">
          <el-input v-model="limitDialog.form.allowTerminals" placeholder="ANDROID_APP,IOS_APP,PC,ANDROID_H5,IOS_H5；留空=不限制" />
        </el-form-item>
        <el-form-item label="同设备限领次数">
          <el-input-number v-model="limitDialog.form.deviceLimit" :min="0" controls-position="right" />
          <span class="text-gray-400 ml-2">0=不限</span>
        </el-form-item>
        <el-form-item label="同指纹限领次数">
          <el-input-number v-model="limitDialog.form.fingerprintLimit" :min="0" controls-position="right" />
          <span class="text-gray-400 ml-2">0=不限</span>
        </el-form-item>
        <el-form-item label="禁止参与层级">
          <el-input v-model="limitDialog.form.forbidLevels" placeholder="层级ID，逗号分隔；留空=不限制" />
        </el-form-item>
        <el-form-item label="稽核平台范围">
          <el-select v-model="limitDialog.form.auditScopeMode" style="width: 100%">
            <el-option label="不限制" :value="1" />
            <el-option label="仅限勾选平台" :value="2" />
            <el-option label="排除勾选平台" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="稽核平台">
          <el-input v-model="limitDialog.form.auditGameScope" placeholder="game_code，逗号分隔" />
        </el-form-item>
        <el-form-item label="规则说明">
          <el-input v-model="limitDialog.form.ruleDesc" type="textarea" :rows="2" maxlength="1024" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="limitDialog.saving" @click="submitLimit">确 定</el-button>
        <el-button @click="limitDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberVipReward" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  disburseVipReward,
  listVipLevel,
  listVipRewardConfig,
  listVipRewardRecord,
  listVipRewardSetting,
  retryVipRewardRecord,
  saveVipRewardConfig,
  saveVipRewardSetting
} from '@/api/member/vip';
import type { ConfigItemVO, VipDisburseForm, VipLevelConfigVO, VipRewardConfigVO, VipRewardRecordQuery, VipRewardRecordVO } from '@/api/member/vip/types';

type DataBody<T> = { data?: T };
type PageBody<T> = { rows?: T[]; total?: number };

const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);

const levels = ref<VipLevelConfigVO[]>([]);
const currentLevel = ref(1);
const matrix = ref<VipRewardConfigVO[]>([]);
const records = ref<VipRewardRecordVO[]>([]);
const recordTotal = ref(0);
const dateRange = ref<string[]>([]);
const settingRows = ref<ConfigItemVO[]>([]);

const recordQuery = reactive<VipRewardRecordQuery>({ pageNum: 1, pageSize: 10 });
const disburseForm = reactive<VipDisburseForm>({ rewardType: 2, uid: undefined });
const settings = reactive<Record<string, number>>({
  upgrade_popup_notice: 0,
  keep_level_enabled: 0,
  daily_salary_claim_type: 1,
  weekly_salary_claim_type: 1,
  monthly_salary_claim_type: 1,
  daily_salary_expire_days: 0,
  weekly_salary_expire_days: 0,
  monthly_salary_expire_days: 0,
  birthday_bonus_expire_days: 0,
  audit_turnover_multiple: 1
});

const levelOptions = computed(() => levels.value.map((item) => item.vipLevel));
const rewardTypeLabel = (type?: number) =>
  ({ 1: '晋级奖金', 2: '日工资', 3: '周工资', 4: '月工资', 5: '生日礼金' } as Record<number, string>)[type ?? -1] ?? '—';
const recordStatusLabel = (status?: number) =>
  ({ 1: '待发放', 2: '已发放', 3: '已取消', 4: '异常' } as Record<number, string>)[status ?? -1] ?? '—';

const loadLevels = async () => {
  const res = (await listVipLevel()) as unknown as DataBody<VipLevelConfigVO[]>;
  levels.value = res.data ?? [];
  if (levels.value.length > 0) {
    currentLevel.value = levels.value[0].vipLevel;
  }
};

const loadConfig = async () => {
  await withLoading(async () => {
    const res = (await listVipRewardConfig(currentLevel.value)) as unknown as DataBody<VipRewardConfigVO[]>;
    const rows = res.data ?? [];
    // 保证 5 类奖励都有编辑行（未配置的以 0 占位，保存时落库）
    matrix.value = [1, 2, 3, 4, 5].map((type) => {
      const exists = rows.find((item) => item.rewardType === type);
      return exists ?? { configId: 0, vipLevel: currentLevel.value, rewardType: type, needDeposit: 0, needBet: 0, amount: 0, capAmount: 0, status: 1 };
    });
  });
};

const loadSettings = async () => {
  const res = (await listVipRewardSetting()) as unknown as DataBody<ConfigItemVO[]>;
  settingRows.value = res.data ?? [];
  settingRows.value.forEach((item) => {
    try {
      const parsed = JSON.parse(item.configValue);
      if (typeof parsed === 'number') {
        settings[item.configKey] = parsed;
      }
    } catch {
      // 非数字配置（数组/文案）不在本页编辑，忽略
    }
  });
};

const loadRecords = async () => {
  await withRecordLoading(async () => {
    const res = (await listVipRewardRecord(recordQuery)) as unknown as PageBody<VipRewardRecordVO>;
    records.value = res.rows ?? [];
    recordTotal.value = res.total ?? 0;
  });
};

const saveConfig = async () => {
  await withSaving(async () =>
    saveVipRewardConfig({
      vipLevel: currentLevel.value,
      items: matrix.value.map((row) => ({
        rewardType: row.rewardType,
        needDeposit: row.needDeposit ?? 0,
        needBet: row.needBet ?? 0,
        amount: row.amount ?? 0,
        capAmount: row.capAmount ?? 0,
        status: row.status ?? 1
      }))
    })
  );
  modal.msgSuccess('矩阵已保存');
  await loadConfig();
};

const saveSettings = async () => {
  const items = Object.entries(settings).map(([configKey, value]) => ({ configKey, configValue: String(value) }));
  await withSaving(async () => saveVipRewardSetting(items));
  modal.msgSuccess('规则已保存');
  await loadSettings();
};

const handleDisburse = async () => {
  if (disburseForm.rewardType === 1 && !disburseForm.uid) {
    modal.msgWarning('晋级奖金需填写会员ID（支持单会员补发）');
    return;
  }
  const payload: VipDisburseForm = {
    rewardType: disburseForm.rewardType,
    uid: disburseForm.rewardType === 1 ? disburseForm.uid : undefined,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1]
  };
  const res = (await withSaving(async () => disburseVipReward(payload))) as unknown as DataBody<Record<string, number | string>>;
  const data = res.data ?? {};
  modal.msgSuccess(`发放完成：候选 ${data.candidates ?? 0}，成功 ${data.granted ?? 0}，跳过 ${data.skipped ?? 0}，失败 ${data.failed ?? 0}`);
  await loadRecords();
};

const handleRetry = async (row: VipRewardRecordVO) => {
  const res = (await retryVipRewardRecord(row.recordId)) as unknown as DataBody<number>;
  modal.msgSuccess(`重试完成（影响 ${res.data ?? 0} 条）`);
  await loadRecords();
};

onMounted(async () => {
  await loadLevels();
  await loadConfig();
  await loadSettings();
  await loadRecords();
});

/* ---------------- 领取限制 + 保级考核（批次 7） ---------------- */
const limitRows = ref<any[]>([]);
const limitLoading = ref(false);
const keepLoading = ref(false);
const keepResult = ref<any>({});
const limitDialog = reactive<{ visible: boolean; saving: boolean; form: any }>({
  visible: false,
  saving: false,
  form: { rewardType: 0 }
});

const auditScopeLabel = (mode?: number) => ({ 1: '不限制', 2: '仅限勾选', 3: '排除勾选' } as Record<number, string>)[mode ?? 1] ?? '不限制';

/** 回收口径提示：由 member_vip_reward_setting.keep_level_reclaim_rewards 控制（默认不回收） */
const keepReclaimTip = computed(() => {
  if (keepResult.value?.enabled === false) {
    return '保级开关未开启（keep_level_enabled=0），执行时不会修改任何会员等级。';
  }
  if (keepResult.value?.reclaimEnabled) {
    return `回收开关已开启：不达标会员在考核周期内已发的奖励将被扣回（钱包单号 TX:VIP_RECLAIM:会员:周期，幂等），回收失败会标记原因由人工跟进。`;
  }
  return '回收开关未开启（keep_level_reclaim_rewards=0）：仅降级，不回收已发奖励；如需回收请在「发放规则」中开启。';
});

const loadLimits = async () => {
  const { listVipRewardLimit } = await import('@/api/member/vip-extra');
  limitLoading.value = true;
  try {
    const res: any = await listVipRewardLimit();
    limitRows.value = res?.data ?? [];
  } finally {
    limitLoading.value = false;
  }
};

const openLimit = (row: any) => {
  limitDialog.form = { ...row };
  limitDialog.visible = true;
};

const submitLimit = async () => {
  const { ElMessage } = await import('element-plus');
  const { saveVipRewardLimit } = await import('@/api/member/vip-extra');
  limitDialog.saving = true;
  try {
    await saveVipRewardLimit(limitDialog.form);
    ElMessage.success('保存成功');
    limitDialog.visible = false;
    await loadLimits();
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    limitDialog.saving = false;
  }
};

const previewKeep = async () => {
  const { previewKeepLevel } = await import('@/api/member/vip-extra');
  keepLoading.value = true;
  try {
    const res: any = await previewKeepLevel();
    keepResult.value = res?.data ?? {};
  } finally {
    keepLoading.value = false;
  }
};

const runKeep = async () => {
  const { ElMessage, ElMessageBox } = await import('element-plus');
  try {
    await ElMessageBox.confirm('确认执行保级降级？将按预演名单修改会员 VIP 等级并写入变更履历。', '系统提示', { type: 'warning' });
  } catch {
    return;
  }
  const { runKeepLevel } = await import('@/api/member/vip-extra');
  keepLoading.value = true;
  try {
    const res: any = await runKeepLevel();
    keepResult.value = res?.data ?? {};
    ElMessage.success(`执行完成：处理 ${keepResult.value.downgraded ?? 0} 个会员`);
  } catch (e) {
    ElMessage.error('执行失败：' + (e as Error).message);
  } finally {
    keepLoading.value = false;
  }
};

loadLimits();
</script>
