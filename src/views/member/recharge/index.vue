<template>
  <div class="p-2 app-container member-recharge-page">
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
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="(label, value) in orderStatusMap" :key="value" :label="label" :value="Number(value)" />
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
            <h3>充值列表</h3>
            <el-tag v-if="queryParams.uid" type="primary" class="ml-1">UID：{{ queryParams.uid }}</el-tag>
            <span v-else class="text-gray-400 text-sm">从用户列表点击累计充值可进入并按 uid 查询</span>
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
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusType(row.status)">{{ orderStatusMap[row.status] ?? row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回调时间" align="center" prop="callbackAt" width="170">
          <template #default="{ row }">{{ row.callbackAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createdAt" width="170">
          <template #default="{ row }">{{ row.createdAt }}</template>
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

<script setup name="MemberRecharge" lang="ts">
import { listMemberRecharge } from '@/api/member/order';
import type { MemberOrderQuery, MemberOrderVO } from '@/api/member/order/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { reactive, ref, toRefs, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

/** 订单状态：0待支付 1处理中 2成功 3失败 4已取消 */
const orderStatusMap: Record<number, string> = {
  0: '待支付',
  1: '处理中',
  2: '成功',
  3: '失败',
  4: '已取消'
};

const orderStatusType = (status?: number) => {
  if (status === 2) return 'success';
  if (status === 3) return 'danger';
  if (status === 4) return 'info';
  if (status === 1) return 'warning';
  return 'info';
};

const showSearch = ref(true);
const orderList = ref<MemberOrderVO[]>([]);
const total = ref(0);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<{ queryParams: MemberOrderQuery }>({
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
    const res = await listMemberRecharge(applyDateRange(queryParams.value));
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
