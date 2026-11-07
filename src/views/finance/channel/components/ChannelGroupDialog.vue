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
      <el-form-item label="充值黑名单">
        <div class="stack">
          <div>
            <el-switch v-model="form.blacklistEnable" :active-value="1" :inactive-value="0" :disabled="isP2p" />
            <span class="field-hint ml-2">命中所选会员标签的玩家，该大类下所有通道不显示、也不能下单</span>
          </div>
          <el-select
            v-if="form.blacklistEnable === 1"
            v-model="blacklistTags"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择会员标签（可多选）"
            class="w-full"
            :loading="tagLoading"
          >
            <el-option v-for="t in tagOptions" :key="t.tagCode" :label="`${t.tagName}（${t.tagCode}）`" :value="t.tagCode" />
          </el-select>
          <span v-if="isP2p" class="field-hint">P2P 大类走独立渠道表，不支持充值黑名单</span>
          <span v-else class="field-hint">配置变更最多 1 分钟内对玩家生效；标签选项来自“会员标签”，需有 member:tag:list 权限</span>
        </div>
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
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { saveChannelGroup } from '@/api/finance/channel';
import { listMemberTagOptions } from '@/api/member/tag';
import type { FinanceChannelGroupForm, FinanceChannelGroupVO } from '@/api/finance/channel/types';
import { groupTypeOptions } from '../channel-utils';

const props = defineProps<{ group?: FinanceChannelGroupVO; nextSortNo?: number }>();
const emit = defineEmits<{ saved: [form: FinanceChannelGroupForm] }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive<FinanceChannelGroupForm>({});

/** P2P 大类（type=6）不支持充值黑名单 */
const P2P_TYPE = 6;
const isP2p = computed(() => form.groupType === P2P_TYPE);

const blacklistTags = ref<string[]>([]);
const tagOptions = ref<{ tagCode: string; tagName: string }[]>([]);
const tagLoading = ref(false);

const splitCodes = (raw?: string) =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** 取启用中的会员标签；无权限或失败时只保留已选编码，不阻塞弹窗。 */
const loadTagOptions = async () => {
  tagLoading.value = true;
  try {
    const res = await listMemberTagOptions();
    tagOptions.value = (res.data ?? [])
      .filter((t) => t.tagCode)
      .map((t) => ({ tagCode: t.tagCode, tagName: t.tagName || t.tagCode }));
  } catch {
    tagOptions.value = [];
  } finally {
    // 已保存但已停用/无权限看到的编码，仍以原编码显示，避免保存时被悄悄丢掉
    for (const code of blacklistTags.value) {
      if (!tagOptions.value.some((t) => t.tagCode === code)) tagOptions.value.push({ tagCode: code, tagName: code });
    }
    tagLoading.value = false;
  }
};

watch(isP2p, (p2p) => {
  if (p2p) form.blacklistEnable = 0;
});

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
    blacklistEnable: g?.blacklistEnable ?? 0,
    remark: g?.remark ?? ''
  });
  blacklistTags.value = splitCodes(g?.blacklistTagCode);
  void loadTagOptions();
  formRef.value?.clearValidate();
});

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.blacklistEnable === 1 && blacklistTags.value.length === 0) {
    modal.msgError('开启充值黑名单时，请至少选择一个会员标签');
    return;
  }
  submitting.value = true;
  try {
    // 关闭时也带上当前标签，后端原样保存，下次开启不用重选
    form.blacklistTagCode = blacklistTags.value.join(',');
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
