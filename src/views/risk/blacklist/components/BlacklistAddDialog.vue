<template>
  <el-dialog :model-value="modelValue" :title="title" width="560px" append-to-body @update:model-value="close">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <!-- 会员 / 充值维度：后端只接受单个会员账号（RiskBlacklistAddDTO.memberAccount） -->
      <template v-if="isMemberTab">
        <el-form-item label="会员账号" prop="memberAccount">
          <el-input v-model="form.memberAccount" placeholder="请输入会员账号" clearable />
        </el-form-item>
        <el-form-item v-if="tab === 'member'" label="封禁类型" prop="banType">
          <el-select v-model="form.banType" style="width: 100%">
            <el-option label="黑名单（封号）" :value="1" />
            <el-option label="禁止提现" :value="3" />
            <el-option label="禁止游戏" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab === 'member'" label="封禁天数">
          <el-input-number v-model="form.banDays" :min="0" :precision="0" controls-position="right" style="width: 160px" />
          <span class="form-tip">0 或留空 = 永久</span>
        </el-form-item>
      </template>

      <!-- IP / 手机 / 设备维度 -->
      <template v-else-if="isTargetTab">
        <el-form-item label="新增方式">
          <el-radio-group v-model="form.addMode">
            <el-radio :value="1">单个</el-radio>
            <el-radio :value="2">批量</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="targetLabel" prop="targetValue">
          <el-input
            v-if="form.addMode === 1"
            v-model="form.targetValue"
            :placeholder="'请输入' + targetLabel"
            clearable
          />
          <el-input
            v-else
            v-model="form.valuesText"
            type="textarea"
            :rows="6"
            :placeholder="'一行一个' + targetLabel + '，最多 200 条'"
          />
        </el-form-item>
        <!-- 手机号后端不做限制类型校验（默认注册+登录），因此不展示该字段 -->
        <el-form-item v-if="tab !== 'phone'" label="限制类型" prop="limitSceneTypes">
          <el-checkbox-group v-model="form.limitSceneTypes">
            <el-checkbox :value="1">注册</el-checkbox>
            <el-checkbox :value="2">登录</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>

      <!-- 提现账号维度 -->
      <template v-else>
        <el-form-item label="币种" prop="currency">
          <el-select v-model="form.currency" placeholder="请选择币种" style="width: 100%">
            <el-option v-for="item in currencies" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现大类" prop="withdrawCategory">
          <el-select v-model="form.withdrawCategory" placeholder="请选择提现大类" style="width: 100%">
            <el-option
              v-for="item in options.withdrawCategories || []"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型名称" prop="typeName">
          <el-select v-model="form.typeName" placeholder="请选择类型名称" style="width: 100%">
            <el-option
              v-for="item in options.withdrawTypes || []"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="新增方式">
          <el-radio-group v-model="form.addMode">
            <el-radio :value="1">单个</el-radio>
            <el-radio :value="2">批量</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提现账号/地址" prop="targetValue">
          <el-input
            v-if="form.addMode === 1"
            v-model="form.targetValue"
            placeholder="请输入提现账号/地址"
            maxlength="100"
            show-word-limit
            clearable
          />
          <el-input v-else v-model="form.valuesText" type="textarea" :rows="6" placeholder="一行一个，最多 200 条" />
        </el-form-item>
      </template>

      <el-form-item label="备注" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="2"
          maxlength="50"
          show-word-limit
          placeholder="请输入备注"
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

<script setup name="RiskBlacklistAddDialog" lang="ts">
import { addRiskBlacklist } from '@/api/risk/blacklist';
import type { RiskBlacklistAddForm, RiskBlacklistOptions, RiskBlacklistTab } from '@/api/risk/blacklist/types';
import type { RiskCurrencyOption } from '@/api/risk/reward-monitor/types';
import modal from '@/plugins/modal';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  tab: RiskBlacklistTab;
  options: RiskBlacklistOptions;
  currencies?: RiskCurrencyOption[];
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>();

const formRef = ref<ElFormInstance>();
const saving = ref(false);

const isMemberTab = computed(() => props.tab === 'member' || props.tab === 'recharge');
const isTargetTab = computed(() => props.tab === 'ip' || props.tab === 'phone' || props.tab === 'device');
const targetLabel = computed(() => (props.tab === 'ip' ? 'IP地址' : props.tab === 'phone' ? '手机号' : '设备号'));
const title = computed(() => {
  if (isMemberTab.value) return '新增';
  return isTargetTab.value ? `新增${targetLabel.value}黑名单` : '新增提现账号黑名单';
});

const initForm = () => ({
  memberAccount: '',
  banType: 1,
  banDays: 0,
  addMode: 1,
  targetValue: '',
  valuesText: '',
  limitSceneTypes: [1] as number[],
  currency: '',
  withdrawCategory: '',
  typeName: '',
  reason: ''
});

const form = reactive(initForm());

/** 字段校验按页签区分：只校验当前页签真正会提交的字段，避免隐藏项阻塞提交 */
const rules = computed(() => {
  if (isMemberTab.value) {
    return { memberAccount: [{ required: true, message: '会员账号不能为空', trigger: 'blur' }] };
  }
  if (isTargetTab.value) {
    const base: Record<string, any> = {
      targetValue: [{ required: true, message: `请输入${targetLabel.value}`, trigger: 'blur' }]
    };
    if (props.tab !== 'phone') {
      base.limitSceneTypes = [
        {
          validator: (_rule: any, value: number[], callback: (error?: Error) => void) => {
            if (!value || value.length === 0) {
              callback(new Error('请选择限制类型（注册/登录）'));
              return;
            }
            callback();
          },
          trigger: 'change'
        }
      ];
    }
    return base;
  }
  return {
    currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
    withdrawCategory: [{ required: true, message: '请选择提现大类', trigger: 'change' }],
    typeName: [{ required: true, message: '请选择类型名称', trigger: 'change' }],
    targetValue: [{ required: true, message: '请输入提现账号/地址', trigger: 'blur' }]
  };
});

/** 每次打开都重置：上一次页签的残留值会让「批量」看起来已填但仍提交旧数据 */
watch(
  () => props.modelValue,
  visible => {
    if (!visible) return;
    Object.assign(form, initForm());
    form.currency = props.currencies?.[0]?.value || '';
    formRef.value?.clearValidate();
  }
);

const parseValues = () => {
  if (form.addMode === 2) {
    return form.valuesText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  return form.targetValue ? [form.targetValue.trim()] : [];
};

const buildPayload = (): RiskBlacklistAddForm => {
  const payload: RiskBlacklistAddForm = { tab: props.tab, addMode: form.addMode, reason: form.reason };
  if (isMemberTab.value) {
    payload.memberAccount = form.memberAccount;
    payload.banType = props.tab === 'recharge' ? 4 : form.banType;
    payload.banDays = props.tab === 'recharge' ? 0 : form.banDays;
    return payload;
  }
  payload.values = parseValues();
  if (isTargetTab.value) {
    // 位图：1注册 + 2登录；手机号由后端固定为两者都限制，前端不传
    if (props.tab !== 'phone') {
      payload.limitScene = form.limitSceneTypes.reduce((sum, item) => sum + item, 0);
    }
    return payload;
  }
  payload.currency = form.currency;
  payload.withdrawCategory = form.withdrawCategory;
  payload.typeName = form.typeName;
  return payload;
};

const submit = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (parseValues().length === 0) {
      modal.msgWarning('请填写需要加入名单的内容');
      return;
    }
    saving.value = true;
    try {
      const res = await addRiskBlacklist(buildPayload());
      modal.msgSuccess(`已受理 ${res.data ?? 0} 条`);
      emit('success');
      close();
    } finally {
      saving.value = false;
    }
  });
};

const close = () => emit('update:modelValue', false);
</script>

<style scoped>
.form-tip {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
