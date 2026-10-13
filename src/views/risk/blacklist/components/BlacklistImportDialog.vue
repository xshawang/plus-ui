<template>
  <el-dialog :model-value="modelValue" :title="`批量导入 - ${tabLabel}`" width="560px" append-to-body @update:model-value="close">
    <el-alert type="info" :closable="false" class="mb-3">
      <template #title>
        <div>UTF-8 编码 CSV，首行可为表头；单次最多 200 条。</div>
        <div class="import-tip">列顺序：{{ templateTip }}</div>
      </template>
    </el-alert>

    <el-upload
      ref="uploadRef"
      drag
      :limit="1"
      accept=".csv"
      :auto-upload="false"
      :disabled="uploading"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">只能上传 .csv 文件；同一份文件（按内容 MD5）重复上传会直接复用历史台账，不会重复入库。</div>
      </template>
    </el-upload>

    <!-- 回执：导入结果必须可见可追溯，失败明细可下载后修正重传 -->
    <el-descriptions v-if="result" :column="2" border class="mt-3">
      <el-descriptions-item label="文件名">{{ result.fileName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="是否重复上传">
        <el-tag :type="result.duplicated ? 'warning' : 'success'">{{ result.duplicated ? '是' : '否' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="总条数">{{ result.totalCount ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="成功 / 失败">
        <span class="text-green-600">{{ result.successCount ?? 0 }}</span> /
        <span class="text-red-500">{{ result.failCount ?? 0 }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <template v-if="failRows.length">
      <div class="mt-3 mb-1 text-sm text-gray-500">失败明细（最多展示 20 行）</div>
      <el-table :data="failRows" border max-height="200">
        <el-table-column label="行号" prop="line" width="90" align="center" />
        <el-table-column label="失败原因" prop="reason" show-overflow-tooltip />
      </el-table>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button
          v-if="result?.failCount"
          type="warning"
          plain
          :loading="downloading"
          @click="downloadFailDetail"
        >
          下载失败明细
        </el-button>
        <el-button type="primary" :disabled="uploading" @click="submit">上 传</el-button>
        <el-button @click="close">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="RiskBlacklistImportDialog" lang="ts">
import { downloadRiskImportFailDetail, importRiskBlacklist } from '@/api/risk/blacklist';
import type { RiskBlacklistTab, RiskImportResultVO } from '@/api/risk/blacklist/types';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  tab: RiskBlacklistTab;
  tabLabel: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>();

const uploadRef = ref();
const uploading = ref(false);
const downloading = ref(false);
const result = ref<RiskImportResultVO>();

/** 导入列顺序与后端 parseRow 一致；提现页签多三个前置列 */
const templateTip = computed(() =>
  props.tab === 'withdraw-account'
    ? '币种,提现大类,类型名称,提现账号/地址,备注（备注可省略）'
    : '目标值,备注（备注可省略）'
);

const failRows = computed(() => {
  const text = result.value?.failDetail;
  if (!text) return [];
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 20)
    .map(line => {
      const index = line.indexOf('|');
      return index < 0
        ? { line: line.trim(), reason: '' }
        : { line: line.slice(0, index).trim(), reason: line.slice(index + 1).trim() };
    });
});

watch(
  () => props.modelValue,
  visible => {
    if (!visible) return;
    result.value = undefined;
    uploading.value = false;
    uploadRef.value?.clearFiles();
  }
);

/**
 * 提交上传。
 *
 * 这里没有用 el-upload 的 action 默认提交（auto-upload=false）：因为要显式捕获
 * 「文件为空」「接口失败」两种情况并给出可读提示，而不是让浏览器直接跳错误页。
 */
const submit = async () => {
  const file = uploadRef.value?.uploadFiles?.[0]?.raw as File | undefined;
  if (!file) {
    modal.msgWarning('请选择需要上传的 CSV 文件');
    return;
  }
  uploading.value = true;
  try {
    const res = await importRiskBlacklist(props.tab, file);
    result.value = res.data || {};
    if (result.value.failCount) {
      modal.msgWarning(`导入完成：成功 ${result.value.successCount ?? 0} 条，失败 ${result.value.failCount} 条`);
    } else {
      modal.msgSuccess(`导入完成：成功 ${result.value.successCount ?? 0} 条`);
    }
    // 通知父级刷新列表：导入可能新增了多行名单
    emit('success');
  } finally {
    uploading.value = false;
  }
};

const downloadFailDetail = async () => {
  const logId = result.value?.logId;
  if (!logId) return;
  downloading.value = true;
  try {
    const blob = await downloadRiskImportFailDetail(logId);
    saveBlob(blob as unknown as Blob, `黑名单导入失败明细_${logId}.csv`);
  } finally {
    downloading.value = false;
  }
};

const close = () => emit('update:modelValue', false);
</script>

<style scoped>
.import-tip {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
