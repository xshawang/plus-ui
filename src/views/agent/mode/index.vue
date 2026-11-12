<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-2">
      <el-form :inline="true">
        <el-form-item><el-input v-model="q.modeName" placeholder="模式名称" clearable style="width: 180px" /></el-form-item>
        <el-form-item>
          <el-select v-model="q.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.settlePeriod" placeholder="全部周期" clearable style="width: 120px">
            <el-option v-for="(v, k) in PERIOD_MAP" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button v-hasPermi="['agent:mode:edit']" type="success" icon="Plus" @click="openEdit()">新增代理模式</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <el-table v-loading="loading" border :data="rows" row-key="modeId">
        <el-table-column label="ID" prop="modeId" align="center" width="110" />
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="名称" align="center" min-width="140">
          <template #default="{ row }">
            {{ row.modeName }} <el-tag v-if="Number(row.isDefault) === 1" size="small" type="success">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用代理" align="center" width="110">
          <template #default="{ row }">{{ SCOPE_MAP[String(row.lineScope)] ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="80">
          <template #default="{ row }">{{ Number(row.source) === 1 ? '系统' : '自定义' }}</template>
        </el-table-column>
        <el-table-column label="结算周期" align="center" width="100">
          <template #default="{ row }">{{ PERIOD_MAP[String(row.settlePeriod) as '1'] ?? '—' }}{{ Number(row.settlePeriod) === 4 ? `(${row.customDays}天)` : '' }}</template>
        </el-table-column>
        <el-table-column label="计算依据" align="center" width="100">
          <template #default="{ row }">{{ Number(row.calcBasis) === 2 ? '净盈利' : '有效投注' }}</template>
        </el-table-column>
        <el-table-column label="计算层数" align="center" width="90">
          <template #default="{ row }">{{ Number(row.calcDepth) === 0 ? '不限' : row.calcDepth }}</template>
        </el-table-column>
        <el-table-column label="奖励维度" align="center" width="110">
          <template #default="{ row }">{{ dims(row.rewardDims) }}</template>
        </el-table-column>
        <el-table-column label="超出部分额外返佣" align="center" width="130">
          <template #default="{ row }">{{ Number(row.extraRebateEnable) === 1 ? `开（${row.extraRebateRatio}%）` : '关' }}</template>
        </el-table-column>
        <el-table-column label="启用" align="center" width="80">
          <template #default="{ row }">
            <el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" :disabled="Number(row.isDefault) === 1" @change="(v: any) => toggle(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="上周期结算时间" prop="lastSettleAt" align="center" width="170" />
        <el-table-column label="已使用人数" prop="usedCount" align="center" width="100" />
        <el-table-column label="备注" prop="remark" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="190" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['agent:mode:edit']" link type="primary" @click="openEdit(row)">修改</el-button>
            <el-button link type="primary" @click="openTier(row)">返佣设置</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        <el-table-column label="操作时间" prop="updatedAt" align="center" width="170" />
      </el-table>
    </el-card>

    <el-dialog v-model="editVisible" :title="form.modeId ? '修改代理模式' : '新增代理模式'" width="640px" append-to-body>
      <el-form label-width="170px">
        <el-form-item label="模式名称" required><el-input v-model="form.modeName" maxlength="64" /></el-form-item>
        <el-form-item label="适用代理">
          <el-radio-group v-model="form.lineScope">
            <el-radio :value="1">人人代理</el-radio>
            <el-radio :value="2">专业代理</el-radio>
            <el-radio :value="3">两者</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="结算周期">
          <el-radio-group v-model="form.settlePeriod">
            <el-radio v-for="(v, k) in PERIOD_MAP" :key="k" :value="Number(k)">{{ v }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.settlePeriod === 4" label="自定义：天数 / 起始日">
          <el-input-number v-model="form.customDays" :min="1" :max="90" style="width: 120px" />
          <el-date-picker v-model="form.customStartDate" type="date" value-format="YYYY-MM-DD" class="ml-2" style="width: 160px" />
        </el-form-item>
        <el-form-item label="计算依据">
          <el-radio-group v-model="form.calcBasis">
            <el-radio :value="1">有效投注</el-radio>
            <el-radio :value="2" disabled>净盈利（P2 开放）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计算层数（0 不限）">
          <el-input-number v-model="form.calcDepth" :min="0" :max="99" :disabled="form.lineScope === 1" />
          <span class="tip ml-2">人人代理固定 1 层</span>
        </el-form-item>
        <el-form-item label="业绩范围">
          <el-radio-group v-model="form.perfScope">
            <el-radio :value="1">全部会员</el-radio>
            <el-radio :value="2">只计有效会员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="奖励维度">
          <el-checkbox-group v-model="dimList">
            <el-checkbox :value="1">投注阶梯返佣</el-checkbox>
            <el-checkbox :value="2">首充人头奖励</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="dimList.includes(2)" label="首充计入门槛">
          <el-input-number v-model="form.minFirstDepositYuan" :min="0" :controls="false" />
        </el-form-item>
        <el-form-item label="超出部分额外返佣">
          <el-switch v-model="form.extraRebateEnable" :active-value="1" :inactive-value="0" />
          <el-input-number v-if="form.extraRebateEnable === 1" v-model="form.extraRebateRatio" :min="0" :max="100" :precision="2" class="ml-2" />
          <span class="tip ml-2">比例中的比例，跨级部分由站长承担</span>
        </el-form-item>
        <el-form-item label="周期内预发 / 期末补差">
          <el-switch v-model="form.prepayEnable" :active-value="1" :inactive-value="0" disabled />
          <span class="tip ml-2">P2 开放</span>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" maxlength="255" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确认</el-button>
      </template>
    </el-dialog>

    <ModeTierDialog
      v-model:visible="tierVisible"
      :mode-id="tierRow?.modeId"
      :mode-name="tierRow?.modeName"
      :with-first-deposit="(Number(tierRow?.rewardDims ?? 1) & 2) === 2"
    />
  </div>
</template>

<script setup name="AgentMode" lang="ts">
import { ref } from 'vue';
import modal from '@/plugins/modal';
import { changeModeStatus, listModes, saveMode } from '@/api/agent/refactor';
import { PERIOD_MAP } from '../components/reportColumns';
import ModeTierDialog from './ModeTierDialog.vue';

/**
 * 代理模式（方案 §5）：模式列表、新增/修改（新增时复制默认模式的阶梯模板）、启停（默认模式不可停用）、返佣设置。
 * reward_dims 为位标记：1 投注阶梯 2 首充人头；所有改动从下一结算周期生效。
 */
const SCOPE_MAP: Record<string, string> = { '1': '人人代理', '2': '专业代理', '3': '两者' };

const q = ref<Record<string, any>>({});
const rows = ref<any[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const form = ref<Record<string, any>>({});
const dimList = ref<number[]>([1]);
const tierVisible = ref(false);
const tierRow = ref<any>(null);

const dims = (v: any) => {
  const n = Number(v ?? 1);
  return [n & 1 ? '投注' : '', n & 2 ? '首充' : ''].filter(Boolean).join(' + ') || '—';
};

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listModes(q.value);
    rows.value = res?.data ?? [];
  } finally {
    loading.value = false;
  }
};

const openEdit = (row?: any) => {
  const r = row ?? { lineScope: 3, settlePeriod: 1, calcBasis: 1, calcDepth: 0, perfScope: 1, rewardDims: 1, extraRebateEnable: 0, prepayEnable: 0 };
  form.value = {
    ...r,
    lineScope: Number(r.lineScope ?? 3),
    settlePeriod: Number(r.settlePeriod ?? 1),
    calcBasis: Number(r.calcBasis ?? 1),
    calcDepth: Number(r.calcDepth ?? 0),
    perfScope: Number(r.perfScope ?? 1),
    extraRebateEnable: Number(r.extraRebateEnable ?? 0),
    extraRebateRatio: Number(r.extraRebateRatio ?? 0),
    customDays: r.customDays ? Number(r.customDays) : undefined,
    minFirstDepositYuan: Number(r.minFirstDeposit ?? 10000)
  };
  const n = Number(r.rewardDims ?? 1);
  dimList.value = [n & 1 ? 1 : 0, n & 2 ? 2 : 0].filter(Boolean);
  editVisible.value = true;
};

const submit = async () => {
  if (!String(form.value.modeName ?? '').trim()) {
    modal.msgWarning('请输入模式名称');
    return;
  }
  const f = form.value;
  const body: Record<string, any> = {
    modeId: f.modeId,
    modeName: String(f.modeName).trim(),
    lineScope: f.lineScope,
    settlePeriod: f.settlePeriod,
    customDays: f.settlePeriod === 4 ? f.customDays : undefined,
    customStartDate: f.settlePeriod === 4 ? f.customStartDate : undefined,
    calcBasis: f.calcBasis,
    calcDepth: f.lineScope === 1 ? 1 : f.calcDepth,
    perfScope: f.perfScope,
    rewardDims: dimList.value.reduce((a, b) => a | b, 0) || 1,
    minFirstDeposit: f.minFirstDepositYuan,
    extraRebateEnable: f.extraRebateEnable,
    extraRebateRatio: f.extraRebateRatio,
    remark: f.remark ?? ''
  };
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  await saveMode(body);
  modal.msgSuccess(f.modeId ? '已修改（下一结算周期生效）' : '已新增，已复制默认模式的返佣阶梯，请到“返佣设置”调整');
  editVisible.value = false;
  load();
};

const toggle = async (row: any, v: number) => {
  await changeModeStatus(row.modeId, v);
  modal.msgSuccess(v === 1 ? '已启用' : '已停用');
  load();
};

const openTier = (row: any) => {
  tierRow.value = row;
  tierVisible.value = true;
};

load();
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 12px;
}
</style>
