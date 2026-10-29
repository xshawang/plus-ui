<template>
  <el-card shadow="never" class="governance-card">
    <template #header>
      <div class="card-header">
        <div>
          <div class="card-title">策略灰度、审批与回滚</div>
          <div class="card-subtitle">申请人不能审批自己的请求；紧急回滚只回落基线</div>
        </div>
        <el-button
          v-hasPermi="['robot:strategy:approve']"
          type="danger"
          plain
          :disabled="!gameCode"
          :loading="actionLoading"
          @click="handleEmergencyRollback"
        >
          紧急回滚基线
        </el-button>
      </div>
    </template>

    <el-alert
      v-if="!gameCode"
      type="info"
      :closable="false"
      show-icon
      title="请先在上方选择一个游戏，再提交或审批策略变更"
    />

    <template v-else>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="所有变更仅从下一手生效，进行中牌局不会被切换"
        description="审批执行后由 Redis 通知 room 立即失效策略缓存；通知丢失时最迟 30 秒由 TTL 自愈。大数据量或生产发布前仍应先在 5%~25% 灰度观察。"
        class="mb-3"
      />

      <div class="request-form">
        <el-select v-model="form.action" style="width: 145px">
          <el-option label="灰度" value="CANARY" />
          <el-option label="全量" value="ACTIVATE" />
          <el-option label="回滚基线" value="ROLLBACK" />
        </el-select>
        <el-select
          v-if="form.action !== 'ROLLBACK'"
          v-model="form.versionKey"
          placeholder="选择策略版本"
          style="width: 250px"
        >
          <el-option
            v-for="item in versionOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
        <el-input-number
          v-if="form.action === 'CANARY'"
          v-model="form.canaryPercent"
          :min="1"
          :max="100"
          :step="5"
          controls-position="right"
          style="width: 150px"
        />
        <el-input
          v-model="form.reason"
          placeholder="变更原因、预期观察指标和回滚条件"
          maxlength="512"
          show-word-limit
          style="min-width: 320px; flex: 1"
        />
        <el-button
          v-hasPermi="['robot:strategy:request']"
          type="primary"
          :loading="actionLoading"
          :disabled="form.action !== 'ROLLBACK' && !form.versionKey"
          @click="submitRequest"
        >
          提交审批
        </el-button>
      </div>

      <el-table v-loading="loading" :data="requests" border size="small">
        <el-table-column label="申请单号" min-width="205" prop="requestNo" show-overflow-tooltip />
        <el-table-column label="变更" min-width="170">
          <template #default="{ row }">
            {{ actionLabel(row.action) }}
            <span v-if="row.strategyCode" class="sub-text">
              {{ row.strategyCode }} v{{ row.version }}
            </span>
            <span v-if="row.action === 'CANARY'" class="sub-text"> · {{ row.canaryPercent }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="requestStatusType(row.status)">{{ requestStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="120" prop="requestedBy" />
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">{{ timeText(row.requestedAt) }}</template>
        </el-table-column>
        <el-table-column label="审批人" width="120">
          <template #default="{ row }">{{ row.approvedBy || '—' }}</template>
        </el-table-column>
        <el-table-column label="原因 / 错误" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">{{ row.errorMsg || row.reason || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button
                v-hasPermi="['robot:strategy:approve']"
                link
                type="success"
                @click="approveRequest(row)"
              >
                批准执行
              </el-button>
              <el-button
                v-hasPermi="['robot:strategy:approve']"
                link
                type="danger"
                @click="rejectRequest(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-hasPermi="['robot:strategy:request']"
                link
                @click="cancelRequest(row)"
              >
                取消
              </el-button>
            </template>
            <span v-else class="sub-text">—</span>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  approveRobotStrategyChange,
  cancelRobotStrategyChange,
  emergencyRollbackRobotStrategy,
  rejectRobotStrategyChange,
  robotStrategyGovernance,
  submitRobotStrategyChange
} from '@/api/robot/ops';
import modal from '@/plugins/modal';
import { timeText } from '../format';

const props = defineProps<{
  gameCode: string;
  versions: any[];
  refreshToken: string;
}>();
const emit = defineEmits<{ changed: [] }>();
const loading = ref(false);
const actionLoading = ref(false);
const requests = ref<any[]>([]);
const loadedVersions = ref<any[]>([]);
const form = reactive({
  action: 'CANARY',
  versionKey: '',
  canaryPercent: 10,
  reason: ''
});

const sourceVersions = computed(() => loadedVersions.value.length ? loadedVersions.value : props.versions);
const versionOptions = computed(() => sourceVersions.value
  .filter(item => ['SIMULATED', 'APPROVED', 'CANARY'].includes(item.status)
    || (item.status === 'RETIRED' && item.approvedAt))
  .map(item => ({
    key: `${item.strategyCode}|${item.version}`,
    label: `${item.strategyCode} v${item.version} · ${item.status}`
  })));

function selectedVersion() {
  const [strategyCode, rawVersion] = form.versionKey.split('|');
  return { strategyCode, version: Number(rawVersion) };
}

async function load() {
  if (!props.gameCode) {
    requests.value = [];
    loadedVersions.value = [];
    return;
  }
  loading.value = true;
  try {
    const res: any = await robotStrategyGovernance(props.gameCode);
    const data = res?.data || {};
    requests.value = data.requests || [];
    loadedVersions.value = data.versions || [];
  } finally {
    loading.value = false;
  }
}

async function submitRequest() {
  if (!props.gameCode) return;
  let strategyCode: string | undefined;
  let version: number | undefined;
  if (form.action !== 'ROLLBACK') {
    const selected = selectedVersion();
    strategyCode = selected.strategyCode;
    version = selected.version;
  }
  actionLoading.value = true;
  try {
    await submitRobotStrategyChange({
      gameCode: props.gameCode,
      strategyCode,
      version,
      action: form.action,
      canaryPercent: form.action === 'CANARY' ? form.canaryPercent : 0,
      reason: form.reason || `${actionLabel(form.action)}申请`
    });
    modal.msgSuccess('变更申请已提交，等待第二管理员审批');
    form.reason = '';
    await load();
    emit('changed');
  } finally {
    actionLoading.value = false;
  }
}

async function approveRequest(row: any) {
  try {
    await modal.confirm(`确认批准并立即执行 ${actionLabel(row.action)}？`);
  } catch {
    return;
  }
  actionLoading.value = true;
  try {
    await approveRobotStrategyChange(row.requestNo);
    modal.msgSuccess('审批通过并已执行');
    await load();
    emit('changed');
  } finally {
    actionLoading.value = false;
  }
}

async function rejectRequest(row: any) {
  let input: any;
  try {
    input = await modal.prompt('请输入拒绝原因');
  } catch {
    return;
  }
  actionLoading.value = true;
  try {
    await rejectRobotStrategyChange(row.requestNo, String(input?.value || '').trim());
    modal.msgSuccess('申请已拒绝');
    await load();
    emit('changed');
  } finally {
    actionLoading.value = false;
  }
}

async function cancelRequest(row: any) {
  actionLoading.value = true;
  try {
    await cancelRobotStrategyChange(row.requestNo);
    modal.msgSuccess('申请已取消');
    await load();
    emit('changed');
  } finally {
    actionLoading.value = false;
  }
}

async function handleEmergencyRollback() {
  try {
    await modal.confirm('紧急回滚将立即撤下当前自动策略，并在下一手回落基线。确认执行？');
  } catch {
    return;
  }
  actionLoading.value = true;
  try {
    await emergencyRollbackRobotStrategy(props.gameCode);
    modal.msgSuccess('已执行紧急回滚并记录审计');
    await load();
    emit('changed');
  } finally {
    actionLoading.value = false;
  }
}

function actionLabel(action: string) {
  if (action === 'CANARY') return '灰度';
  if (action === 'ACTIVATE') return '全量';
  return '回滚基线';
}
function requestStatusType(status: string) {
  if (status === 'EXECUTED') return 'success';
  if (status === 'FAILED' || status === 'REJECTED') return 'danger';
  if (status === 'PENDING' || status === 'EXECUTING') return 'warning';
  return 'info';
}
function requestStatusLabel(status: string) {
  return {
    PENDING: '待审批',
    EXECUTING: '执行中',
    EXECUTED: '已执行',
    REJECTED: '已拒绝',
    FAILED: '执行失败',
    CANCELLED: '已取消'
  }[status] || status || '未知';
}

watch(() => props.gameCode, () => {
  form.versionKey = '';
  load();
});
watch(() => props.refreshToken, (value, previous) => {
  if (value !== previous && props.gameCode) load();
});
onMounted(load);
</script>

<style scoped>
.governance-card { margin-top: 16px; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.card-title { color: var(--el-text-color-primary); font-size: 16px; font-weight: 700; }
.card-subtitle { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.request-form { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 14px; }
.sub-text { color: var(--el-text-color-secondary); font-size: 12px; }
.mb-3 { margin-bottom: 14px; }
</style>
