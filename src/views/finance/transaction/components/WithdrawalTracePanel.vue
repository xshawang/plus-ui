<template>
  <div class="withdraw-trace">
    <section class="trace-card">
      <div class="trace-card__header">
        <div>
          <h3>代付尝试记录</h3>
          <p>第 001 次为转账，后续次数为重试；状态来自代付尝试表。</p>
        </div>
        <el-tag effect="plain">{{ attempts.length }} 次</el-tag>
      </div>
      <el-table v-if="attempts.length" :data="attempts" size="small" border>
        <el-table-column label="次数" width="76" align="center">
          <template #default="{ row }">{{ attemptNo(row as FinancePayoutAttempt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="84" align="center">
          <template #default="{ row }">{{ attemptOperation(row as FinancePayoutAttempt) }}</template>
        </el-table-column>
        <el-table-column label="供应商 / 商户" min-width="170">
          <template #default="{ row }">
            <div>{{ providerLabel(row.providerCode) }} / {{ row.merchantCode || '-' }}</div>
            <div class="trace-muted">{{ row.providerChannelCode || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="代付请求号" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <code>{{ row.providerRequestNo || '-' }}</code>
          </template>
        </el-table-column>
        <el-table-column label="转账状态" width="116" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.transferStatus)">
              {{ transferStatusLabel(row.transferStatus) }}
            </el-tag>
            <div v-if="row.failMessage" class="trace-error" :title="row.failMessage">
              {{ row.failMessage }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提交 / 完成时间" min-width="190">
          <template #default="{ row }">
            <div>{{ formatTime(row.submitAt || row.createdAt) }}</div>
            <div class="trace-muted">{{ formatTime(row.completedAt || row.updatedAt) }}</div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="trace-empty">暂无代付尝试记录</div>
    </section>

    <section class="trace-card">
      <div class="trace-card__header">
        <div>
          <h3>代付请求与返回</h3>
          <p>展示转账、重试和主动查单的脱敏请求体、返回内容、状态和耗时。</p>
        </div>
        <el-tag effect="plain">{{ payoutExchanges.length }} 条</el-tag>
      </div>
      <el-collapse v-if="payoutExchanges.length" accordion>
        <el-collapse-item
          v-for="row in payoutExchanges"
          :key="String(row.notificationId)"
          :name="String(row.notificationId)"
        >
          <template #title>
            <div class="trace-collapse-title">
              <strong>{{ operationLabel(row.eventType) }}</strong>
              <span v-if="matchedAttempt(row)" class="trace-muted">
                · 第 {{ attemptNo(matchedAttempt(row)) }} 次
              </span>
              <el-tag size="small" :type="statusType(row.handleStatus)">
                {{ notificationStatusLabel(row.handleStatus) }}
              </el-tag>
              <span class="trace-muted">
                {{ formatTime(row.receivedAt) }}
                · {{ transportLabel(row) }}
                · {{ row.durationMs ?? '-' }} ms
              </span>
            </div>
          </template>
          <div class="trace-detail-grid">
            <div><span>请求方式</span><strong>{{ row.requestMethod || '-' }}</strong></div>
            <div><span>请求时间</span><strong>{{ formatTime(row.receivedAt) }}</strong></div>
            <div><span>返回时间</span><strong>{{ formatTime(row.processedAt) }}</strong></div>
            <div><span>HTTP 状态</span><strong>{{ row.httpStatus ?? '-' }}</strong></div>
            <div><span>业务返回状态</span><strong>{{ row.resultCode || '-' }}</strong></div>
            <div><span>耗时</span><strong>{{ row.durationMs ?? '-' }} ms</strong></div>
          </div>
          <div class="trace-url">
            <span>请求 URL</span>
            <code>{{ row.requestUrl || '-' }}</code>
          </div>
          <div v-if="row.resultMsg" class="trace-result-message">
            {{ row.resultMsg }}
          </div>
          <div class="trace-payload-grid">
            <div>
              <h4>请求体</h4>
              <pre>{{ prettyJson(row.payloadJson) }}</pre>
            </div>
            <div>
              <h4>返回内容</h4>
              <pre>{{ prettyJson(row.responseJson) }}</pre>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div v-else class="trace-empty">
        <strong>暂无持久化请求报文</strong>
        <span>历史请求当时只写应用日志；本次改造上线后的转账、重试和查单会显示在这里。</span>
      </div>
    </section>

    <section class="trace-card">
      <div class="trace-card__header">
        <div>
          <h3>异步通知</h3>
          <p>展示代付方通知内容、归一化状态、签名结果和通知时间。</p>
        </div>
        <el-tag effect="plain">{{ callbacks.length }} 条</el-tag>
      </div>
      <el-collapse v-if="callbacks.length" accordion>
        <el-collapse-item
          v-for="row in callbacks"
          :key="String(row.notificationId)"
          :name="String(row.notificationId)"
        >
          <template #title>
            <div class="trace-collapse-title">
              <strong>{{ operationLabel(row.eventType) }}</strong>
              <el-tag size="small" :type="statusType(row.handleStatus)">
                {{ notificationStatusLabel(row.handleStatus) }}
              </el-tag>
              <span class="trace-muted">
                {{ formatTime(row.receivedAt) }}
                · HTTP {{ row.httpStatus ?? '-' }}
              </span>
            </div>
          </template>
          <div class="trace-detail-grid">
            <div><span>通知状态</span><strong>{{ row.handleStatus || '-' }}</strong></div>
            <div><span>业务结果</span><strong>{{ row.resultCode || '-' }}</strong></div>
            <div><span>签名</span><strong>{{ row.signOk === 1 ? '通过' : '失败' }}</strong></div>
            <div><span>通知时间</span><strong>{{ formatTime(row.receivedAt) }}</strong></div>
            <div><span>处理时间</span><strong>{{ formatTime(row.processedAt) }}</strong></div>
            <div><span>来源 IP</span><strong>{{ (row as TraceNotification).sourceIp || '-' }}</strong></div>
          </div>
          <div class="trace-payload-grid">
            <div>
              <h4>通知内容</h4>
              <pre>{{ prettyJson(row.payloadJson) }}</pre>
            </div>
            <div>
              <h4>平台应答</h4>
              <pre>{{ prettyJson(row.responseJson) }}</pre>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div v-else class="trace-empty">暂无异步通知</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type {
  FinancePayoutAttempt,
  FinanceTransactionNotification
} from '@/api/finance/transaction';

interface TraceNotification extends FinanceTransactionNotification {
  sourceIp?: string;
}

const props = withDefaults(defineProps<{
  attempts?: FinancePayoutAttempt[];
  notifications?: FinanceTransactionNotification[];
}>(), {
  attempts: () => [],
  notifications: () => []
});

const payoutExchanges = computed(() =>
  props.notifications.filter((row) =>
    row.direction === 'OUTBOUND_PROVIDER'
    && String(row.eventType || '').startsWith('PAYOUT_')
  )
);

const callbacks = computed(() =>
  props.notifications.filter((row) => row.direction === 'INBOUND_CALLBACK')
);

const matchedAttempt = (row: FinanceTransactionNotification) =>
  props.attempts.find((attempt) =>
    (row.attemptId != null && String(attempt.attemptId) === String(row.attemptId))
    || (row.orderNo && row.orderNo === attempt.providerRequestNo)
    || (row.orderNo && row.orderNo === attempt.providerOrderNo)
  );

const attemptNo = (attempt?: FinancePayoutAttempt) =>
  String(attempt?.attemptNo || 0).padStart(3, '0');

const attemptOperation = (attempt: FinancePayoutAttempt) =>
  Number(attempt.attemptNo || 0) <= 1 ? '转账' : '重试';

const operationLabel = (value?: string) => ({
  PAYOUT_TRANSFER: '转账',
  PAYOUT_RETRY: '重试',
  PAYOUT_QUERY: '查单',
  PAYOUT_CALLBACK: '代付成功/失败通知',
  PAYOUT_REVERSE: '代付冲正通知'
}[value || ''] || value || '-');

const providerLabel = (value?: string) => value || '-';

const transferStatusLabel = (value?: string) => ({
  UNSUBMITTED: '待转账',
  SUBMITTING: '提交中',
  PROCESSING: '处理中',
  UNKNOWN: '结果待确认',
  SUCCESS: '成功',
  FAILED: '失败'
}[value || ''] || value || '-');

const notificationStatusLabel = (value?: string) => ({
  PENDING: '处理中',
  SUCCESS: '成功',
  FAILED: '失败',
  IGNORED: '已忽略'
}[value || ''] || value || '-');

const statusType = (value?: string) => {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED') return 'danger';
  if (value === 'UNKNOWN' || value === 'PENDING' || value === 'PROCESSING') return 'warning';
  return 'info';
};

const transportLabel = (row: FinanceTransactionNotification) => {
  if (row.transportOk == null) return '传输结果未知';
  return row.transportOk === 1 ? '传输成功' : '传输失败';
};

const formatTime = (value?: string) => value ? value.replace('T', ' ').slice(0, 19) : '-';

const prettyJson = (value?: string) => {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};
</script>

<style scoped>
.withdraw-trace {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trace-card {
  padding: 17px 19px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.trace-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.trace-card__header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.trace-card__header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.trace-card :deep(.el-table),
.trace-card :deep(.el-collapse) {
  margin-top: 12px;
}

.trace-muted {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.trace-error {
  overflow: hidden;
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trace-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 78px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-align: center;
}

.trace-empty strong {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.trace-collapse-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-right: 12px;
}

.trace-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.trace-detail-grid > div {
  padding: 9px 11px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.trace-detail-grid span,
.trace-url span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.trace-detail-grid strong {
  display: block;
  margin-top: 3px;
  overflow-wrap: anywhere;
  font-size: 12px;
}

.trace-url {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.trace-url code {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
  font-size: 11px;
}

.trace-result-message {
  margin-top: 9px;
  color: var(--el-color-danger);
  font-size: 11px;
  overflow-wrap: anywhere;
}

.trace-payload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.trace-payload-grid h4 {
  margin: 0 0 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.trace-payload-grid pre {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 11px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (width <= 760px) {
  .trace-detail-grid,
  .trace-payload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
