<template>
  <div class="p-2 app-container finance-withdraw-channel-page">
    <el-card shadow="hover" class="search-panel">
      <template #header>
        <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
          <h3>筛选条件</h3>
        </div>
      </template>
      <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="提现标签">
          <el-select v-model="queryParams.tabCode" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="tab in tabs" :key="tab.tabCode" :label="tab.displayName" :value="tab.tabCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="出款模式">
          <el-select v-model="queryParams.payoutMode" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="item in payoutModes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-input v-model="queryParams.platform" placeholder="go88" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="queryParams.channelKeyword" placeholder="编号/名称/商户" clearable style="width: 190px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadProfiles">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        提现渠道使用独立路由表，不读取充值大类或充值通道路由。
        客户端可控制：标签顺序、显示/隐藏、NEW、维护状态。不可控制：标签文字、页面字段布局、新增任意标签类型、默认标签。
        NEW 图标使用独立索引，页面按 tabCode 分别生成隐藏数组与 NEW 数组。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>提现渠道维护</h3>
            <p>标签维护开关控制整类提现渠道，展开后每个具体通道的维护开关控制该渠道。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" icon="Edit" @click="openTabs">
              编辑标签顺序与标记
            </el-button>
            <el-button icon="View" @click="showManifest">查看客户端下发值</el-button>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openAdd">
              新增渠道配置
            </el-button>
            <el-button icon="Refresh" @click="loadAll">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="loadProfiles" />
          </div>
        </div>
      </template>
      <el-collapse v-loading="loading || tabsLoading" v-model="activeTabCodes">
        <el-collapse-item v-for="tab in tabs" :key="tab.tabCode" :name="tab.tabCode">
          <template #title>
            <div class="group-title">
              <span class="group-name">{{ tab.displayName }}</span>
              <el-tag size="small" class="ml-2">{{ tab.tabCode }}</el-tag>
              <el-tag size="small" :type="tab.status === 1 ? 'success' : 'danger'" class="ml-2">
                {{ tab.status === 1 ? '启用' : '维护中' }}
              </el-tag>
              <el-tag size="small" :type="tab.visible === 1 ? 'primary' : 'info'" class="ml-2">
                {{ tab.visible === 1 ? '客户端显示' : '客户端隐藏' }}
              </el-tag>
              <el-tag v-if="tab.newTag === 1" size="small" type="danger" class="ml-2">NEW</el-tag>
              <span class="ml-3 text-gray-400 text-sm">排序 {{ tab.sortNo }}</span>
              <span class="ml-3 text-gray-400 text-sm">通道 {{ channelsByTab(tab.tabCode).length }} 条</span>
              <span class="ml-4 maintenance-switch" @click.stop>
                <span class="text-gray-500 text-sm">维护开关</span>
                <el-switch
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  :model-value="tab.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(value: number) => toggleTabStatus(tab as WithdrawTabVO, value)"
                />
              </span>
            </div>
          </template>
          <div class="group-actions">
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" link type="primary" @click="openTabs">
              编辑标签顺序与标记
            </el-button>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" link type="primary" @click="openAdd(tab.tabCode)">
              新增该标签渠道
            </el-button>
          </div>
          <el-table border size="small" :data="channelsByTab(tab.tabCode)" class="data-table">
            <el-table-column label="渠道编码" prop="channelCode" width="160" show-overflow-tooltip />
            <el-table-column label="渠道名称" prop="channelName" min-width="170" show-overflow-tooltip />
            <el-table-column label="客户端标识" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                {{ [row.clientCode, row.clientSubCode].filter(Boolean).join(' / ') || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="平台入口" prop="platformKey" width="120" show-overflow-tooltip />
            <el-table-column label="商户" prop="merchantName" min-width="150" show-overflow-tooltip />
            <el-table-column label="出款模式" width="130">
              <template #default="{ row }">{{ optionLabel(payoutModes, row.payoutMode) }}</template>
            </el-table-column>
            <el-table-column label="兑换比例" width="170" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.rateFrom ?? 1) }} {{ row.currency || 'VND' }}
                :
                {{ formatMoney(row.rateTo ?? row.clientPrice) }} {{ row.settlementCurrency }}
              </template>
            </el-table-column>
            <el-table-column label="运营时段" width="150" align="center">
              <template #default="{ row }">{{ row.openTimeStart || '00:00' }} - {{ row.openTimeEnd || '23:59' }}</template>
            </el-table-column>
            <el-table-column label="单笔限额" width="190" align="right">
              <template #default="{ row }">{{ formatMoneyRange(row.amountMin ?? 0, row.amountMax ?? 0) }}</template>
            </el-table-column>
            <el-table-column label="每日限额" width="130" align="right">
              <template #default="{ row }">{{ row.dailyLimit ? formatMoney(row.dailyLimit) : '不限' }}</template>
            </el-table-column>
            <el-table-column label="维护码" prop="maintenanceCode" width="140" />
            <el-table-column label="维护开关" width="110" align="center">
              <template #default="{ row }">
                <el-switch
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(value: number) => toggleStatus(row as WithdrawChannelProfileVO, value)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  link
                  type="primary"
                  @click="openEdit(row as WithdrawChannelProfileVO)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog v-model="tabsDialog" title="提现标签顺序与客户端标记" width="880px" append-to-body>
      <el-alert
        title="标签文字、页面字段布局、默认标签不可由接口控制；tabsWithdrawToHide 与 tabsWithNewTagWithdraw 使用不同索引。"
        type="warning"
        :closable="false"
        class="mb-3"
      />
      <el-table :data="tabForms" border>
        <el-table-column label="标签" prop="displayName" min-width="130">
          <template #default="{ row }">
            <el-input v-model="row.displayName" />
          </template>
        </el-table-column>
        <el-table-column label="编码" prop="tabCode" width="100" />
        <el-table-column label="排序" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.sortNo" :min="1" :max="99" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="显示" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.visible" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="NEW" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.newTag" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="tabsDialog = false">取消</el-button>
        <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" :loading="submitting" @click="submitTabs">
          保存并生成下发值
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="profileDialog" :title="profileForm.withdrawChannelId ? '编辑提现渠道' : '新增提现渠道'" width="900px" append-to-body>
      <el-form ref="profileFormRef" :model="profileForm" :rules="rules" label-width="140px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="渠道编码" prop="channelCode">
              <el-input v-model="profileForm.channelCode" placeholder="唯一编码，如 BANK_VCB_01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input v-model="profileForm.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提现标签" prop="tabCode">
              <el-select v-model="profileForm.tabCode" style="width: 100%">
                <el-option v-for="tab in tabs" :key="tab.tabCode" :label="tab.displayName" :value="tab.tabCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台标识" prop="platform">
              <el-input v-model="profileForm.platform" placeholder="go88" />
            </el-form-item>
          </el-col>
          <el-col v-if="profileForm.tabCode === 'BANK'" :span="24">
            <el-form-item label="支持银行">
              <el-select
                v-model="profileForm.supportedBankCodes"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入银行编码后回车"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出款模式" prop="payoutMode">
              <el-select v-model="profileForm.payoutMode" style="width: 100%">
                <el-option v-for="item in payoutModes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算币种" prop="settlementCurrency">
              <el-input v-model="profileForm.settlementCurrency" placeholder="VND / USDT / COIN12" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="兑换比例" prop="rateTo">
              <div class="flex items-center gap-2">
                <el-input-number v-model="profileForm.rateFrom" :min="0.00000001" :precision="8" />
                <span>平台币 :</span>
                <el-input-number v-model="profileForm.rateTo" :min="0.00000001" :precision="8" />
                <span>结算币</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最低">
              <el-input-number v-model="profileForm.amountMin" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最高（0不限）">
              <el-input-number v-model="profileForm.amountMax" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日限额（0不限）">
              <el-input-number v-model="profileForm.dailyLimit" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="收款地址">
              <el-input v-model="profileForm.beneficiaryAddress" placeholder="USDT 收款地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营开始时间">
              <el-time-picker
                v-model="profileForm.openTimeStart"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营结束时间">
              <el-time-picker
                v-model="profileForm.openTimeEnd"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费模式" prop="feeMode">
              <el-select v-model="profileForm.feeMode" style="width: 100%">
                <el-option v-for="item in feeModes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费比例(%)" prop="feeRate">
              <el-input-number v-model="profileForm.feeRate" :min="0" :precision="6" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费币种" prop="feeCurrency">
              <el-input v-model="profileForm.feeCurrency" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款类型" prop="beneficiaryType">
              <el-select v-model="profileForm.beneficiaryType" style="width: 100%">
                <el-option
                  v-for="item in beneficiaryTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="profileForm.priorityNo" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="profileForm.sortNo" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="profileForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="profileDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="manifestDialog" title="客户端提现配置下发值" width="720px" append-to-body>
      <el-input :model-value="manifestText" type="textarea" :rows="20" readonly />
    </el-dialog>
  </div>
</template>

<script setup name="FinanceWithdrawChannel" lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import type {
  WithdrawChannelProfileForm,
  WithdrawChannelProfileVO,
  WithdrawChannelQuery,
  WithdrawTabForm,
  WithdrawTabVO
} from '@/api/finance/withdraw-channel/types';
import {
  changeWithdrawTabStatus,
  changeWithdrawChannelStatus,
  getWithdrawClientManifest,
  listWithdrawChannelProfiles,
  listWithdrawTabs,
  saveWithdrawChannelProfile,
  saveWithdrawTabs
} from '@/api/finance/withdraw-channel';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { formatMoney, formatMoneyRange } from '@/utils/money';

const payoutModes = [
  { label: '人工出款', value: 'MANUAL' },
  { label: '三方代付', value: 'THIRD_PARTY' },
  { label: 'P2P 交易所', value: 'P2P' },
  { label: '币商/Coin12', value: 'COIN_EXCHANGE' }
];
const rateModes = [
  { label: '不需要', value: 'NONE' },
  { label: '固定汇率', value: 'FIXED' },
  { label: '实时汇率', value: 'REALTIME' },
  { label: '三方报价', value: 'PROVIDER_QUOTE' }
];
const feeModes = [
  { label: '无手续费', value: 'NONE' },
  { label: '按比例', value: 'RATE' }
];
const beneficiaryTypes = [
  { label: '银行账户', value: 'BANK' },
  { label: '充值卡', value: 'CARD' },
  { label: '链上地址', value: 'CRYPTO_ADDRESS' },
  { label: 'P2P 银行账户', value: 'P2P_BANK' }
];

const tabs = ref<WithdrawTabVO[]>([]);
const tabForms = ref<WithdrawTabForm[]>([]);
const profiles = ref<WithdrawChannelProfileVO[]>([]);
const activeTabCodes = ref<string[]>([]);
const tabsDialog = ref(false);
const profileDialog = ref(false);
const manifestDialog = ref(false);
const manifestText = ref('');
const submitting = ref(false);
const tabsLoading = ref(false);
const profileFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();

const defaultProfile = (): WithdrawChannelProfileForm => ({
  channelCode: '',
  channelName: '',
  platformKey: '',
  platformUrl: '',
  iconArt: '',
  tabCode: 'BANK',
  platform: 'go88',
  payoutMode: 'MANUAL',
  merchantId: undefined,
  clientCode: '',
  clientSubCode: '',
  supportedBankCodes: [],
  currency: 'VND',
  settlementCurrency: 'VND',
  rateFrom: 1,
  rateTo: 1,
  clientPrice: 1,
  beneficiaryAddress: '',
  amountMin: 0,
  amountMax: 0,
  dailyLimit: 0,
  maintenanceCode: '',
  openTimeStart: '00:00',
  openTimeEnd: '23:59',
  rateMode: 'NONE',
  exchangeRate: 1,
  feeMode: 'NONE',
  feeRate: 0,
  feeFixed: 0,
  feeCurrency: 'VND',
  beneficiaryType: 'BANK',
  accountPattern: '',
  clientFieldSchemaJson: '{}',
  channelConfigJson: '{}',
  priorityNo: 0,
  sortNo: 0,
  status: 1,
  frontEnable: 1,
  remark: ''
});

const queryParams = reactive<WithdrawChannelQuery>({
  tabCode: undefined,
  platform: undefined,
  payoutMode: undefined,
  channelKeyword: ''
});
const profileForm = reactive<WithdrawChannelProfileForm>(defaultProfile());
const rules: FormRules = {
  channelCode: [{ required: true, message: '请输入渠道编码', trigger: 'blur' }],
  channelName: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  tabCode: [{ required: true, message: '请选择提现标签', trigger: 'change' }],
  platform: [{ required: true, message: '请输入平台标识', trigger: 'blur' }],
  payoutMode: [{ required: true, message: '请选择出款模式', trigger: 'change' }],
  currency: [{ required: true, message: '请输入原始币种', trigger: 'blur' }],
  settlementCurrency: [{ required: true, message: '请输入结算币种', trigger: 'blur' }],
  clientPrice: [
    { required: true, message: '请输入兑换比例', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) <= 0) callback(new Error('兑换比例必须大于 0'));
        else callback();
      },
      trigger: 'blur'
    }
  ],
  rateTo: [
    {
      validator: (_rule, _value, callback) => {
        if (Number(profileForm.rateFrom) <= 0 || Number(profileForm.rateTo) <= 0) {
          callback(new Error('兑换比例左右值必须大于 0'));
        } else callback();
      },
      trigger: 'change'
    }
  ],
  rateMode: [{ required: true, message: '请选择汇率模式', trigger: 'change' }],
  feeMode: [{ required: true, message: '请选择手续费模式', trigger: 'change' }],
  beneficiaryType: [{ required: true, message: '请选择收款类型', trigger: 'change' }]
};

const optionLabel = (options: Array<{ label: string; value: string }>, value: string) =>
  options.find((item) => item.value === value)?.label ?? value;

const loadTabs = async () => {
  tabsLoading.value = true;
  try {
    const res = await listWithdrawTabs();
    tabs.value = res.data ?? [];
    if (activeTabCodes.value.length === 0) {
      activeTabCodes.value = tabs.value.slice(0, 2).map((tab) => tab.tabCode);
    }
  } finally {
    tabsLoading.value = false;
  }
};

const loadProfiles = async () => {
  await withLoading(async () => {
    const res = await listWithdrawChannelProfiles({ ...queryParams });
    profiles.value = res.data ?? [];
  });
};

const loadAll = async () => {
  await Promise.all([loadTabs(), loadProfiles()]);
};

const resetQuery = () => {
  queryParams.tabCode = undefined;
  queryParams.payoutMode = undefined;
  queryParams.platform = undefined;
  queryParams.channelKeyword = '';
  loadProfiles();
};

const openTabs = () => {
  tabForms.value = tabs.value.map((tab) => ({
    tabId: tab.tabId,
    tabCode: tab.tabCode,
    displayName: tab.displayName,
    sortNo: tab.sortNo,
    visible: tab.visible,
    newTag: tab.newTag,
    isDefault: tab.isDefault,
    remark: tab.remark
  }));
  tabsDialog.value = true;
};

const submitTabs = async () => {
  submitting.value = true;
  try {
    const res = await saveWithdrawTabs(tabForms.value);
    manifestText.value = JSON.stringify(res.data, null, 2);
    modal.msgSuccess('标签配置已保存');
    tabsDialog.value = false;
    await loadTabs();
  } finally {
    submitting.value = false;
  }
};

const showManifest = async () => {
  const res = await getWithdrawClientManifest();
  manifestText.value = JSON.stringify(res.data, null, 2);
  manifestDialog.value = true;
};

const channelsByTab = (tabCode: string) => profiles.value.filter((profile) => profile.tabCode === tabCode);

const openAdd = (tabCode?: string) => {
  Object.assign(profileForm, defaultProfile());
  if (tabCode) {
    profileForm.tabCode = tabCode;
  }
  profileDialog.value = true;
};

const openEdit = (row: WithdrawChannelProfileVO) => {
  Object.assign(profileForm, {
    withdrawChannelId: row.withdrawChannelId,
    channelCode: row.channelCode,
    channelName: row.channelName,
    platformKey: row.platformKey ?? '',
    platformUrl: row.platformUrl ?? '',
    iconArt: row.iconArt ?? '',
    tabCode: row.tabCode,
    platform: row.platform,
    payoutMode: row.payoutMode,
    merchantId: row.merchantId,
    clientCode: row.clientCode ?? '',
    clientSubCode: row.clientSubCode ?? '',
    supportedBankCodes: row.supportedBankCodes
      ? row.supportedBankCodes
          .split(',')
          .map((code) => code.trim())
          .filter(Boolean)
      : [],
    currency: row.currency,
    settlementCurrency: row.settlementCurrency,
    rateFrom: Number(row.rateFrom ?? 1),
    rateTo: Number(row.rateTo ?? row.exchangeRate ?? row.clientPrice),
    clientPrice: Number(row.clientPrice ?? 0),
    beneficiaryAddress: row.beneficiaryAddress ?? '',
    amountMin: row.amountMin ?? 0,
    amountMax: row.amountMax ?? 0,
    dailyLimit: row.dailyLimit ?? 0,
    maintenanceCode: row.maintenanceCode ?? '',
    openTimeStart: row.openTimeStart || '00:00',
    openTimeEnd: row.openTimeEnd || '23:59',
    rateMode: row.rateMode,
    exchangeRate: Number(row.exchangeRate),
    feeMode: row.feeMode,
    feeRate: Number(row.feeRate),
    feeFixed: Number(row.feeFixed),
    feeCurrency: row.settlementCurrency,
    beneficiaryType: row.beneficiaryType,
    accountPattern: row.accountPattern ?? '',
    clientFieldSchemaJson: row.clientFieldSchemaJson ?? '{}',
    channelConfigJson: row.channelConfigJson ?? '{}',
    priorityNo: row.priorityNo ?? 0,
    sortNo: row.sortNo ?? 0,
    status: row.status,
    frontEnable: row.frontEnable,
    remark: row.remark ?? ''
  });
  profileDialog.value = true;
};

const submitProfile = async () => {
  const rateFrom = Number(profileForm.rateFrom);
  const rateTo = Number(profileForm.rateTo);
  profileForm.clientPrice = rateFrom > 0 && rateTo > 0 ? rateTo / rateFrom : 0;
  profileForm.exchangeRate = profileForm.clientPrice;
  profileForm.frontEnable = profileForm.status;
  const valid = await profileFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    await saveWithdrawChannelProfile({ ...profileForm });
    modal.msgSuccess('提现渠道配置已保存');
    profileDialog.value = false;
    await loadProfiles();
  } finally {
    submitting.value = false;
  }
};

watch(
  () => profileForm.settlementCurrency,
  (value) => {
    profileForm.feeCurrency = (value || 'VND').toUpperCase();
  }
);

const toggleStatus = async (row: WithdrawChannelProfileVO, status: number) => {
  await changeWithdrawChannelStatus(row.withdrawChannelId, status);
  modal.msgSuccess(status === 1 ? '渠道维护已解除' : '渠道已进入维护');
  await loadProfiles();
};

const toggleTabStatus = async (tab: WithdrawTabVO, status: number) => {
  await changeWithdrawTabStatus(tab.tabId, status);
  modal.msgSuccess(status === 1 ? '提现标签维护已解除' : '提现标签已进入维护');
  await loadAll();
};

loadAll();
</script>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.group-name {
  font-weight: 600;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.maintenance-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
