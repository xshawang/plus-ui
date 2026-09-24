<template>
  <el-dialog :model-value="visible" title="新增代理" width="560px" append-to-body destroy-on-close @update:model-value="close">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
      <el-form-item label="上级代理">
        <el-radio-group v-model="form.hasParent" @change="onParentToggle">
          <el-radio :value="false">无上级</el-radio>
          <el-radio :value="true">有上级</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.hasParent" label="上级代理账号" prop="parentAgentId">
        <el-select
          v-model="form.parentAgentId"
          filterable
          remote
          clearable
          placeholder="请输入代理账号搜索"
          :remote-method="searchParent"
          :loading="parentLoading"
          style="width: 100%"
        >
          <el-option v-for="item in parentOptions" :key="item.value" :label="`${item.label}（${item.currency ?? ''}）`" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="代理币种" prop="currency">
        <el-select v-model="form.currency" placeholder="请选择代理币种" style="width: 100%" @change="onCurrencyChange">
          <el-option v-for="item in options.currencies" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="代理账号" prop="loginName">
        <el-input v-model="form.loginName" placeholder="请输入代理账号（4~32 位字母数字）" maxlength="32" />
      </el-form-item>
      <el-form-item label="登录密码" prop="loginPassword">
        <el-input v-model="form.loginPassword" type="password" show-password placeholder="8~32 位，需包含字母与数字" maxlength="32" />
      </el-form-item>
      <el-form-item label="提现密码(选填)" prop="payPassword">
        <el-input v-model="form.payPassword" type="password" show-password placeholder="6 位数字，留空表示暂不可自行提现" maxlength="6" />
      </el-form-item>
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
      <el-form-item label="代理本人标签">
        <el-select v-model="form.labelId" placeholder="请选择代理本人标签" clearable style="width: 100%">
          <el-option v-for="item in options.labels" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="直属强制绑定层级" prop="directLayerId">
        <el-select v-model="form.directLayerId" placeholder="默认层级" style="width: 100%">
          <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="直属强制绑定标签">
        <el-select v-model="form.directLabelId" placeholder="请选择直属强制绑定标签" clearable style="width: 100%">
          <el-option v-for="item in options.labels" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="代理提现方式" prop="withdrawMethod">
        <el-select v-model="form.withdrawMethod" placeholder="不限制（自由领取）" style="width: 100%">
          <el-option v-for="item in options.withdrawMethods" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="AgentAddDialog" lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { addAgentAccount, listParentOptions } from '@/api/agent/account';
import type { AgentAddForm, AgentOption, AgentOptionsVO } from '@/api/agent/account/types';

const props = defineProps<{
  visible: boolean;
  options: AgentOptionsVO;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [message: string];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const parentLoading = ref(false);
const parentOptions = ref<AgentOption[]>([]);
const form = reactive<AgentAddForm>({
  hasParent: false,
  currency: '',
  loginName: '',
  loginPassword: '',
  payPassword: ''
});

const rules: FormRules = {
  currency: [{ required: true, message: '请选择代理币种', trigger: 'change' }],
  loginName: [
    { required: true, message: '请输入代理账号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{4,32}$/, message: '代理账号需为 4~32 位字母、数字或下划线', trigger: 'blur' }
  ],
  loginPassword: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 8, max: 32, message: '登录密码长度需为 8~32 位', trigger: 'blur' }
  ],
  payPassword: [{ pattern: /^\d{6}$/, message: '提现密码需为 6 位数字', trigger: 'blur' }],
  modeId: [{ required: true, message: '请选择代理模式', trigger: 'change' }],
  layerId: [{ required: true, message: '请选择代理本人层级', trigger: 'change' }],
  directLayerId: [{ required: true, message: '请选择直属强制绑定层级', trigger: 'change' }],
  withdrawMethod: [{ required: true, message: '请选择代理提现方式', trigger: 'change' }]
};

/** 打开弹窗时按配置默认值预填（币种/模式/层级/提现方式取 is_default） */
const resetForm = () => {
  const defaultOf = (list: AgentOption[] | undefined) => {
    const options = list ?? [];
    const preferred = options.find((item) => Number(item.isDefault) === 1);
    return preferred ?? options[0];
  };
  form.hasParent = false;
  form.parentAgentId = undefined;
  form.currency = String(defaultOf(props.options.currencies)?.value ?? 'VND1000:1');
  form.loginName = '';
  form.loginPassword = '';
  form.payPassword = '';
  form.modeId = Number(defaultOf(props.options.modes)?.value ?? 0) || undefined;
  form.layerId = Number(defaultOf(props.options.layers)?.value ?? 0) || undefined;
  form.labelId = Number(defaultOf(props.options.labels)?.value ?? 0) || undefined;
  form.directLayerId = form.layerId;
  form.directLabelId = form.labelId;
  form.withdrawMethod = Number(defaultOf(props.options.withdrawMethods)?.value ?? 1);
  form.brandId = Number(props.options.brands?.[0]?.value ?? 0) || undefined;
  parentOptions.value = [];
};

watch(
  () => props.visible,
  (value) => {
    if (value) {
      resetForm();
    }
  }
);

const onParentToggle = () => {
  form.parentAgentId = undefined;
  if (form.hasParent) {
    searchParent('');
  }
};

const onCurrencyChange = () => {
  parentOptions.value = [];
  if (form.hasParent) {
    searchParent('');
  }
};

const searchParent = async (keyword: string) => {
  parentLoading.value = true;
  try {
    const res: any = await listParentOptions(form.currency, keyword);
    parentOptions.value = (res?.data ?? []) as AgentOption[];
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
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await addAgentAccount({ ...form });
    close(false);
    emit('success', '新增成功');
  } catch (error) {
    // 统一错误提示
  } finally {
    submitting.value = false;
  }
};
</script>
