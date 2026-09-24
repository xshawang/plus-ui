<template>
  <el-dialog :model-value="visible" title="修改代理模式" width="560px" append-to-body destroy-on-close @update:model-value="close">
    <el-form label-width="130px">
      <el-form-item label="品牌名称(ID)">
        <span>{{ form.brandLabel || '—' }}</span>
      </el-form-item>
      <el-form-item label="币种">
        <span>{{ form.currency || '—' }}</span>
      </el-form-item>
      <el-form-item label="顶层代理ID">
        <span>{{ form.topAgentId || '—' }}</span>
      </el-form-item>
      <el-form-item label="顶层代理账号">
        <span>{{ form.topLoginName || '—' }}</span>
      </el-form-item>
      <el-form-item label="代理总数">
        <span>{{ form.agentTotal ?? 0 }}</span>
      </el-form-item>
      <el-form-item label="原代理模式">
        <span>{{ form.currentModeName || '—' }}</span>
      </el-form-item>
      <el-form-item label="新代理模式" required>
        <el-select v-model="newModeId" placeholder="请选择代理模式" style="width: 100%">
          <el-option v-for="item in form.modeOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="变更会员模式规则">
        <span class="rule-text">{{ form.ruleText }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="AgentModeDialog" lang="ts">
import { reactive, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import { changeAgentMode, getAgentModeForm } from '@/api/agent/account';
import type { AgentModeFormVO } from '@/api/agent/account/types';

const props = defineProps<{
  visible: boolean;
  agentId?: number | string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [message: string];
}>();

const submitting = ref(false);
const newModeId = ref<number>();
const form = reactive<AgentModeFormVO>({ modeOptions: [] });

watch(
  () => props.visible,
  async (value) => {
    if (!value || !props.agentId) {
      return;
    }
    newModeId.value = undefined;
    try {
      const res: any = await getAgentModeForm(props.agentId);
      const data = (res?.data ?? {}) as AgentModeFormVO;
      Object.assign(form, data);
    } catch (error) {
      modal.msgError('代理模式信息加载失败');
    }
  }
);

const close = (value: boolean) => {
  emit('update:visible', value);
};

const submit = async () => {
  if (!newModeId.value) {
    modal.msgWarning('请选择新的代理模式');
    return;
  }
  submitting.value = true;
  try {
    const res: any = await changeAgentMode({ agentId: props.agentId as number | string, modeId: newModeId.value });
    close(false);
    emit('success', `代理模式已变更（影响 ${res?.data ?? 0} 个代理）`);
  } catch (error) {
    // 统一错误提示（如「当前存在待结算佣金，结算完成前无法变更代理模式」）
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.rule-text {
  color: #909399;
  font-size: 12px;
}
</style>
