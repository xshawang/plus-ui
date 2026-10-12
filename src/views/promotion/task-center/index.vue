<template>
  <div class="p-2 app-container promotion-task-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>任务中心</h3>
            <p>新人福利 / 每日任务 / 每周任务 / 三日神秘任务 / 活跃度；任务奖励统一生成「领取与审核」发放单。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="新人福利" name="newbie" />
        <el-tab-pane label="每日任务" name="daily" />
        <el-tab-pane label="每周任务" name="weekly" />
        <el-tab-pane label="三日神秘任务" name="mystery" />
        <el-tab-pane label="活跃度宝箱" name="box" />
        <el-tab-pane label="活跃度记录" name="pointLog" />
        <el-tab-pane label="剩余活跃度" name="pointSummary" />
      </el-tabs>

      <!-- 任务配置类页签 -->
      <template v-if="isTaskTab">
        <el-alert v-if="resetHint" type="info" :closable="false" class="reset-tip" :title="resetHint" />
        <el-form inline class="query-bar">
          <el-form-item label="任务名称">
            <el-input v-model="query.keyword" placeholder="请输入任务名称/编码" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="toolbar-line">
          <el-button v-hasPermi="['promotion:task:edit']" type="primary" icon="Plus" @click="openForm()">新增任务</el-button>
        </div>
        <el-table v-loading="loading" border :data="rows">
          <el-table-column label="ID" prop="id" align="center" width="90" />
          <el-table-column label="任务编码" prop="code" align="center" width="150" />
          <el-table-column label="任务名称" prop="title" min-width="180" show-overflow-tooltip />
          <el-table-column label="任务目标" prop="targetType" align="center" width="130" />
          <el-table-column label="目标值" prop="targetValue" align="right" width="110" />
          <el-table-column label="奖励金额" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.rewardAmount) }}</template>
          </el-table-column>
          <el-table-column label="额外奖励" align="center" width="140">
            <template #default="{ row }">{{ row.extraRewardType ? `${row.extraRewardType}:${row.extraRewardValue ?? 0}` : '--' }}</template>
          </el-table-column>
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="生效时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ row.validStart || '--' }}</div>
              <div>{{ row.validEnd || '--' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="领取时间" align="center" width="120">
            <template #default="{ row }">{{ claimTimeText(row.claimTimeType) }}</template>
          </el-table-column>
          <el-table-column label="过期天数" prop="claimExpireDays" align="center" width="110" />
          <el-table-column label="加倍奖励" align="center" width="110">
            <template #default="{ row }">
              <el-tag :type="row.doubleRewardFlag === 1 ? 'success' : 'info'">{{ row.doubleRewardFlag === 1 ? '开' : '关' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="(val: number) => toggleTask(row as PromoTaskVO, val)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['promotion:task:edit']" link type="primary" @click="openForm(row as PromoTaskVO)">修改</el-button>
              <el-button v-hasPermi="['promotion:task:edit']" link type="danger" @click="removeTask(row as PromoTaskVO)">删除</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
          <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>

      <!-- 活跃度宝箱（页面级开关 + 规则） -->
      <template v-else-if="activeTab === 'box'">
        <el-form v-loading="box.loading" label-width="200px" class="config-form">
          <el-form-item label="活跃度宝箱开关">
            <el-switch v-model="box.values.box_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="每日任务开关">
            <el-switch v-model="box.values.daily_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="每周任务开关">
            <el-switch v-model="box.values.weekly_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="三日神秘任务开关">
            <el-switch v-model="box.values.mystery_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="活跃度过期天数">
            <el-input-number v-model="box.values.activity_point_expire_days" :min="0" :controls="false" style="width: 200px" />
          </el-form-item>
          <el-form-item label="宝箱规则(JSON)">
            <el-input v-model="box.values.box_rule_json" type="textarea" :rows="3" placeholder='如 {"needPoint":100,"reward":0}' />
          </el-form-item>
          <el-form-item>
            <el-button v-hasPermi="['promotion:config:edit']" type="primary" :loading="box.saving" @click="saveBox">保存设置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 活跃度记录 -->
      <template v-else-if="activeTab === 'pointLog'">
        <el-form inline class="query-bar">
          <el-form-item label="会员账号">
            <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item label="变动类型">
            <el-select v-model="query.changeType" placeholder="全部" clearable style="width: 150px">
              <el-option label="获取" :value="1" />
              <el-option label="消耗" :value="2" />
              <el-option label="过期" :value="3" />
              <el-option label="人工调整" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="rows">
          <el-table-column label="会员ID" prop="uid" align="center" width="130" />
          <el-table-column label="会员账号" prop="account" align="center" width="150" />
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="变动类型" align="center" width="120">
            <template #default="{ row }">{{ changeTypeText(row.changeType) }}</template>
          </el-table-column>
          <el-table-column label="变动值" prop="changePoint" align="right" width="110" />
          <el-table-column label="变动前" prop="beforePoint" align="right" width="110" />
          <el-table-column label="变动后" prop="afterPoint" align="right" width="110" />
          <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
          <el-table-column label="时间" prop="createdAt" align="center" width="170" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>

      <!-- 剩余活跃度 -->
      <template v-else>
        <el-form inline class="query-bar">
          <el-form-item label="会员账号">
            <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 170px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
            <el-button icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="rows">
          <el-table-column label="会员ID" prop="uid" align="center" width="130" />
          <el-table-column label="会员账号" prop="account" align="center" width="150" />
          <el-table-column label="币种" prop="currency" align="center" width="100" />
          <el-table-column label="累计获取" prop="totalEarned" align="right" width="120" />
          <el-table-column label="累计消耗" prop="totalSpent" align="right" width="120" />
          <el-table-column label="累计过期" prop="totalExpired" align="right" width="120" />
          <el-table-column label="剩余活跃度" prop="remainPoint" align="right" width="130" />
          <el-table-column label="过期时间" prop="expireAt" align="center" width="170" />
          <el-table-column label="更新时间" prop="updatedAt" align="center" width="170" />
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadRows" />
      </template>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="820px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="170px">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="form.title" maxlength="100" />
        </el-form-item>
        <el-form-item label="任务归属">
          <el-tag>{{ kindLabel(form.taskKind) }}</el-tag>
        </el-form-item>
        <el-form-item label="任务目标">
          <el-select v-model="form.targetType" filterable allow-create style="width: 220px">
            <el-option label="累计充值" value="累计充值" />
            <el-option label="累计打码" value="累计打码" />
            <el-option label="累计有效投注" value="累计有效投注" />
            <el-option label="每日打码" value="每日打码" />
            <el-option label="登录" value="登录" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标值">
          <el-input-number v-model="form.targetValue" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="奖励金额(分)">
          <el-input-number v-model="form.rewardAmount" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="奖励阶梯(JSON)">
          <el-input v-model="form.tierJson" type="textarea" :rows="3" placeholder='如 [{"amount":10000,"reward":500}]' />
        </el-form-item>
        <el-form-item label="充值方式">
          <el-select v-model="channelValues" multiple clearable placeholder="不选=全选" style="width: 100%">
            <el-option v-for="item in rechargeChannels" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="额外奖励类型">
          <el-select v-model="form.extraRewardType" clearable style="width: 220px">
            <el-option label="活跃度" value="POINT" />
            <el-option label="活跃度宝箱" value="BOX" />
          </el-select>
        </el-form-item>
        <el-form-item label="额外奖励值">
          <el-input-number v-model="form.extraRewardValue" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="额外奖励有效天数">
          <el-input-number v-model="form.extraRewardDays" :min="0" :max="31" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="加倍奖励">
          <el-switch v-model="form.doubleRewardFlag" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="参与层级">
          <el-select v-model="levelValues" multiple clearable placeholder="不选=全选" style="width: 100%">
            <el-option v-for="item in levelOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="领取入口">
          <el-select v-model="terminalValues" multiple clearable style="width: 100%">
            <el-option label="Android_APP" value="ANDROID_APP" />
            <el-option label="IOS_APP" value="IOS_APP" />
            <el-option label="PC" value="PC" />
            <el-option label="Android_H5" value="ANDROID_H5" />
            <el-option label="IOS_H5" value="IOS_H5" />
          </el-select>
        </el-form-item>
        <el-form-item label="同设备号领取次数">
          <el-input-number v-model="form.deviceLimit" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="同浏览器指纹次数">
          <el-input-number v-model="form.fingerprintLimit" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="同IP领取次数">
          <el-input-number v-model="form.ipLimit" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="更多领取限制(JSON)">
          <el-input v-model="form.delayRuleJson" type="textarea" :rows="2" placeholder='如 {"needBankCard":true,"needKyc":true}' />
        </el-form-item>
        <el-form-item label="打码与充值条件(JSON)">
          <el-input v-model="form.betConditionJson" type="textarea" :rows="2" placeholder='如 {"days":30,"betMultiples":3}' />
        </el-form-item>
        <el-form-item label="派发方式">
          <el-select v-model="form.rewardTiming" style="width: 240px">
            <el-option label="玩家自领-过期作废" :value="1" />
            <el-option label="玩家自领-过期自动派发" :value="2" />
            <el-option label="系统立即自动派发" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="领取时间">
          <el-select v-model="form.claimTimeType" style="width: 240px">
            <el-option label="当天实时(影响留存)" value="same_day" />
            <el-option label="次日" value="next_day" />
            <el-option label="下周" value="next_week" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励领取过期天数">
          <el-input-number v-model="form.claimExpireDays" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="form.turnoverMultiple" :min="0" :precision="2" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="validTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="任务说明">
          <el-input v-model="form.ruleDesc" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitForm">确认</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PromotionTaskCenter" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  deletePromoTask,
  getPromoTask,
  listPromoActivityPointLog,
  listPromoActivityPointSummary,
  listPromoTask,
  savePromoTask,
  togglePromoTask
} from '@/api/promotion/task';
import type { PromoTaskForm, PromoTaskQuery, PromoTaskVO } from '@/api/promotion/task/types';
import { usePromoKvConfig } from '@/views/promotion/components/usePromoKvConfig';

/**
 * 任务中心页（需求文档 02）。
 *
 * 设计要点：
 *   ① 新人福利 / 每日 / 每周 / 三日神秘四个页签共用同一配置表与同一表单，靠 taskKind 区分；
 *   ② 活跃度宝箱与任务总开关属于页面级开关，走 KV 配置（task-center 分组）；
 *   ③ 活跃度记录与剩余活跃度只读展示会员模块维护的活跃度数据，后台不直接改额度。
 */
type Row = Record<string, any>;

const TASK_TABS = ['newbie', 'daily', 'weekly', 'mystery'];

const { loading, withLoading } = useLoading();
const { loading: saving, withLoading: withSaving } = useLoading();

const activeTab = ref('newbie');
const rows = ref<Row[]>([]);
const total = ref(0);
const query = reactive<PromoTaskQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10, taskKind: 'newbie' });

const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const form = reactive<PromoTaskForm>({ title: '', taskKind: 'newbie', currency: 'VND', status: 1, sortOrder: 0, tierJson: '[]' });
const validTime = ref<string[]>([]);
const channelValues = ref<string[]>([]);
const levelValues = ref<string[]>([]);
const terminalValues = ref<string[]>([]);
const rechargeChannels = ['扫码转账', 'USDT', '充值卡', '银行转账', 'Zalopay', '电子钱包', 'MoMo'];
const levelOptions = ['默认层级', '首充玩家', '1000k', '10000k', '100000k', '10E', '50E', '100E', '刷子玩家', '套利玩家'];

const box = usePromoKvConfig('task-center', [
  { key: 'box_enabled', label: '活跃度宝箱开关', type: 'switch' },
  { key: 'daily_enabled', label: '每日任务开关', type: 'switch' },
  { key: 'weekly_enabled', label: '每周任务开关', type: 'switch' },
  { key: 'mystery_enabled', label: '三日神秘任务开关', type: 'switch' },
  { key: 'activity_point_expire_days', label: '活跃度过期天数', type: 'number' },
  { key: 'box_rule_json', label: '宝箱规则', type: 'json' }
]);

const isTaskTab = computed(() => TASK_TABS.includes(activeTab.value));
const resetHint = computed(() => {
  if (activeTab.value === 'daily') return '提示：每日任务 00:00 重置';
  if (activeTab.value === 'weekly') return '提示：每周任务 周一 00:00 重置';
  return '';
});

const rules = {
  title: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }]
};

const fmtMoney = (value?: number) =>
  value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

const kindLabel = (kind?: string) =>
  ({ newbie: '新人福利', daily: '每日任务', weekly: '每周任务', mystery: '三日神秘任务' } as Record<string, string>)[kind ?? ''] ?? kind ?? '';

const claimTimeText = (type?: string) =>
  ({ same_day: '当天实时', next_day: '次日', next_week: '下周' } as Record<string, string>)[type ?? ''] ?? '--';

const changeTypeText = (type?: number) =>
  ({ 1: '获取', 2: '消耗', 3: '过期', 4: '人工调整' } as Record<number, string>)[type ?? -1] ?? '未知';

const loadRows = async () => {
  await withLoading(async () => {
    if (activeTab.value === 'pointLog') {
      const res = (await listPromoActivityPointLog(query)) as { rows?: Row[]; total?: number };
      rows.value = res.rows ?? [];
      total.value = res.total ?? 0;
      return;
    }
    if (activeTab.value === 'pointSummary') {
      const res = (await listPromoActivityPointSummary(query)) as { rows?: Row[]; total?: number };
      rows.value = res.rows ?? [];
      total.value = res.total ?? 0;
      return;
    }
    query.taskKind = activeTab.value;
    const res = (await listPromoTask(query)) as { rows?: PromoTaskVO[]; total?: number };
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleTabChange = async () => {
  query.pageNum = 1;
  rows.value = [];
  total.value = 0;
  if (activeTab.value === 'box') {
    await box.load();
    return;
  }
  await loadRows();
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, { pageNum: 1, pageSize: 10, keyword: undefined, status: undefined, account: undefined, changeType: undefined });
  loadRows();
};

const openForm = async (row?: PromoTaskVO) => {
  dialog.title = row ? '修改任务' : '新增任务';
  dialog.visible = true;
  validTime.value = [];
  channelValues.value = [];
  levelValues.value = [];
  terminalValues.value = [];
  if (row) {
    const res = (await getPromoTask(row.id)) as { data?: PromoTaskVO };
    Object.assign(form, res.data ?? row);
    validTime.value = form.validStart && form.validEnd ? [form.validStart, form.validEnd] : [];
    channelValues.value = form.rechargeChannels ? form.rechargeChannels.split(',').filter(Boolean) : [];
    terminalValues.value = form.claimTerminal ? form.claimTerminal.split(',').filter(Boolean) : [];
    levelValues.value = form.audienceParams ? form.audienceParams.split(',').filter(Boolean) : [];
  } else {
    Object.assign(form, {
      id: undefined,
      title: '',
      code: undefined,
      content: '',
      taskKind: activeTab.value,
      targetType: '累计充值',
      targetValue: 0,
      rewardAmount: 0,
      extraRewardValue: 0,
      extraRewardDays: 0,
      doubleRewardFlag: 0,
      deviceLimit: 0,
      fingerprintLimit: 0,
      ipLimit: 0,
      claimExpireDays: 0,
      turnoverMultiple: 0,
      currency: 'VND',
      status: 1,
      sortOrder: 0,
      tierJson: '[]',
      claimTimeType: 'same_day',
      rewardTiming: 1
    });
  }
};

const submitForm = async () => {
  await formRef.value.validate();
  form.validStart = validTime.value?.[0];
  form.validEnd = validTime.value?.[1];
  form.rechargeChannels = channelValues.value.join(',');
  form.claimTerminal = terminalValues.value.join(',');
  form.audienceParams = levelValues.value.join(',');
  await withSaving(async () => {
    await savePromoTask(form);
  });
  modal.msgSuccess('保存成功');
  dialog.visible = false;
  await loadRows();
};

const toggleTask = async (row: PromoTaskVO, status: number) => {
  await togglePromoTask(row.id, status);
  modal.msgSuccess(status === 1 ? '任务已启用' : '任务已停用');
  await loadRows();
};

const removeTask = async (row: PromoTaskVO) => {
  await modal.confirm(`确认删除任务「${row.title}」？删除为逻辑删除，历史进度与发放单仍可追溯。`);
  await deletePromoTask(row.id);
  modal.msgSuccess('删除成功');
  await loadRows();
};

const saveBox = async () => {
  await box.save();
  modal.msgSuccess('保存成功');
  await box.load();
};

onMounted(async () => {
  await loadRows();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
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

.query-bar {
  margin-top: 8px;
}

.toolbar-line {
  margin: 8px 0;
}

.reset-tip {
  margin: 8px 0;
}

.config-form {
  max-width: 900px;
  margin-top: 12px;
}
</style>
