<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-2">
      <el-tabs v-model="status" @tab-change="search">
        <el-tab-pane v-for="t in tabs" :key="t.value" :label="t.label" :name="t.value" />
      </el-tabs>
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="q.dateType" style="width: 110px">
            <el-option label="结算日期" value="1" />
            <el-option label="领取时间" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" range-separator="-" style="width: 250px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="q.accounts" placeholder="代理账号（支持批量）" clearable style="width: 220px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="q.orderNo" placeholder="订单号" clearable style="width: 190px" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.levelNo" placeholder="全部等级" clearable style="width: 110px">
            <el-option v-for="n in 20" :key="n" :label="`LV${n}`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.settlePeriod" placeholder="全部周期" clearable style="width: 110px">
            <el-option v-for="(v, k) in PERIOD_MAP" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.amountField" style="width: 110px">
            <el-option label="修改后" value="afterAmount" />
            <el-option label="修改前" value="beforeAmount" />
            <el-option label="应发" value="settleCommission" />
          </el-select>
          <el-input-number v-model="minYuan" :min="0" :controls="false" placeholder="最小(元)" style="width: 100px; margin-left: 4px" />
          <span class="mx-1">-</span>
          <el-input-number v-model="maxYuan" :min="0" :controls="false" placeholder="最大(元)" style="width: 100px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <div class="toolbar">
        <template v-if="status === '1'">
          <el-button v-hasPermi="['agent:commission:audit']" type="primary" :disabled="!selected.length" @click="op('audit')">审核通过</el-button>
          <el-button v-hasPermi="['agent:commission:audit']" type="danger" plain :disabled="!selected.length" @click="op('reject')">拒绝</el-button>
        </template>
        <el-button v-if="status === '2'" v-hasPermi="['agent:commission:revoke']" type="warning" :disabled="!selected.length" @click="op('revoke')">
          撤回
        </el-button>
        <span class="text-gray-500">已选择 {{ selected.length }} 条</span>
      </div>
      <el-table v-loading="loading" border :data="rows" row-key="orderNo" show-summary :summary-method="pageSummary" @selection-change="(s: any[]) => (selected = s)">
        <el-table-column type="selection" width="44" align="center" />
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="订单号" align="center" width="190">
          <template #default="{ row }"><el-link type="primary" @click="openDetail(row)">{{ row.orderNo }}</el-link></template>
        </el-table-column>
        <el-table-column label="结算日期" prop="settleDate" align="center" width="110" />
        <el-table-column label="代理ID" prop="agentId" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="代理账号" align="center" min-width="130">
          <template #default="{ row }">
            <span>{{ row.loginName }}</span> <el-tag size="small" type="info">LV{{ row.levelNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="代理类型" align="center" width="90">
          <template #default="{ row }">{{ LINE_MAP[String(row.agentType) as '1' | '2'] ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="代理模式" prop="modeName" align="center" min-width="110" />
        <el-table-column label="周期" align="center" width="80">
          <template #default="{ row }">{{ PERIOD_MAP[String(row.settlePeriod) as '1'] ?? row.settlePeriod }}</template>
        </el-table-column>
        <el-table-column label="修改前" prop="beforeAmount" align="center" width="110">
          <template #default="{ row }">{{ money(row.beforeAmount) }}</template>
        </el-table-column>
        <el-table-column label="修改后" prop="afterAmount" align="center" width="110">
          <template #default="{ row }">{{ money(row.afterAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ ORDER_STATUS_MAP[String(row.status) as '1'] }}</el-tag>
            <el-tag v-if="Number(row.locked) === 1" type="danger" size="small" class="ml-1">锁</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待审核原因" prop="auditReason" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="领取时间" prop="claimedAt" align="center" width="170" />
        <el-table-column label="后台备注" prop="adminRemark" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-if="[1, 2].includes(Number(row.status))" v-hasPermi="['agent:commission:adjust']" link type="primary" @click="openAdjust(row)">
              调整
            </el-button>
            <el-button link type="primary" @click="openDetail(row)">明细</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" />
      </el-table>
      <div class="summary-bar">
        <span class="font-bold">总计</span>
        <template v-if="totals">
          <span>单数：{{ totals.orderCount }}</span>
          <span>修改前：{{ money(totals.beforeAmount) }}</span>
          <span>修改后：{{ money(totals.afterAmount) }}</span>
          <span>应发：{{ money(totals.settleCommission) }}</span>
          <span>实发：{{ money(totals.actualCommission) }}</span>
        </template>
        <el-button v-else link type="primary" @click="loadTotals">点击计算总计</el-button>
      </div>
      <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="adjustVisible" title="调整佣金" width="420px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="订单号">{{ adjustRow?.orderNo }}</el-form-item>
        <el-form-item label="当前实发">{{ money(adjustRow?.actualCommission) }}</el-form-item>
        <el-form-item label="调整后(元)">
          <el-input-number v-model="adjustYuan" :min="0" :precision="2" :controls="false" style="width: 200px" />
        </el-form-item>
        <el-form-item label="备注" required>
          <el-input v-model="adjustRemark" type="textarea" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确认</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" :title="`佣金单明细 ${detail?.orderNo ?? ''}`" size="70%" destroy-on-close>
      <el-descriptions v-if="detail" :column="4" border size="small">
        <el-descriptions-item label="代理">{{ detail.loginName }}</el-descriptions-item>
        <el-descriptions-item label="周期">{{ detail.periodStart }} ~ {{ detail.periodEnd }}</el-descriptions-item>
        <el-descriptions-item label="直属业绩">{{ money(detail.directPerf) }}</el-descriptions-item>
        <el-descriptions-item label="其他业绩">{{ money(detail.otherPerf) }}</el-descriptions-item>
        <el-descriptions-item label="直属佣金">{{ money(detail.directCommission) }}</el-descriptions-item>
        <el-descriptions-item label="其他佣金">{{ money(detail.otherCommission) }}</el-descriptions-item>
        <el-descriptions-item label="奖励佣金">{{ money(detail.bonusCommission) }}</el-descriptions-item>
        <el-descriptions-item label="上限截断">{{ money(detail.capCut) }}</el-descriptions-item>
        <el-descriptions-item label="应发">{{ money(detail.settleCommission) }}</el-descriptions-item>
        <el-descriptions-item label="实发">{{ money(detail.actualCommission) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ ORDER_STATUS_MAP[String(detail.status) as '1'] }}</el-descriptions-item>
        <el-descriptions-item label="领取单号">{{ detail.claimNo || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail?.details ?? []" border size="small" class="mt-2" max-height="520" empty-text="暂无明细">
        <el-table-column label="来源" align="center" width="120">
          <template #default="{ row }">{{ SOURCE_MAP[row.sourceType] ?? row.sourceType }}</template>
        </el-table-column>
        <el-table-column label="大类" prop="categoryName" align="center" width="90" />
        <el-table-column label="来源会员" prop="sourceUid" align="center" width="150" />
        <el-table-column label="关系" align="center" width="80">
          <template #default="{ row }">{{ Number(row.relationDepth) <= 1 ? '直属' : `第${row.relationDepth}层` }}</template>
        </el-table-column>
        <el-table-column label="业绩基数" align="center" width="110"><template #default="{ row }">{{ money(row.baseAmount) }}</template></el-table-column>
        <el-table-column label="有效人数" prop="validMembers" align="center" width="80" />
        <el-table-column label="档位" align="center" width="120">
          <template #default="{ row }">{{ row.tierSeq ? `第${row.tierSeq}档 ≥${money(row.tierThreshold)}` : '—' }}</template>
        </el-table-column>
        <el-table-column label="自身比例" align="center" width="90"><template #default="{ row }">{{ pct(row.selfRate) }}</template></el-table-column>
        <el-table-column label="扣减下方" align="center" width="90"><template #default="{ row }">{{ pct(row.lowerUsedRate) }}</template></el-table-column>
        <el-table-column label="佣金" align="center" width="110"><template #default="{ row }">{{ money(row.commissionAmount) }}</template></el-table-column>
        <el-table-column label="公式快照" prop="formulaJson" align="center" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup name="AgentCommission" lang="ts">
import { ref } from 'vue';
import modal from '@/plugins/modal';
import { ElMessageBox } from 'element-plus';
import {
  adjustCommission,
  auditCommissions,
  getCommissionDetail,
  getCommissionSummary,
  listCommissions,
  rejectCommissions,
  revokeCommissions
} from '@/api/agent/refactor';
import { LINE_MAP, ORDER_STATUS_MAP, PERIOD_MAP } from '../components/reportColumns';

/**
 * 佣金管理（方案 §7.4）：6 个状态页签；待审核可通过/拒绝，待领取可撤回，待审核/待领取可调整；
 * 订单号下钻到全部来源明细（直属/极差/首充/截断/调整/冲回）。金额输入为元，提交前换算为分。
 */
const tabs = [
  { label: '待审核', value: '1' },
  { label: '已撤回', value: '5' },
  { label: '待领取', value: '2' },
  { label: '已拒绝', value: '4' },
  { label: '已领取', value: '3' },
  { label: '已过期', value: '6' },
  { label: '全部记录', value: '0' }
];
const SOURCE_MAP: Record<string, string> = {
  '11': '直属返佣',
  '12': '极差返佣',
  '13': '净盈利返佣',
  '14': '额外返佣',
  '21': '首充人头',
  '22': '固定金额',
  '31': '周期补差',
  '41': '上限截断',
  '51': '后台调整',
  '52': '撤回冲回'
};

const status = ref('1');
const range = ref<[string, string] | null>(null);
const q = ref<Record<string, any>>({ dateType: '1', amountField: 'afterAmount' });
const minYuan = ref<number>();
const maxYuan = ref<number>();
const rows = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const selected = ref<any[]>([]);
const totals = ref<any>(null);
const adjustVisible = ref(false);
const adjustRow = ref<any>(null);
const adjustYuan = ref<number>(0);
const adjustRemark = ref('');
const detailVisible = ref(false);
const detail = ref<any>(null);

const money = (v: any) => (Number(v ?? 0) / 100).toFixed(2);
const pct = (v: any) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(4)}%`);
const statusType = (s: any) => (({ 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger', 5: 'info', 6: 'info' }) as any)[Number(s)];

const params = () => ({
  ...q.value,
  status: status.value,
  beginDate: range.value?.[0],
  endDate: range.value?.[1],
  minAmount: minYuan.value === undefined || minYuan.value === null ? undefined : Math.round(minYuan.value * 100),
  maxAmount: maxYuan.value === undefined || maxYuan.value === null ? undefined : Math.round(maxYuan.value * 100)
});

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listCommissions({ ...params(), pageNum: pageNum.value, pageSize: pageSize.value });
    rows.value = res?.rows ?? [];
    total.value = res?.total ?? 0;
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const search = () => {
  pageNum.value = 1;
  totals.value = null;
  selected.value = [];
  load();
};

const reset = () => {
  q.value = { dateType: '1', amountField: 'afterAmount' };
  range.value = null;
  minYuan.value = undefined;
  maxYuan.value = undefined;
  search();
};

const loadTotals = async () => {
  const res: any = await getCommissionSummary(params());
  totals.value = res?.data ?? {};
};

const pageSummary = ({ columns }: { columns: any[] }) =>
  columns.map((c: any, i: number) => {
    if (i === 1) {
      return '小计';
    }
    if (c.property === 'beforeAmount' || c.property === 'afterAmount') {
      return money(rows.value.reduce((a, r) => a + Number(r[c.property] ?? 0), 0));
    }
    return '';
  });

/** 批量操作：拒绝、撤回必须填备注；结果逐单返回，失败单列出原因 */
const op = async (kind: 'audit' | 'reject' | 'revoke') => {
  const nos = selected.value.map((r) => String(r.orderNo));
  const title = { audit: '审核通过', reject: '拒绝', revoke: '撤回' }[kind];
  let remark = '';
  try {
    const r: any = await ElMessageBox.prompt(`对已选 ${nos.length} 张佣金单执行「${title}」，请填写备注`, title, {
      inputPattern: kind === 'audit' ? /.*/ : /\S+/,
      inputErrorMessage: '请填写备注'
    });
    remark = r.value ?? '';
  } catch {
    return;
  }
  const fn = kind === 'audit' ? auditCommissions : kind === 'reject' ? rejectCommissions : revokeCommissions;
  const res: any = await fn(nos, remark);
  const data = res?.data ?? {};
  if (data.failed?.length) {
    modal.alert(`成功 ${data.success} 单，失败 ${data.failed.length} 单：\n${data.failed.join('\n')}`);
  } else {
    modal.msgSuccess(`成功 ${data.success} 单`);
  }
  load();
};

const openAdjust = (row: any) => {
  adjustRow.value = row;
  adjustYuan.value = Number(row.actualCommission ?? 0) / 100;
  adjustRemark.value = '';
  adjustVisible.value = true;
};

const submitAdjust = async () => {
  if (!adjustRemark.value.trim()) {
    modal.msgWarning('请填写备注');
    return;
  }
  await adjustCommission(String(adjustRow.value.orderNo), Math.round(adjustYuan.value * 100), adjustRemark.value.trim());
  modal.msgSuccess('调整成功');
  adjustVisible.value = false;
  load();
};

const openDetail = async (row: any) => {
  const res: any = await getCommissionDetail(String(row.orderNo));
  detail.value = res?.data ?? null;
  detailVisible.value = true;
};

load();
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  font-size: 13px;
}
</style>
