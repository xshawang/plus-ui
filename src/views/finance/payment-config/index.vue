<template>
  <div class="p-2 app-container finance-payment-config-page">
    <el-card shadow="hover">
      <el-alert
        title="充值维护已统一到「充值大类与通道」：大类开关控制整类，通道开关控制具体渠道。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <div class="toolbar-shell mb-2">
          <div class="table-heading">
            <h3>提现额度档位（lcw）</h3>
            <p>按客户端 lcw 原始值维护：-1 不限，其余为 VND 展示额度。</p>
          </div>
          <el-button icon="Refresh" @click="load">刷新</el-button>
        </div>
        <el-table v-loading="loading" border :data="limitRows">
          <el-table-column label="档位编码" prop="tierCode" width="150" />
          <el-table-column label="名称" prop="tierName" min-width="170" />
          <el-table-column label="lcw 值" prop="limitValue" width="180" align="right">
            <template #default="{ row }">{{ Number(row.limitValue) < 0 ? '不限' : formatMoney(row.limitValue) }}</template>
          </el-table-column>
          <el-table-column label="排序" prop="sortOrder" width="90" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updatedAt" width="170" />
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['finance:paymentlimit:edit']" link type="primary" @click="openLimitEdit(row as PaymentLimitTierVO)">
                修改
              </el-button>
            </template>
          </el-table-column>
        </el-table>
    </el-card>

    <el-dialog v-model="limitEditVisible" title="修改提现额度档位" width="480px" append-to-body destroy-on-close>
      <el-form :model="limitForm" label-width="120px">
        <el-form-item label="档位">
          <el-input :model-value="`${limitForm.tierCode} · ${limitForm.tierName}`" disabled />
        </el-form-item>
        <el-form-item label="lcw 值">
          <el-input-number v-model="limitForm.limitValue" :min="-1" :precision="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="limitForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveLimit">保存</el-button>
        <el-button @click="limitEditVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinancePaymentConfig" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import { formatMoney } from '@/utils/money';
import {
  listPaymentLimitTiers,
  updatePaymentLimitTier
} from '@/api/finance/payment-config';
import type { PaymentLimitTierVO } from '@/api/finance/payment-config';

const loading = ref(false);
const limitRows = ref<PaymentLimitTierVO[]>([]);
const limitEditVisible = ref(false);
const limitForm = reactive<PaymentLimitTierVO>({} as PaymentLimitTierVO);

const load = async () => {
  loading.value = true;
  try {
    const res = await listPaymentLimitTiers();
    limitRows.value = (res as unknown as { data?: PaymentLimitTierVO[] }).data ?? [];
  } finally {
    loading.value = false;
  }
};

const openLimitEdit = (row: PaymentLimitTierVO) => {
  Object.assign(limitForm, row);
  limitEditVisible.value = true;
};

const saveLimit = async () => {
  await updatePaymentLimitTier({ ...limitForm } as PaymentLimitTierVO);
  modal.msgSuccess('保存成功');
  limitEditVisible.value = false;
  load();
};

onMounted(load);
</script>
