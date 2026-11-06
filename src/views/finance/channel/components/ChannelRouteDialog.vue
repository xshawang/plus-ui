<template>
  <el-dialog v-model="visible" :title="form.routeId || form.withdrawChannelId ? '修改子通道' : '新增子通道'" width="920px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
      <el-row :gutter="12">
        <el-col :span="24"><el-divider content-position="left">基础信息</el-divider></el-col>
        <el-col :span="12">
          <el-form-item label="所属大类" prop="groupId">
            <el-select v-model="form.groupId" class="w-full" :disabled="form.methodType === 'P2P'">
              <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道编码" prop="routeCode">
            <el-input v-model="form.routeCode" placeholder="客户端编码，如 FASTPAY / MOMO / USDT:TRC20" @input="syncQuickPayIdentity" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道名称" prop="channelName"><el-input v-model="form.channelName" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户端支付方式" prop="methodType">
            <el-select v-model="form.methodType" class="w-full" @change="handleMethodTypeChange">
              <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道币种"><el-input v-model="form.currency" placeholder="VND" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="运行平台" prop="platform"><el-input v-model="form.platform" placeholder="部署环境，通常为 go88" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开放时段">
            <div class="time-pair">
              <el-input v-model="form.openTimeStart" placeholder="00:00" />
              <span>~</span>
              <el-input v-model="form.openTimeEnd" placeholder="23:59" />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="维护码"><el-input v-model="form.maintenanceCode" placeholder="如 dep / despib" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="渠道图标">
            <div class="stack">
              <image-upload v-model="form.channelIcon" value-mode="url" :limit="1" />
              <el-input v-model="form.channelIcon" placeholder="客户端渠道图标 URL" />
            </div>
          </el-form-item>
        </el-col>
        <el-col v-if="form.methodType !== 'QUICK_PAY'" :span="12">
          <el-form-item label="客户端编码"><el-input v-model="form.clientCode" placeholder="银行编码 / 卡品牌 / 币种" /></el-form-item>
        </el-col>
        <el-col v-if="form.methodType !== 'QUICK_PAY'" :span="12">
          <el-form-item label="客户端子编码"><el-input v-model="form.clientSubCode" placeholder="网络（如 BEP20 / TRC20）" /></el-form-item>
        </el-col>

        <el-col :span="24"><el-divider content-position="left">金额</el-divider></el-col>
        <el-col :span="12">
          <el-form-item label="单笔最低"><el-input-number v-model="form.amountMin" :min="0" controls-position="right" class="w-full" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单笔最高">
            <el-input-number v-model="form.amountMax" :min="0" controls-position="right" class="w-full" />
            <span class="field-hint">0 表示不限</span>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="推荐金额" prop="recommendAmounts">
            <el-input v-model="form.recommendAmounts" placeholder="逗号分隔整数，如 50000,100000,500000" />
            <span class="field-hint">须落在单笔限额内；玩家端下发待 P1 补齐</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="每日限额"><el-input-number v-model="form.dailyLimit" :min="0" controls-position="right" class="w-full" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道费率(%)">
            <el-input :model-value="costFeeText" disabled />
            <span class="field-hint">由可用三方候选的商户费率按权重加权，只读</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="停启用"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="旧地址展示">
            <div class="time-pair">
              <span>V1</span><el-switch v-model="form.addressV1Enabled" :active-value="1" :inactive-value="0" />
              <span>V3</span><el-switch v-model="form.addressV3Enabled" :active-value="1" :inactive-value="0" />
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="24"><RouteMethodFields v-model="form" /></el-col>

        <el-col :span="24">
          <el-form-item label="通道备注"><el-input v-model="form.channelRemark" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
        </el-col>
      </el-row>
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
import { saveChannelRoute } from '@/api/finance/channel';
import type { FinanceChannelGroupVO, FinanceChannelRouteForm } from '@/api/finance/channel/types';
import { saveWithdrawChannelProfile } from '@/api/finance/withdraw-channel';
import type { WithdrawChannelProfileVO } from '@/api/finance/withdraw-channel/types';
import RouteMethodFields from './RouteMethodFields.vue';
import { buildP2pPayload, emptyRouteForm, methodOptions } from '../channel-utils';

const props = defineProps<{
  groups: FinanceChannelGroupVO[];
  /** 打开时要编辑的表单初值（新增时由父组件按大类生成） */
  initial?: FinanceChannelRouteForm;
  /** 只读展示：该子通道当前的加权成本费率 */
  costFeeRate?: number | null;
  /** P2P 子通道对应的原提现渠道档案（保存时保留未在本页编辑的字段） */
  p2pOriginal?: WithdrawChannelProfileVO;
}>();
const emit = defineEmits<{ saved: [] }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive<FinanceChannelRouteForm>(emptyRouteForm());

watch(visible, (open) => {
  if (!open) return;
  Object.keys(form).forEach((key) => delete (form as Record<string, unknown>)[key]);
  Object.assign(form, emptyRouteForm(), props.initial ?? {});
  formRef.value?.clearValidate();
});

const costFeeText = computed(() => (props.costFeeRate == null ? '无可用三方候选' : `${Number(props.costFeeRate).toFixed(4)}`));

const isQuickPay = () => form.methodType === 'QUICK_PAY';
const requiredForQuickPay = (message: string) => (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  if (isQuickPay() && !String(value ?? '').trim()) return callback(new Error(message));
  callback();
};
const validateQuickPayPlatform = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  if (!isQuickPay()) return callback();
  const platformCode = String(value ?? '').trim().toUpperCase();
  const routeCode = String(form.routeCode ?? '').trim().toUpperCase();
  if (!platformCode) return callback(new Error('客户端平台标识不能为空'));
  if (routeCode && platformCode !== routeCode) return callback(new Error('客户端平台标识必须与通道编码一致'));
  callback();
};
/** 与后端 FinanceChannelValidator 同口径：逗号分隔整数且在单笔限额内（最高 0 = 不限） */
const validateRecommend = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  const text = String(value ?? '').trim();
  if (!text) return callback();
  if (!/^\d+(,\d+)*$/.test(text)) return callback(new Error('推荐金额必须为逗号分隔的整数'));
  const low = Number(form.amountMin || 0);
  const high = Number(form.amountMax || 0) > 0 ? Number(form.amountMax) : Number.MAX_SAFE_INTEGER;
  const bad = text.split(',').map(Number).find((amount) => amount < low || amount > high);
  if (bad !== undefined) return callback(new Error(`推荐金额 ${bad} 超出单笔限额`));
  callback();
};

const rules: FormRules = {
  groupId: [{ required: true, message: '所属大类不能为空', trigger: 'change' }],
  routeCode: [{ required: true, message: '通道编码不能为空', trigger: 'blur' }],
  channelName: [{ required: true, message: '通道名称不能为空', trigger: 'blur' }],
  methodType: [{ required: true, message: '客户端支付方式不能为空', trigger: 'change' }],
  platform: [{ required: true, message: '运行平台不能为空', trigger: 'blur' }],
  recommendAmounts: [{ validator: validateRecommend, trigger: 'blur' }],
  clientCode: [{ validator: validateQuickPayPlatform, trigger: 'blur' }],
  prefix: [{ validator: requiredForQuickPay('档位前缀不能为空'), trigger: 'blur' }],
  receiveNumber: [{ validator: requiredForQuickPay('收款账户号不能为空'), trigger: 'blur' }],
  accountName: [{ validator: requiredForQuickPay('收款账户名不能为空'), trigger: 'blur' }]
};

const syncQuickPayIdentity = () => {
  if (!isQuickPay()) return;
  const routeCode = String(form.routeCode ?? '').trim().toUpperCase();
  form.clientCode = routeCode;
  if (!String(form.prefix ?? '').trim()) form.prefix = routeCode;
};

const handleMethodTypeChange = () => {
  form.configRefId = undefined;
  if (form.methodType === 'CRYPTO') {
    form.currency = form.currency || 'USDT';
  } else if (form.methodType === 'QUICK_PAY') {
    syncQuickPayIdentity();
  } else if (form.methodType === 'P2P') {
    form.payoutMode = 'P2P';
    form.beneficiaryType = 'P2P_BANK';
    form.currency = 'VND';
    form.p2pPrice = form.p2pPrice || 1000;
    form.p2pPaymentTimeLimit = form.p2pPaymentTimeLimit || 10;
  }
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (form.methodType === 'P2P') {
      await saveWithdrawChannelProfile(buildP2pPayload(form, props.p2pOriginal));
    } else {
      await saveChannelRoute({ ...form, direction: 1 });
    }
    modal.msgSuccess('保存成功');
    visible.value = false;
    emit('saved');
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
  gap: 10px;
  width: 100%;
}

.time-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
}

.field-hint {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
