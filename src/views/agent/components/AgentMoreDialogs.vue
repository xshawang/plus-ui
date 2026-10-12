<template>
  <el-dialog :model-value="visible" :title="title" width="520px" append-to-body destroy-on-close @update:model-value="close">
    <el-descriptions :column="1" border size="small" class="mb-3">
      <el-descriptions-item label="代理账号">{{ row.loginName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="币种">{{ row.currency || '—' }}</el-descriptions-item>
      <el-descriptions-item v-if="action === 'parent'" label="当前上级">{{ row.parentLoginName || '—' }}</el-descriptions-item>
      <el-descriptions-item v-if="action === 'withdrawMethod'" label="当前提现方式">{{ row.withdrawMethodText || '—' }}</el-descriptions-item>
      <el-descriptions-item v-if="action === 'layer'" label="当前层级">{{ row.layerTag || '—' }}</el-descriptions-item>
      <el-descriptions-item v-if="action === 'label'" label="当前标签">{{ row.labelName || '—' }}</el-descriptions-item>
    </el-descriptions>

    <el-form label-width="130px">
      <el-form-item v-if="action === 'parent'" label="新上级代理">
        <el-select
          v-model="form.parentAgentId"
          filterable
          remote
          clearable
          placeholder="留空表示变更为「无上级」"
          :remote-method="searchParent"
          :loading="parentLoading"
          style="width: 100%"
        >
          <el-option v-for="item in parentOptions" :key="item.value" :label="`${item.label}（${item.currency ?? ''}）`" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="action === 'withdrawMethod'" label="提现方式">
        <el-select v-model="form.withdrawMethod" placeholder="请选择提现方式" style="width: 100%">
          <el-option v-for="item in options.withdrawMethods" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="action === 'layer'" label="直属层级">
        <el-select v-model="form.layerId" placeholder="请选择层级" style="width: 100%">
          <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="action === 'label'" label="直属标签">
        <el-select v-model="form.labelId" placeholder="请选择标签" style="width: 100%">
          <el-option v-for="item in options.labels" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="action === 'layer' || action === 'label'" label="影响范围">
        <span class="tip-text">保存后同时作用于该代理的直属下级（截图语义为「直属强制绑定」）。</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="AgentMoreDialogs" lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import { changeAgentLabel, changeAgentLayer, changeAgentParent, changeAgentWithdrawMethod, listParentOptions } from '@/api/agent/account';
import type { AgentAccountVO, AgentOption, AgentOptionsVO } from '@/api/agent/account/types';

type AnyRow = AgentAccountVO & Record<string, any>;

const props = defineProps<{
  visible: boolean;
  /** parent / withdrawMethod / layer / label */
  action: string;
  row: AnyRow;
  options: AgentOptionsVO;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [message: string];
}>();

const submitting = ref(false);
const parentLoading = ref(false);
const parentOptions = ref<AgentOption[]>([]);
const form = reactive<{ parentAgentId?: number | string; withdrawMethod?: number; layerId?: number; labelId?: number }>({});

const title = computed(() => {
  switch (props.action) {
    case 'parent':
      return '修改上级';
    case 'withdrawMethod':
      return '修改提现方式';
    case 'layer':
      return '修改直属层级';
    default:
      return '修改直属标签';
  }
});

watch(
  () => [props.visible, props.action] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    form.parentAgentId = undefined;
    form.withdrawMethod = props.row.withdrawMethod;
    form.layerId = props.row.directLayerId ? Number(props.row.directLayerId) : undefined;
    form.labelId = props.row.directLabelId ? Number(props.row.directLabelId) : undefined;
    parentOptions.value = [];
    if (props.action === 'parent') {
      searchParent('');
    }
  }
);

const searchParent = async (keyword: string) => {
  parentLoading.value = true;
  try {
    const res: any = await listParentOptions(props.row.currency, keyword);
    // 排除自身，避免提交后才被服务端拒绝（服务端仍会做环检测兜底）
    parentOptions.value = ((res?.data ?? []) as AgentOption[]).filter(
      (item) => String(item.value) !== String(props.row.agentId)
    );
  } catch (error) {
    parentOptions.value = [];
  } finally {
    parentLoading.value = false;
  }
};

const close = (value: boolean) => {
  emit('update:visible', value);
};

const submit = async () => {
  submitting.value = true;
  try {
    const agentId = props.row.agentId;
    if (props.action === 'parent') {
      await changeAgentParent({ agentId, parentAgentId: form.parentAgentId });
      close(false);
      emit('success', '上级代理已修改');
    } else if (props.action === 'withdrawMethod') {
      if (!form.withdrawMethod) {
        modal.msgWarning('请选择提现方式');
        return;
      }
      await changeAgentWithdrawMethod({ agentId, withdrawMethod: form.withdrawMethod });
      close(false);
      emit('success', '提现方式已修改');
    } else if (props.action === 'layer') {
      if (!form.layerId) {
        modal.msgWarning('请选择层级');
        return;
      }
      await changeAgentLayer({ agentId, layerId: form.layerId });
      close(false);
      emit('success', '直属层级已修改');
    } else {
      if (!form.labelId) {
        modal.msgWarning('请选择标签');
        return;
      }
      await changeAgentLabel({ agentId, labelId: form.labelId });
      close(false);
      emit('success', '直属标签已修改');
    }
  } catch (error) {
    // 统一错误提示（如「上级代理不能选择自身或自身的下级代理」）
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.tip-text {
  color: #909399;
  font-size: 12px;
}
</style>
