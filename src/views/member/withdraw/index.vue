<template>
  <div class="p-2 app-container member-withdraw-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="UID" prop="uid">
            <el-input v-model="queryParams.uid" placeholder="用户UID" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="订单号" prop="orderNo">
            <el-input v-model="queryParams.orderNo" placeholder="平台订单号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="(label, value) in withdrawStatusMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="渠道" prop="channel">
            <el-input v-model="queryParams.channel" placeholder="banks/ewallet/crypto/card" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="创建时间" prop="dateRange">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>提现列表</h3>
            <el-tag v-if="queryParams.uid" type="primary" class="ml-1">UID：{{ queryParams.uid }}</el-tag>
            <span v-else class="text-gray-400 text-sm">从用户列表点击累计提现可进入并按 uid 查询</span>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" plain icon="Refresh" @click="handleQuery">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="orderList">
        <el-table-column label="订单号" align="left" prop="orderNo" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="UID" align="center" prop="uid" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.uid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="登录名" align="center" prop="loginName" min-width="120" show-overflow-tooltip />
        <el-table-column label="金额（VND）" align="right" width="150">
          <template #default="{ row }">
            <span class="font-mono">{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="渠道" align="center" prop="channel" min-width="110" show-overflow-tooltip />
        <el-table-column label="通道编码" align="center" prop="bankCode" min-width="110" show-overflow-tooltip />
        <el-table-column label="第三方订单号" align="left" prop="thirdPartyOrderNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="钱包流水" align="center" prop="walletLedgerNo" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="withdrawStatusType(row.status)">{{ withdrawStatusMap[row.status] ?? row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createdAt" width="170">
          <template #default="{ row }">{{ row.createdAt }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="230" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              v-hasPermi="['member:withdraw:edit']"
              link
              type="primary"
              icon="CircleCheck"
              @click="handleAudit(row)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="row.status === 1"
              v-hasPermi="['member:withdraw:edit']"
              link
              type="success"
              icon="Check"
              @click="handleSuccess(row)"
            >
              提现成功
            </el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              v-hasPermi="['member:withdraw:edit']"
              link
              type="danger"
              icon="Close"
              @click="handleCancel(row)"
            >
              取消提现
            </el-button>
            <span v-if="row.status === 2 || row.status === 3 || row.status === 4" class="text-gray-400">-</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="MemberWithdraw" lang="ts">
import {
  auditMemberWithdraw,
  cancelMemberWithdraw,
  listMemberWithdraw,
  successMemberWithdraw
} from '@/api/member/withdraw';
import type { WithdrawOrderQuery, WithdrawOrderVO } from '@/api/member/withdraw/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import modal from '@/plugins/modal';
import { reactive, ref, toRefs, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

/**
 * 提现订单状态（withdraw_order）：
 * 0=APPLIED 待审核；1=WALLET_FROZEN 已审核/待打款；2=PAID 提现成功；
 * 3=REJECTED 已驳回；4=CANCELED 已取消
 */
const withdrawStatusMap: Record<number, string> = {
  0: '待审核',
  1: '已审核/待打款',
  2: '提现成功',
  3: '已驳回',
  4: '已取消'
};

const withdrawStatusType = (status?: number) => {
  if (status === 2) return 'success';
  if (status === 3 || status === 4) return 'danger';
  if (status === 1) return 'warning';
  return 'info';
};

const showSearch = ref(true);
const orderList = ref<WithdrawOrderVO[]>([]);
const total = ref(0);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<{ queryParams: WithdrawOrderQuery }>({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    uid: undefined,
    orderNo: undefined,
    status: undefined,
    channel: undefined,
    bankCode: undefined,
    params: undefined
  }
});
const { queryParams } = toRefs(data);

const formatMoney = (value?: number) => {
  if (value === null || value === undefined) return '0.00';
  return (Number(value)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listMemberWithdraw(applyDateRange(queryParams.value));
    orderList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    resetDateRange();
  },
  afterReset: () => handleQuery()
});

/** 审核通过：后端仅变更订单状态（0待审核 -> 1已审核/待打款） */
const handleAudit = async (row: WithdrawOrderVO) => {
  await modal.confirm('确认审核通过提现单“' + row.orderNo + '”？审核通过仅变更订单状态。');
  await auditMemberWithdraw({ id: row.id as string | number, orderNo: row.orderNo });
  modal.msgSuccess('审核通过');
  await getList();
};

/** 提现成功：预留第三方打款对接，后端当前占位推进状态（1 -> 2） */
const handleSuccess = async (row: WithdrawOrderVO) => {
  await modal.confirm('确认将提现单“' + row.orderNo + '”标记为提现成功？将进入第三方打款流程（当前为占位实现）。');
  await successMemberWithdraw({ id: row.id as string | number, orderNo: row.orderNo });
  modal.msgSuccess('操作成功');
  await getList();
};

/** 取消提现：后端需退回冻结金额并写入 user_wallet_ledger 流水 */
const handleCancel = async (row: WithdrawOrderVO) => {
  await modal.confirm('确认取消提现单“' + row.orderNo + '”？取消后系统将退回金额并写入流水记录。');
  await cancelMemberWithdraw({ id: row.id as string | number, orderNo: row.orderNo });
  modal.msgSuccess('已取消提现并退回');
  await getList();
};

/** 从用户列表带 uid 进入时自动按该用户查询 */
watch(
  () => route.query.uid,
  uid => {
    queryParams.value.uid = uid ? String(uid) : undefined;
    handleQuery();
  },
  { immediate: true }
);
</script>
