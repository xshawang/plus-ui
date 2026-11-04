<template>
  <el-tooltip :disabled="!displayText" :content="displayText || emptyText" effect="dark" placement="top-start">
    <div class="user-name-display">
      {{ displayText || emptyText }}
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    content?: string | null;
    emptyText?: string;
  }>(),
  {
    content: '',
    emptyText: '无'
  }
);

const displayText = computed(
  () =>
    props.content
      ?.split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .join('、') ?? ''
);
</script>

<style lang="scss" scoped>
.user-name-display {
  width: 100%;
  line-height: 20px;
  white-space: normal;
  word-break: break-all;
}
</style>
