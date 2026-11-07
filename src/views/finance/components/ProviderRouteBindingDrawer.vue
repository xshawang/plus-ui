<template>
  <el-drawer
    v-model="visible"
    :title="`三方供应商路由 - ${businessLabel || businessRefId || ''}`"
    size="98vw"
    append-to-body
    destroy-on-close
  >
    <el-alert
      v-if="!businessRefId"
      title="请先保存业务通道后再配置三方供应商"
      type="warning"
      :closable="false"
      show-icon
    />
    <template v-else>
      <div class="drawer-toolbar">
        <div>
          <strong>{{ scene === 'PAYOUT' ? '提现代付候选' : '充值代收候选' }}</strong>
          <span>同一业务路由可绑定多个供应商通道，按权重稳定分流。</span>
        </div>
        <div>
          <el-tag type="info">总权重 {{ totalWeight }} / 10000</el-tag>
          <el-button type="primary" icon="Plus" @click="openProviderAccount">新增候选</el-button>
          <el-button icon="Refresh" @click="loadAll">刷新</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="candidates" border size="small">
        <el-table-column label="供应商 / 商户" min-width="155" align="left" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ providerNameByChannel(row.providerChannelId) }}</div>
            <div class="muted">{{ merchantLabel(row as RouteCandidateVO) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="通道编码" min-width="155">
          <template #default="{ row }">
            <div>{{ channelCode(row as RouteCandidateVO) }}</div>
            <div class="muted">ID {{ row.providerChannelId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="银行名称 / 编码" min-width="190">
          <template #default="{ row }">
            <div>{{ bankName(row as RouteCandidateVO) }}</div>
            <div class="muted">{{ row.bankCode || '未配置银行编码' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最低金额" width="132" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.amountMin"
              :min="0"
              size="small"
              controls-position="right"
              @change="saveInline(row as RouteCandidateVO)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最高金额" width="132" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.amountMax"
              :min="0"
              size="small"
              controls-position="right"
              @change="saveInline(row as RouteCandidateVO)"
            />
          </template>
        </el-table-column>
        <el-table-column label="权重" width="118" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.weightBp"
              :min="0"
              :max="10000"
              size="small"
              controls-position="right"
              @change="saveInline(row as RouteCandidateVO)"
            />
            <span class="muted ml-1">{{ (Number(row.weightBp || 0) / 100).toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="88" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.priorityNo"
              :min="0"
              size="small"
              controls-position="right"
              @change="saveInline(row as RouteCandidateVO)"
            />
          </template>
        </el-table-column>
        <el-table-column label="自动摘流至" prop="autoDisabledUntil" min-width="145" show-overflow-tooltip />
        <el-table-column label="启用" width="68" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-value="1"
              :inactive-value="0"
              @change="saveInline(row as RouteCandidateVO)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="remove(row as RouteCandidateVO)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && candidates.length === 0" description="尚未绑定供应商通道" />
    </template>

  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import modal from '@/plugins/modal';
import {
  deleteRouteCandidate,
  listPaymentProviders,
  listProviderChannels,
  listRouteCandidates,
  saveRouteCandidate
} from '@/api/finance/payment-provider';
import type {
  PaymentProviderVO,
  ProviderChannelVO,
  RouteCandidateVO
} from '@/api/finance/payment-provider';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  scene: 'DEPOSIT' | 'PAYOUT';
  businessRefId?: number;
  businessLabel?: string;
  merchantId?: number;
  bankCode?: string;
  platform?: string;
  currency?: string;
}>(), {
  businessRefId: undefined,
  businessLabel: '',
  merchantId: undefined,
  bankCode: '',
  platform: 'go88',
  currency: 'VND'
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const loading = ref(false);
const candidates = ref<RouteCandidateVO[]>([]);
const channels = ref<ProviderChannelVO[]>([]);
const providers = ref<PaymentProviderVO[]>([]);
const router = useRouter();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});
const operation = computed(() => props.scene);
const totalWeight = computed(() =>
  candidates.value.filter((item) => item.enabled === 1)
    .reduce((sum, item) => sum + Number(item.weightBp || 0), 0)
);

const providerName = (providerId?: number) => {
  if (!providerId) return '-';
  const provider = providers.value.find((item) => item.providerId === providerId);
  return provider ? `${provider.providerName} (${provider.providerCode})` : `供应商 #${providerId}`;
};
const providerNameByChannel = (providerChannelId: number) => {
  const channel = channels.value.find((item) => item.providerChannelId === providerChannelId);
  return providerName(channel?.providerId);
};
const merchantLabel = (row: RouteCandidateVO) => {
  const channel = channels.value.find((item) => item.providerChannelId === row.providerChannelId);
  return row.merchantCode
    ? `${row.merchantCode} / ${row.merchantName || '-'}`
    : channel?.merchantId ? `账号 ${channel.merchantId}` : '未绑定商户账号';
};
const channelCode = (row: RouteCandidateVO) =>
  row.providerChannelCode
  || channels.value.find((item) => item.providerChannelId === row.providerChannelId)?.providerChannelCode
  || `#${row.providerChannelId}`;
const bankName = (row: RouteCandidateVO) =>
  row.bankName || row.channelName || '未配置银行名称';
const channelLabel = (id: number) => {
  const channel = channels.value.find((item) => item.providerChannelId === id);
  return channel ? channelOptionLabel(channel) : `通道 #${id}`;
};
const channelOptionLabel = (channel: ProviderChannelVO) =>
  `${providerName(channel.providerId)} · ${channel.providerChannelCode}`
  + `${channel.bankCode ? ` · ${channel.bankCode}` : ''}`
  + ` · ${channel.providerPayType || channel.operation}`
  + ` · ${channel.currency || 'VND'}${channel.merchantId ? ` · 账号 ${channel.merchantId}` : ''}`;

const loadAll = async () => {
  if (!props.businessRefId) return;
  loading.value = true;
  try {
    const [candidateResponse, channelResponse, providerResponse] = await Promise.all([
      listRouteCandidates({ scene: props.scene, businessRefId: props.businessRefId }),
      listProviderChannels({ operation: props.scene }),
      listPaymentProviders()
    ]);
    candidates.value = candidateResponse.data ?? [];
    channels.value = channelResponse.data ?? [];
    providers.value = providerResponse.data ?? [];
  } finally {
    loading.value = false;
  }
};

const openProviderAccount = () => {
  const first = candidates.value[0];
  const firstChannel = channels.value.find(
    (item) => item.providerChannelId === first?.providerChannelId
  );
  const merchantId = firstChannel?.merchantId ?? props.merchantId;
  visible.value = false;
  router.push({
    path: '/finance/payment-provider',
    query: {
      tab: 'accounts',
      action: merchantId ? 'edit' : 'new',
      merchantId: merchantId ? String(merchantId) : undefined,
      payout: '1',
      businessRefId: String(props.businessRefId || ''),
      bankCode: props.bankCode || undefined,
      platform: props.platform,
      currency: props.currency,
      returnTo: router.currentRoute.value.fullPath
    }
  });
};

const saveInline = async (row: RouteCandidateVO) => {
  await saveRouteCandidate(row);
  modal.msgSuccess('候选配置已更新');
  await loadAll();
};

const remove = async (row: RouteCandidateVO) => {
  await modal.confirm(`确认删除候选「${channelLabel(row.providerChannelId)}」？`);
  await deleteRouteCandidate(row.candidateId);
  modal.msgSuccess('候选已删除');
  await loadAll();
};

watch(
  () => [props.modelValue, props.businessRefId] as const,
  ([open, businessRefId]) => {
    if (open && businessRefId) loadAll();
  },
  { immediate: true }
);
</script>

<style scoped>
.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.drawer-toolbar div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-toolbar span,
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.ml-1 {
  margin-left: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
