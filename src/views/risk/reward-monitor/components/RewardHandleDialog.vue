<template>
  <el-dialog :model-value="modelValue" title="处理派奖监控" width="520px" append-to-body @update:model-value="close">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="记录数量">
        <span>{{ ids.length }} 条</span>
      </el-form-item>
      <el-form-item label="处理结果" prop="resultStatus">
        <el-radio-group v-model="form.resultStatus">
          <el-radio :value="2">已处理（风险成立）</el-radio>
          <el-radio :value="3">已忽略（误报）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="处理备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请填写处理依据，便于复盘与审计"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="saving" @click="submit">确 定</el-button>
        <el-button @click="close">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="RiskRewardHandleDialog" lang="ts">
import { handleRewardMonitor } from '@/api/risk/reward-monitor';
import modal from '@/plugins/modal';
import { reactive, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  /** 待处理的台账主键（行内处理传 1 条，批量处理传多条） */
  ids: Array<string | number>;
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>();

const formRef = ref<ElFormInstance>();
const saving = ref(false);
const form = reactive<{ resultStatus: number; remark: string }>({ resultStatus: 2, remark: '' });

watch(
  () => props.modelValue,
  visible => {
    if (!visible) return;
    form.resultStatus = 2;
    form.remark = '';
    formRef.value?.clearValidate();
  }
);

// 处理结论会写进台账，是后续「为什么放过 / 为什么判定风险」的依据，
// 因此备注必填：空备注在复盘时等于没有结论（后端同样会记录操作人与时间）。
const submit = async () => {
  if (props.ids.length === 0) {
    modal.msgWarning('请先选择需要处理的记录');
    return;
  }
  if (!form.remark.trim()) {
    modal.msgWarning('请填写处理备注');
    return;
  }
  saving.value = true;
  try {
    const res = await handleRewardMonitor({
      ids: props.ids,
      resultStatus: form.resultStatus,
      remark: form.remark.trim()
    });
    modal.msgSuccess(`已处理 ${res.data ?? 0} 条`);
    emit('success');
    close();
  } finally {
    saving.value = false;
  }
};

const close = () => emit('update:modelValue', false);
</script>
