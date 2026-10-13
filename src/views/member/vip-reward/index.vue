<template>
  <div class="p-2 app-container member-vip-reward-page">
    <el-alert
      type="warning"
      :closable="false"
      class="mb-2"
      title="资金提示：发放会经钱包核心真实入账；同一会员+等级+奖励类型+周期只会发放一次（幂等键 TX:VIP_*:{uid}:{周期}），失败记录可重试。"
    />

    <!-- ===== 图4：VIP奖励矩阵 ===== -->
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP设置</h3>
            <p>金额单位 VND1000（1 = 1,000 VND）；落库按「分」存储（×100,000）。封顶填 0 表示不封顶。</p>
            <el-button v-hasPermi="['member:vip-reward:edit']" plain size="small" class="mt-2" @click="openCurrencyApply">应用到所有币种</el-button>
          </div>
          <div class="toolbar-actions">
            <span class="vip-switch-label">VIP开关</span>
            <el-switch
              v-model="vipEnabled"
              :active-value="1"
              :inactive-value="0"
              :loading="vipSwitchSaving"
              @change="toggleVipEnabled"
            />
            <el-button v-hasPermi="['member:vip-reward:edit']" plain icon="SetUp" @click="openDetail('other')">VIP公共设置</el-button>
            <el-button plain icon="Document" @click="openDetail('salary')">详情</el-button>
            <el-button v-hasPermi="['member:vip-reward:edit']" plain icon="Upload" @click="openImport">导入修正</el-button>
            <el-button v-hasPermi="['member:vip-reward:edit']" plain icon="EditPen" @click="openBatch">批量修改</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="matrix" row-key="vipLevel" :row-class-name="rowClassName">
        <el-table-column label="VIP等级" prop="levelName" align="center" width="95" fixed="left" />
        <el-table-column label="当前人数" align="center" width="100" fixed="left">
          <template #default="{ row }">{{ row.memberCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="币种" prop="currency" align="center" width="120" />
        <el-table-column label="预览图" align="center" width="80">
          <template #default="{ row }">
            <el-avatar v-if="row.badgeIcon" :src="row.badgeIcon" :size="28" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="晋级要求" align="center">
          <el-table-column label="晋级需再充值" align="right" width="130">
            <template #default="{ row }">{{ fmtUnitInt(cell(row, 1).needDeposit) }}</template>
          </el-table-column>
          <el-table-column label="晋级需再打码" align="right" width="130">
            <template #default="{ row }">{{ fmtUnitInt(cell(row, 1).needBet) }}</template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="晋级奖金" align="right" width="110">
          <template #default="{ row }">{{ fmtUnitMoney(cell(row, 1).amount) }}</template>
        </el-table-column>
        <el-table-column v-for="group in GROUP_COLUMNS" :key="group.key" :label="group.label" align="center">
          <el-table-column :label="group.depositLabel" align="right" width="105">
            <template #default="{ row }">{{ fmtUnitInt(cell(row, group.rewardType).needDeposit) }}</template>
          </el-table-column>
          <el-table-column :label="group.betLabel" align="right" width="105">
            <template #default="{ row }">{{ fmtUnitInt(cell(row, group.rewardType).needBet) }}</template>
          </el-table-column>
          <el-table-column :label="group.label" align="right" width="105">
            <template #default="{ row }">{{ fmtUnitMoney(cell(row, group.rewardType).amount) }}</template>
          </el-table-column>
          <el-table-column :label="group.capLabel" align="right" width="115">
            <template #default="{ row }">{{ fmtUnitInt(cell(row, group.rewardType).capAmount) }}</template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="生日礼金" align="right" width="110">
          <template #default="{ row }">{{ fmtUnitMoney(cell(row, 5).amount) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="130" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:vip-reward:edit']" link type="primary" @click="openRowDialog(row as MatrixRow)">修改</el-button>
            <el-button v-hasPermi="['member:vip-reward:edit']" link type="danger" :disabled="!isLastLevel(row as MatrixRow)" @click="handleDeleteLevel(row as MatrixRow)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 发放记录（原有能力，保留） ===== -->
    <el-card shadow="hover" class="table-panel mt-3">
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

    <!-- ===== 领取限制（图5 概览） ===== -->
    <el-card shadow="hover" class="mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>奖励领取限制</h3>
            <p>reward_type=0 为全局默认；未单独配置的奖励类型回落全局行。详细口径请在「VIP公共设置」中维护。</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="loadLimits">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="limitLoading" border :data="limitRows">
        <el-table-column label="奖励类型" prop="rewardTypeLabel" align="center" width="120" />
        <el-table-column label="允许终端" align="center" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.allowTerminals || '不限制' }}</template>
        </el-table-column>
        <el-table-column label="同设备限领" align="center" width="110">
          <template #default="{ row }">{{ row.deviceLimit ? row.deviceLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="同指纹限领" align="center" width="110">
          <template #default="{ row }">{{ row.fingerprintLimit ? row.fingerprintLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="同IP限领" align="center" width="110">
          <template #default="{ row }">{{ row.ipLimit ? row.ipLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="同姓名限领" align="center" width="110">
          <template #default="{ row }">{{ row.nameLimit ? row.nameLimit + ' 次' : '不限' }}</template>
        </el-table-column>
        <el-table-column label="禁止参与层级" prop="forbidLevels" align="center" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.forbidLevels || '无' }}</template>
        </el-table-column>
        <el-table-column label="稽核范围" align="center" width="120">
          <template #default="{ row }">{{ auditScopeLabel(row.auditScopeMode) }}</template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="110" />
      </el-table>
    </el-card>

    <!-- ===== 保级考核（原有能力，保留） ===== -->
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
        <el-table-column label="判定依据" prop="reason" align="left" min-width="300" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- ===== 单等级修改（图4 操作列「修改」） ===== -->
    <el-dialog v-model="rowDialog.visible" :title="`修改 ${rowDialog.levelName} 奖励配置`" width="880px" append-to-body destroy-on-close>
      <el-alert type="info" :closable="false" class="mb-2" title="单位：VND1000（1 = 1,000 VND）。保存时按 ×100,000 落库为「分」。" />
      <el-table border :data="rowDialog.items">
        <el-table-column label="奖励类型" prop="label" align="center" width="110" />
        <el-table-column label="本周期充值门槛" align="center" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.needDeposit" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="本周期打码门槛" align="center" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.needBet" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="奖励金额" align="center" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.amount" :min="0" :precision="2" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="周期累计封顶" align="center" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.capAmount" :min="0" :controls="false" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="启用" align="center" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitRowDialog">保 存</el-button>
        <el-button @click="rowDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- ===== 批量修改 ===== -->
    <el-dialog v-model="batchDialog.visible" title="批量修改" width="720px" append-to-body destroy-on-close>
      <el-alert type="info" :closable="false" class="mb-2" title="只勾选的字段才会被写入；未勾选的字段保持各等级原值不动。单位：VND1000。" />
      <el-form label-width="150px">
        <el-form-item label="目标VIP等级">
          <el-select v-model="batchDialog.levels" multiple collapse-tags collapse-tags-tooltip style="width: 100%">
            <el-option v-for="row in matrix" :key="row.vipLevel" :label="row.levelName || 'VIP' + row.vipLevel" :value="row.vipLevel" />
          </el-select>
          <el-button link type="primary" class="mt-1" @click="batchDialog.levels = matrix.map((r) => r.vipLevel)">全选</el-button>
          <el-button link type="primary" class="mt-1" @click="batchDialog.levels = []">清空</el-button>
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select v-model="batchDialog.rewardType" style="width: 220px">
            <el-option v-for="t in REWARD_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-for="f in BATCH_FIELDS" :key="f.key" :label="f.label">
          <el-checkbox v-model="batchDialog.enabled[f.key]">修改</el-checkbox>
          <el-input-number v-model="batchDialog.values[f.key]" :min="0" :controls="false" :disabled="!batchDialog.enabled[f.key]" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitBatch">保 存</el-button>
        <el-button @click="batchDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- ===== 导入修正 ===== -->
    <el-dialog v-model="importDialog.visible" title="导入修正" width="720px" append-to-body destroy-on-close>
      <el-alert
        type="info"
        :closable="false"
        class="mb-2"
        title="每行一格：VIP等级,奖励类型,充值门槛,打码门槛,金额,封顶。奖励类型 1晋级 2日 3周 4月 5生日；单位 VND1000。"
      />
      <el-input v-model="importDialog.text" type="textarea" :rows="10" placeholder="示例：&#10;1,1,0,10000,8,0&#10;2,1,0,340000,106,0" />
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitImport">导 入</el-button>
        <el-button @click="importDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- ===== 详情 / VIP公共设置（图3 + 图5） ===== -->
    <vip-public-setting-dialog v-model="detailVisible" :default-tab="detailTab" @saved="reloadSettings" />
  </div>
</template>

<script setup name="MemberVipReward" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import VipPublicSettingDialog from './components/VipPublicSettingDialog.vue';
import {
  applyVipRewardCurrency,
  batchVipRewardConfig,
  disburseVipReward,
  importVipRewardConfig,
  listVipLevel,
  listVipRewardConfig,
  listVipRewardRecord,
  listVipRewardSetting,
  previewVipRewardCurrency,
  retryVipRewardRecord,
  saveVipRewardConfig,
  saveVipRewardSetting
} from '@/api/member/vip';
import type { ConfigItemVO, VipDisburseForm, VipLevelConfigVO, VipRewardConfigVO, VipRewardRecordQuery, VipRewardRecordVO } from '@/api/member/vip/types';

type DataBody<T> = { data?: T };
type PageBody<T> = { rows?: T[]; total?: number };

/** 奖励矩阵单元格 */
interface MatrixCell {
  needDeposit: number;
  needBet: number;
  amount: number;
  capAmount: number;
  status: number;
}

/** 矩阵行：等级配置 + 5 类奖励（按 rewardType 索引） */
interface MatrixRow extends VipLevelConfigVO {
  rewards: Record<number, MatrixCell>;
}

/**
 * 显示单位换算系数：截图币种为 VND1000:1（1 显示单位 = 1,000 VND），
 * 库内统一存「分」（1 VND = 100 分），因此 1 显示单位 = 1000 × 100 = 100,000 分。
 */
const VIP_UNIT = 100000;

const GROUP_COLUMNS = [
  { key: 'month', label: '月工资', rewardType: 4, depositLabel: '当月充值', betLabel: '当月打码', capLabel: '月累计封顶' },
  { key: 'week', label: '周工资', rewardType: 3, depositLabel: '当周充值', betLabel: '当周打码', capLabel: '周累计封顶' },
  { key: 'day', label: '日工资', rewardType: 2, depositLabel: '当日充值', betLabel: '当日打码', capLabel: '日累计封顶' }
];

const REWARD_TYPES = [
  { label: '晋级奖金', value: 1 },
  { label: '日工资', value: 2 },
  { label: '周工资', value: 3 },
  { label: '月工资', value: 4 },
  { label: '生日礼金', value: 5 }
];

const BATCH_FIELDS = [
  { key: 'needDeposit', label: '本周期充值门槛' },
  { key: 'needBet', label: '本周期打码门槛' },
  { key: 'amount', label: '奖励金额' },
  { key: 'capAmount', label: '周期累计封顶' }
] as const;

const route = useRoute();
const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);
const { loading: limitLoading, withLoading: withLimitLoading } = useLoading(true);
const { loading: keepLoading, withLoading: withKeepLoading } = useLoading(false);

const matrix = ref<MatrixRow[]>([]);
const vipEnabled = ref(1);
const vipSwitchSaving = ref(false);
const detailVisible = ref(false);
const detailTab = ref('salary');
const highlightLevel = ref<number | null>(null);

const records = ref<VipRewardRecordVO[]>([]);
const recordTotal = ref(0);
const dateRange = ref<string[]>([]);
const recordQuery = reactive<VipRewardRecordQuery>({ pageNum: 1, pageSize: 10 });
const disburseForm = reactive<VipDisburseForm>({ rewardType: 2, uid: undefined });
const limitRows = ref<any[]>([]);
const keepResult = ref<any>({});

const rowDialog = reactive<{ visible: boolean; levelName: string; vipLevel: number; items: any[] }>({
  visible: false,
  levelName: '',
  vipLevel: 0,
  items: []
});

const batchDialog = reactive<{ visible: boolean; levels: number[]; rewardType: number; enabled: Record<string, boolean>; values: Record<string, number> }>({
  visible: false,
  levels: [],
  rewardType: 1,
  enabled: { needDeposit: false, needBet: false, amount: false, capAmount: false },
  values: { needDeposit: 0, needBet: 0, amount: 0, capAmount: 0 }
});

const importDialog = reactive({ visible: false, text: '' });

const rewardTypeLabel = (type?: number) => REWARD_TYPES.find((t) => t.value === type)?.label ?? '—';
const recordStatusLabel = (status?: number) =>
  ({ 1: '待发放', 2: '已发放', 3: '已取消', 4: '异常' } as Record<number, string>)[status ?? -1] ?? '—';
const auditScopeLabel = (mode?: number) => ({ 1: '不限制', 2: '仅限勾选', 3: '排除勾选' } as Record<number, string>)[mode ?? 1] ?? '不限制';

const emptyCell = (): MatrixCell => ({ needDeposit: 0, needBet: 0, amount: 0, capAmount: 0, status: 1 });
const cell = (row: MatrixRow, rewardType: number): MatrixCell => row.rewards?.[rewardType] ?? emptyCell();

/** 门槛类列：显示为整数（VND1000） */
const fmtUnitInt = (stored?: number) => {
  const value = Number(stored ?? 0) / VIP_UNIT;
  return value === 0 ? '0' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

/** 金额类列：显示 2 位小数（VND1000） */
const fmtUnitMoney = (stored?: number) => (Number(stored ?? 0) / VIP_UNIT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isLastLevel = (row: MatrixRow) => matrix.value.at(-1)?.vipLevel === row.vipLevel;

const rowClassName = ({ row }: { row: MatrixRow }) => (highlightLevel.value === row.vipLevel ? 'vip-row-highlight' : '');

const loadMatrix = async () => {
  await withLoading(async () => {
    const levelsRes = (await listVipLevel()) as unknown as DataBody<VipLevelConfigVO[]>;
    const cfgRes = (await listVipRewardConfig()) as unknown as DataBody<VipRewardConfigVO[]>;
    const configs = cfgRes.data ?? [];
    matrix.value = (levelsRes.data ?? []).map((level) => {
      const rewards: Record<number, MatrixCell> = {};
      REWARD_TYPES.forEach((t) => {
        const hit = configs.find((c) => c.vipLevel === level.vipLevel && c.rewardType === t.value);
        rewards[t.value] = hit
          ? { needDeposit: hit.needDeposit ?? 0, needBet: hit.needBet ?? 0, amount: hit.amount ?? 0, capAmount: hit.capAmount ?? 0, status: hit.status ?? 1 }
          : emptyCell();
      });
      return { ...level, rewards } as MatrixRow;
    });
  });
};

const loadSettings = async () => {
  const res = (await listVipRewardSetting()) as unknown as DataBody<ConfigItemVO[]>;
  (res.data ?? []).forEach((item) => {
    if (item.configKey === 'vip_reward_enabled') {
      try {
        vipEnabled.value = Number(JSON.parse(item.configValue)) === 0 ? 0 : 1;
      } catch {
        vipEnabled.value = 1;
      }
    }
  });
};

const reloadSettings = async () => {
  await loadSettings();
  await loadLimits();
};

const toggleVipEnabled = async (value: number | string | boolean) => {
  vipSwitchSaving.value = true;
  try {
    await saveVipRewardSetting([{ configKey: 'vip_reward_enabled', configValue: String(Number(value)) }]);
    ElMessage.success(Number(value) === 1 ? 'VIP奖励功能已开启' : 'VIP奖励功能已关闭');
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
    await loadSettings();
  } finally {
    vipSwitchSaving.value = false;
  }
};

const loadRecords = async () => {
  await withRecordLoading(async () => {
    const res = (await listVipRewardRecord(recordQuery)) as unknown as PageBody<VipRewardRecordVO>;
    records.value = res.rows ?? [];
    recordTotal.value = res.total ?? 0;
  });
};

const loadLimits = async () => {
  const { listVipRewardLimit } = await import('@/api/member/vip-extra');
  await withLimitLoading(async () => {
    const res: any = await listVipRewardLimit();
    limitRows.value = res?.data ?? [];
  });
};

const openDetail = (tab: string) => {
  detailTab.value = tab;
  detailVisible.value = true;
};

const openRowDialog = (row: MatrixRow) => {
  rowDialog.vipLevel = row.vipLevel;
  rowDialog.levelName = row.levelName || 'VIP' + row.vipLevel;
  rowDialog.items = REWARD_TYPES.map((t) => {
    const c = cell(row, t.value);
    return {
      rewardType: t.value,
      label: t.label,
      needDeposit: c.needDeposit / VIP_UNIT,
      needBet: c.needBet / VIP_UNIT,
      amount: c.amount / VIP_UNIT,
      capAmount: c.capAmount / VIP_UNIT,
      status: c.status
    };
  });
  rowDialog.visible = true;
};

const submitRowDialog = async () => {
  await withSaving(async () =>
    saveVipRewardConfig({
      vipLevel: rowDialog.vipLevel,
      items: rowDialog.items.map((item) => ({
        rewardType: item.rewardType,
        needDeposit: Math.round(Number(item.needDeposit ?? 0) * VIP_UNIT),
        needBet: Math.round(Number(item.needBet ?? 0) * VIP_UNIT),
        amount: Math.round(Number(item.amount ?? 0) * VIP_UNIT),
        capAmount: Math.round(Number(item.capAmount ?? 0) * VIP_UNIT),
        status: item.status
      }))
    })
  );
  modal.msgSuccess('矩阵已保存');
  rowDialog.visible = false;
  await loadMatrix();
};

const openBatch = () => {
  batchDialog.levels = [];
  batchDialog.rewardType = 1;
  batchDialog.enabled = { needDeposit: false, needBet: false, amount: false, capAmount: false };
  batchDialog.values = { needDeposit: 0, needBet: 0, amount: 0, capAmount: 0 };
  batchDialog.visible = true;
};

const submitBatch = async () => {
  if (batchDialog.levels.length === 0) {
    modal.msgWarning('请选择目标VIP等级');
    return;
  }
  const payload: Record<string, unknown> = { vipLevels: batchDialog.levels, rewardType: batchDialog.rewardType };
  const keys = ['needDeposit', 'needBet', 'amount', 'capAmount'] as const;
  keys.forEach((key) => {
    if (batchDialog.enabled[key]) {
      payload[key] = Math.round(Number(batchDialog.values[key] ?? 0) * VIP_UNIT);
    }
  });
  if (keys.every((key) => !batchDialog.enabled[key])) {
    modal.msgWarning('请至少勾选一个要修改的字段');
    return;
  }
  const res = (await withSaving(async () => batchVipRewardConfig(payload as any))) as unknown as DataBody<number>;
  modal.msgSuccess(`批量修改完成（影响 ${res.data ?? 0} 行）`);
  batchDialog.visible = false;
  await loadMatrix();
};

const openImport = () => {
  importDialog.text = '';
  importDialog.visible = true;
};

const submitImport = async () => {
  const rows = importDialog.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[,，\t]/).map((v) => v.trim()))
    .map((parts) => {
      const [vipLevel, rewardType, needDeposit, needBet, amount, capAmount] = parts;
      return {
        vipLevel: Number(vipLevel),
        rewardType: Number(rewardType),
        needDeposit: Math.round(Number(needDeposit || 0) * VIP_UNIT),
        needBet: Math.round(Number(needBet || 0) * VIP_UNIT),
        amount: Math.round(Number(amount || 0) * VIP_UNIT),
        capAmount: Math.round(Number(capAmount || 0) * VIP_UNIT)
      };
    });
  if (rows.length === 0 || rows.some((r) => !Number.isFinite(r.vipLevel) || !Number.isFinite(r.rewardType))) {
    modal.msgWarning('导入内容格式不正确，请按“VIP等级,奖励类型,充值门槛,打码门槛,金额,封顶”每行一格填写');
    return;
  }
  const res = (await withSaving(async () => importVipRewardConfig(rows))) as unknown as DataBody<number>;
  modal.msgSuccess(`导入修正完成（影响 ${res.data ?? 0} 行）`);
  importDialog.visible = false;
  await loadMatrix();
};

const openCurrencyApply = async () => {
  const preview = (await previewVipRewardCurrency()) as unknown as DataBody<{ currencies?: string[]; currencyCount?: number; configuredLevels?: number }>;
  const data = preview.data ?? {};
  const currencies = data.currencies ?? [];
  if (currencies.length <= 1) {
    modal.msg(`当前仅有 1 个币种（${currencies[0] ?? '-'}），已配置 ${data.configuredLevels ?? 0} 个等级，无需同步。`);
    return;
  }
  try {
    await ElMessageBox.confirm(`将把来源币种的奖励矩阵按「等级名称」同步到其它 ${currencies.length - 1} 个币种，是否继续？`, '应用到所有币种', { type: 'warning' });
  } catch {
    return;
  }
  const res = (await applyVipRewardCurrency(currencies[0])) as unknown as DataBody<{ affected?: number; message?: string }>;
  modal.msgSuccess(res.data?.message ?? `同步完成（影响 ${res.data?.affected ?? 0} 行）`);
  await loadMatrix();
};

const handleDeleteLevel = async (row: MatrixRow) => {
  try {
    await ElMessageBox.confirm(`确认删除 ${row.levelName} 的奖励配置？等级本身请在「VIP等级配置」页面删除。`, '系统提示', { type: 'warning' });
  } catch {
    return;
  }
  await saveVipRewardConfig({ vipLevel: row.vipLevel, items: REWARD_TYPES.map((t) => ({ rewardType: t.value, needDeposit: 0, needBet: 0, amount: 0, capAmount: 0, status: 0 })) });
  modal.msgSuccess('该等级奖励配置已停用');
  await loadMatrix();
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

/** 回收口径提示：由 member_vip_reward_setting.keep_level_reclaim_rewards 控制（默认不回收） */
const keepReclaimTip = computed(() => {
  if (keepResult.value?.enabled === false) {
    return '保级开关未开启（keep_level_enabled=0），执行时不会修改任何会员等级。';
  }
  if (keepResult.value?.reclaimEnabled) {
    return '回收开关已开启：不达标会员在考核周期内已发的奖励将被扣回（钱包单号 TX:VIP_RECLAIM:会员:周期，幂等）。';
  }
  return '回收开关未开启（keep_level_reclaim_rewards=0）：仅降级，不回收已发奖励。';
});

const previewKeep = async () => {
  const { previewKeepLevel } = await import('@/api/member/vip-extra');
  await withKeepLoading(async () => {
    const res: any = await previewKeepLevel();
    keepResult.value = res?.data ?? {};
  });
};

const runKeep = async () => {
  try {
    await ElMessageBox.confirm('确认执行保级降级？将按预演名单修改会员 VIP 等级并写入变更履历。', '系统提示', { type: 'warning' });
  } catch {
    return;
  }
  const { runKeepLevel } = await import('@/api/member/vip-extra');
  await withKeepLoading(async () => {
    const res: any = await runKeepLevel();
    keepResult.value = res?.data ?? {};
    ElMessage.success(`执行完成：处理 ${keepResult.value.downgraded ?? 0} 个会员`);
  });
};

onMounted(async () => {
  await loadMatrix();
  await loadSettings();
  await loadRecords();
  await loadLimits();
  // 从「VIP等级配置」带入的等级：定位并高亮，便于运营直接改这一档
  const queryLevel = route.query.level;
  if (queryLevel !== undefined && String(queryLevel).trim() !== '') {
    highlightLevel.value = Number(queryLevel);
    const hit = matrix.value.find((row) => row.vipLevel === highlightLevel.value);
    if (hit) {
      modal.msg(`已定位到 ${hit.levelName || 'VIP' + hit.vipLevel}，点该行「修改」可直接调整奖励配置。`);
    }
  }
});
</script>

<style scoped>
.vip-switch-label {
  margin-right: 6px;
  color: var(--el-text-color-regular);
}

:deep(.vip-row-highlight) {
  background-color: var(--el-color-primary-light-9) !important;
}
</style>
