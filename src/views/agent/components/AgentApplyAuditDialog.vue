<template>
  <el-dialog :model-value="visible" title="专业代理审核" width="560px" append-to-body destroy-on-close @update:model-value="close">
    <el-descriptions v-if="detail.loginName" :column="1" border size="small" class="mb-3">
      <el-descriptions-item label="会员账号">{{ detail.loginName }}</el-descriptions-item>
      <el-descriptions-item label="真实姓名">{{ detail.realName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="申请代理模式">{{ detail.modeName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="累计邀请人数">{{ detail.inviteCount ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="押金">{{ (Number(detail.depositAmount ?? 0) / 100).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="本次操作范围">共 {{ applyIds.length }} 条申请</el-descriptions-item>
    </el-descriptions>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
      <el-form-item label="审核结果" prop="approve">
        <el-radio-group v-model="form.approve">
          <el-radio :value="true">通过</el-radio>
          <el-radio :value="false">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      <template v-if="form.approve">
        <el-form-item label="代理模式" prop="modeId">
          <el-select v-model="form.modeId" placeholder="请选择代理模式" style="width: 100%">
            <el-option v-for="item in options.modes" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="代理本人层级" prop="layerId">
          <el-select v-model="form.layerId" placeholder="默认层级" style="width: 100%">
            <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="直属强制绑定层级" prop="directLayerId">
          <el-select v-model="form.directLayerId" placeholder="默认层级" style="width: 100%">
            <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="代理提现方式" prop="withdrawMethod">
          <el-select v-model="form.withdrawMethod" placeholder="不限制（自由领取）" style="width: 100%">
            <el-option v-for="item in options.withdrawMethods" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
      </template>
      <el-form-item :label="form.approve ? '通过备注' : '前台拒绝原因'" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          :placeholder="form.approve ? '请填写通过备注（内部记录）' : '请填写拒绝原因（会展示给前台申请人）'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="AgentApplyAuditDialog" lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { auditAgentApply, batchAuditAgentApply, getAgentApplyDetail } from '@/api/agent/apply';
import type { AgentApplyVO } from '@/api/agent/apply/types';
import type { AgentOptionsVO } from '@/api/agent/account/types';

const props = defineProps<{
  visible: boolean;
  applyIds: Array<number | string>;
  options: AgentOptionsVO;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [message: string];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const detail = reactive<Partial<AgentApplyVO>>({});
const form = reactive<{ approve: boolean; modeId?: number; layerId?: number; directLayerId?: number; withdrawMethod?: number; remark: string }>(
  { approve: true, remark: '' }
);

const rules: FormRules = {
  modeId: [{ required: true, message: '请选择代理模式', trigger: 'change' }],
  layerId: [{ required: true, message: '请选择代理本人层级', trigger: 'change' }],
  directLayerId: [{ required: true, message: '请选择直属强制绑定层级', trigger: 'change' }],
  withdrawMethod: [{ required: true, message: '请选择代理提现方式', trigger: 'change' }],
  remark: [{ required: true, message: '请填写备注', trigger: 'blur' }]
};

/** 默认值取配置 is_default，与新增代理弹窗保持一致口径 */
const defaultOf = (list: { value: number | string; isDefault?: number }[] | undefined) => {
  const options = list ?? [];
  const preferred = options.find((item) => Number(item.isDefault) === 1);
  return Number((preferred ?? options[0])?.value ?? 0) || undefined;
};

watch(
  () => props.visible,
  async (value) => {
    if (!value) {
      return;
    }
    form.approve = true;
    form.remark = '';
    form.modeId = defaultOf(props.options.modes);
    form.layerId = defaultOf(props.options.layers);
    form.directLayerId = form.layerId;
    form.withdrawMethod = defaultOf(props.options.withdrawMethods);
    Object.keys(detail).forEach((key) => delete (detail as Record<string, any>)[key]);
    if (props.applyIds.length === 1) {
      try {
        const res: any = await getAgentApplyDetail(props.applyIds[0]);
        Object.assign(detail, res?.data ?? {});
        if (detail.modeId) {
          form.modeId = Number(detail.modeId);
        }
      } catch (error) {
        modal.msgError('申请详情加载失败');
      }
    }
  }
);

const close = (value: boolean) => {
  emit('update:visible', value);
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      applyId: props.applyIds.length === 1 ? props.applyIds[0] : undefined,
      applyIds: props.applyIds,
      approve: form.approve,
      modeId: form.approve ? form.modeId : undefined,
      layerId: form.approve ? form.layerId : undefined,
      directLayerId: form.approve ? form.directLayerId : undefined,
      withdrawMethod: form.approve ? form.withdrawMethod : undefined,
      remark: form.remark
    };
    const res: any =
      props.applyIds.length === 1 ? await auditAgentApply(payload as any) : await batchAuditAgentApply(payload as any);
    close(false);
    emit('success', `审核完成（影响 ${res?.data ?? 0} 条）`);
  } catch (error) {
    // 统一错误提示
  } finally {
    submitting.value = false;
  }
};
</script>
