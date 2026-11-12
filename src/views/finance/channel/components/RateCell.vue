<template>
  <span class="rate" :class="rate == null || !total ? 'none' : level">
    <template v-if="rate == null || !total">—<span class="count">无订单</span></template>
    <template v-else>
      {{ Number(rate).toFixed(2) }}%
      <span class="count">{{ success ?? 0 }}/{{ total }} 笔</span>
      <span v-if="total < MIN_RATE_SAMPLE" class="count warn">样本不足</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MIN_RATE_SAMPLE } from '../channel-utils';

/**
 * 成功率单元格：口径为窗口内充值单（不含创建不足 15 分钟的待支付单），样本不足 30 笔不着色。
 */
const props = defineProps<{ rate?: number | null; total?: number; success?: number }>();

const level = computed(() => {
  if ((props.total ?? 0) < MIN_RATE_SAMPLE) return 'none';
  const value = Number(props.rate ?? 0);
  return value >= 80 ? 'good' : value >= 50 ? 'mid' : 'bad';
});
</script>

<style scoped>
.rate { font-weight: 600; display: inline-flex; flex-direction: column; align-items: center; line-height: 1.35; }
.rate.good { color: var(--el-color-success); }
.rate.mid { color: var(--el-color-warning); }
.rate.bad { color: var(--el-color-danger); }
.rate.none { color: var(--el-text-color-placeholder); font-weight: 400; }
.count { font-size: 11px; font-weight: 400; color: var(--el-text-color-secondary); }
.count.warn { color: var(--el-color-warning); }
</style>
