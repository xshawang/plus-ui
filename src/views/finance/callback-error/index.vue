<template>
  <div class="p-2 app-container finance-callback-error-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="订单号模糊" clearable style="width: 190px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input v-model="uidInput" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="query.handleStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="未处理" :value="0" />
            <el-option label="已补单" :value="1" />
            <el-option label="已忽略" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="验签">
          <el-select v-model="query.signOk" placeholder="全部" clearable style="width: 140px">
            <el-option label="验签通过" :value="1" />
            <el-option label="验签失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：数据源 callback_log（三方回调原始记录）。「强制补单」会按订单金额真实入账（钱包 deposit，bizNo=RC:订单号，幂等）；
        「忽略」只标记处理结果、不动资金。已处理的记录不可重复处理。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>回调异常订单</h3>
            <p>共 {{ total }} 条</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="load">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="记录ID" prop="id" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="订单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="三方编码" prop="providerCode" align="center" width="110" />
        <el-table-column label="验签" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="(row as CallbackErrorVO).signOk === 1 ? 'success' : 'danger'">
              {{ (row as CallbackErrorVO).signOk === 1 ? '通过' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回调状态" prop="callbackStatus" align="center" width="100" />
        <el-table-column label="重试次数" prop="retryCount" align="center" width="100" />
        <el-table-column label="处理状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="handleType((row as CallbackErrorVO).handleStatus)">{{ handleText((row as CallbackErrorVO).handleStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" prop="handleOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="处理备注" prop="handleRemark" align="left" min-width="140" show-overflow-tooltip />
        <el-table-column label="接收时间" prop="receivedAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="报文摘要" prop="payloadPreview" align="left" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="190">
          <template #default="{ row }">
            <template v-if="!((row as CallbackErrorVO).handleStatus)">
              <el-button v-hasPermi="['finance:callback-error:edit']" link type="primary" @click="handle(row as CallbackErrorVO, 1)">强制补单</el-button>
              <el-button v-hasPermi="['finance:callback-error:edit']" link type="info" @click="handle(row as CallbackErrorVO, 2)">忽略</el-button>
            </template>
            <span v-else class="text-gray-400">已处理</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>
  </div>
</template>

<script setup name="FinanceCallbackError" lang="ts">
import { reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import { handleCallbackError, listCallbackErrors } from '@/api/finance/recharge-admin';
import type { CallbackErrorVO, RechargeAdminQuery } from '@/api/finance/recharge-admin';

/**
 * 回调异常订单页（需求文档 2_财务/04）。
 *
 * 覆盖：异常回调列表（验签/处理状态筛选）、强制补单（真实入账）、忽略、报文摘要查看。
 */
const loading = ref(false);
const rows = ref<CallbackErrorVO[]>([]);
const total = ref(0);
const uidInput = ref<string>('');
const dateRange = ref<[string, string] | undefined>();

const query = reactive<RechargeAdminQuery>({
  orderNo: '',
  handleStatus: undefined,
  signOk: undefined,
  pageNum: 1,
  pageSize: 10
});

function handleText(status?: number) {
  return status === 1 ? '已补单' : status === 2 ? '已忽略' : '未处理';
}

function handleType(status?: number) {
  return status === 1 ? 'success' : status === 2 ? 'info' : 'warning';
}

const load = async () => {
  loading.value = true;
  try {
    const params: RechargeAdminQuery = { ...query };
    if (uidInput.value && /^\d+$/.test(uidInput.value.trim())) {
      params.uid = Number(uidInput.value.trim());
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
    }
    const res = await listCallbackErrors(params);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.orderNo = '';
  query.handleStatus = undefined;
  query.signOk = undefined;
  uidInput.value = '';
  dateRange.value = undefined;
  query.pageNum = 1;
  load();
};

const handle = async (row: CallbackErrorVO, handleStatus: number) => {
  if (handleStatus === 1) {
    await modal.confirm(`确认对订单 ${row.orderNo} 强制补单（按订单金额真实入账）？已入账订单会被拒绝。`);
  } else {
    await modal.confirm(`确认忽略该回调异常？仅标记处理结果，不涉及资金。`);
  }
  const result = await modal.prompt(handleStatus === 1 ? '请输入补单说明（可选）' : '请输入忽略原因（可选）');
  await handleCallbackError(row.id, handleStatus, String(result.value ?? ''));
  modal.msgSuccess(handleStatus === 1 ? '补单完成' : '已忽略');
  load();
};

load();
</script>
