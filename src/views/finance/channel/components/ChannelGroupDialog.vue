<template>
  <el-dialog v-model="visible" :title="form.groupId ? '修改充值大类' : '新增充值大类'" width="620px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="大类编码" prop="groupCode">
        <el-input v-model="form.groupCode" placeholder="字母/数字/下划线，2~32 位" :disabled="!!form.groupId" />
      </el-form-item>
      <el-form-item label="大类名称" prop="groupName">
        <el-input v-model="form.groupName" placeholder="如 快捷充值" />
      </el-form-item>
      <el-form-item label="大类类型">
        <el-select v-model="form.groupType" class="w-full">
          <el-option v-for="item in groupTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="大类图标">
        <div class="stack">
          <image-upload v-model="form.groupIcon" value-mode="url" :limit="1" />
          <span class="field-hint">仅后台展示；为空时按大类类型显示默认图标。是否下发客户端待 g319 确认（P2）</span>
        </div>
      </el-form-item>
      <el-form-item label="前台停/启用">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        <span class="field-hint ml-2">停用后玩家收银台隐藏整个大类，子通道自身开关不变</span>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>
      <div class="field-hint pl">排序在列表中用“上移 / 下移 / 置顶”调整。</div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { saveChannelGroup } from '@/api/finance/channel';
import type { FinanceChannelGroupForm, FinanceChannelGroupVO } from '@/api/finance/channel/types';
import { groupTypeOptions } from '../channel-utils';

const props = defineProps<{ group?: FinanceChannelGroupVO; nextSortNo?: number }>();
const emit = defineEmits<{ saved: [form: FinanceChannelGroupForm] }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive<FinanceChannelGroupForm>({});

const rules: FormRules = {
  groupCode: [
    { required: true, message: '大类编码不能为空', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{2,32}$/, message: '仅允许字母/数字/下划线，2~32 位', trigger: 'blur' }
  ],
  groupName: [{ required: true, message: '大类名称不能为空', trigger: 'blur' }]
};

watch(visible, (open) => {
  if (!open) return;
  const g = props.group;
  Object.assign(form, {
    groupId: g && g.groupId > 0 ? g.groupId : undefined,
    groupCode: g?.groupCode ?? '',
    groupName: g?.groupName ?? '',
    groupIcon: g?.groupIcon ?? '',
    groupType: g?.groupType ?? 1,
    // 合并展示到（link_group_code）无运行时读取，改版后不在弹窗维护，保存时原样带回
    linkGroupCode: g?.linkGroupCode ?? '',
    sortNo: g?.sortNo ?? props.nextSortNo ?? 0,
    status: g?.status ?? 1,
    remark: g?.remark ?? ''
  });
  formRef.value?.clearValidate();
});

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    await saveChannelGroup({ ...form });
    modal.msgSuccess('保存成功');
    visible.value = false;
    emit('saved', { ...form });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.w-full {
  width: 100%;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.ml-2 {
  margin-left: 8px;
}

.pl {
  padding-left: 110px;
}
</style>
