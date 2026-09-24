<template>
  <div class="p-2 app-container risk-blacklist-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="会员黑名单" name="member" />
        <el-tab-pane label="IP黑名单" name="ip" />
        <el-tab-pane label="手机黑名单" name="phone" />
        <el-tab-pane label="设备黑名单" name="device" />
        <el-tab-pane label="充值黑名单" name="recharge" />
        <el-tab-pane label="提现账号黑名单" name="withdraw-account" />
      </el-tabs>

      <el-form :inline="true" class="query-form">
        <template v-if="isMemberTab">
          <el-form-item>
            <el-select v-model="query.accountField" style="width: 130px">
              <el-option label="会员账号" value="LOGIN_NAME" />
              <el-option label="会员ID" value="UID" />
              <el-option label="手机号" value="PHONE" />
              <el-option label="真实姓名" value="REAL_NAME" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.accountValue" placeholder="请输入会员账号" clearable style="width: 190px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.accountStatus" placeholder="请选择账号状态" clearable style="width: 150px">
              <el-option label="正常" :value="1" />
              <el-option label="锁定" :value="2" />
              <el-option label="注销" :value="3" />
            </el-select>
          </el-form-item>
        </template>

        <template v-else-if="isTargetTab">
          <el-form-item>
            <el-input v-model="query.keyword" :placeholder="targetPlaceholder" clearable style="width: 220px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item v-if="activeTab !== 'phone'">
            <el-select v-model="query.limitScene" placeholder="限制类型" clearable style="width: 140px">
              <el-option v-for="item in limitSceneOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
            </el-select>
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item>
            <el-select v-model="query.currency" placeholder="币种" clearable style="width: 140px">
              <el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.withdrawCategory" placeholder="提现大类" clearable style="width: 140px">
              <el-option v-for="item in withdrawCategories" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.typeName" placeholder="类型名称" clearable style="width: 150px">
              <el-option v-for="item in withdrawTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.keyword" placeholder="请输入提现账号/地址" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <div class="toolbar-actions">
        <el-button v-hasPermi="['risk:blacklist:add']" type="primary" icon="Plus" @click="openAdd(1)">新增</el-button>
        <el-button v-if="isWithdrawTab" v-hasPermi="['risk:blacklist:add']" type="primary" plain icon="Plus" @click="openAdd(2)">批量新增</el-button>
        <el-button v-if="importable" v-hasPermi="['risk:blacklist:import']" type="warning" plain icon="Upload" @click="triggerImport">批量导入</el-button>
        <el-button v-hasPermi="['risk:blacklist:export']" icon="Download" @click="handleExport">导出报表</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        empty-text="暂无数据"
        row-key="id"
        :data="rows"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" reserve-selection width="46" align="center" />

        <template v-if="isMemberTab">
          <el-table-column label="会员ID" prop="uid" align="center" width="150" show-overflow-tooltip />
          <el-table-column label="会员账号" prop="loginName" align="center" min-width="130" show-overflow-tooltip />
          <el-table-column label="真实姓名" align="center" min-width="120">
            <template #default="scope">{{ scope.row.realName || '—' }}</template>
          </el-table-column>
          <el-table-column label="币种" prop="currency" align="center" width="120" />
          <el-table-column label="充值次数" prop="rechargeCount" align="center" width="100" />
          <el-table-column label="充值" align="center" width="120">
            <template #default="scope">
              <span :class="scope.row.rechargeAmount > 0 ? 'amount-positive' : 'amount-muted'">{{ formatMoney(scope.row.rechargeAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="充提差" align="center" width="120">
            <template #default="scope">
              <span :class="scope.row.balanceDiff < 0 ? 'amount-negative' : 'amount-positive'">{{ formatMoney(scope.row.balanceDiff) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="提现次数" prop="withdrawCount" align="center" width="100" />
          <el-table-column label="提现" align="center" width="120">
            <template #default="scope">{{ formatMoney(scope.row.withdrawAmount) }}</template>
          </el-table-column>
          <el-table-column label="总余额" align="center" width="120">
            <template #default="scope">{{ formatMoney(scope.row.totalBalance) }}</template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="利息宝" align="center" width="110">
            <template #default="scope">{{ formatMoney(scope.row.extraBalance) }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="110">
            <template #default="scope">
              <el-tag type="danger">{{ scope.row.statusText }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册IP地址" align="center" min-width="170" show-overflow-tooltip>
            <template #default="scope">
              <div>{{ scope.row.registerIp || '—' }}</div>
              <div class="text-gray-400 text-xs">{{ scope.row.registerDevice || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="reason" align="center" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="scope">
              <el-button v-hasPermi="['risk:blacklist:remove']" link type="primary" @click="handleRemove(scope.row)">移出黑名单</el-button>
            </template>
          </el-table-column>
        </template>

        <template v-else-if="isTargetTab">
          <el-table-column label="ID" prop="id" align="center" width="150" show-overflow-tooltip />
          <el-table-column :label="targetColumnLabel" prop="targetValueMask" align="center" min-width="260" show-overflow-tooltip />
          <el-table-column v-if="activeTab !== 'phone'" label="限制类型" align="center" width="130">
            <template #default="scope">{{ scope.row.limitSceneText }}</template>
          </el-table-column>
          <el-table-column label="关联账号数" prop="relatedAccountCount" align="center" width="110" />
          <el-table-column label="备注" prop="reason" align="center" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="scope">
              <el-button v-hasPermi="['risk:blacklist:remove']" link type="primary" @click="handleRemove(scope.row)">移出黑名单</el-button>
            </template>
          </el-table-column>
        </template>

        <template v-else>
          <el-table-column label="ID" prop="id" align="center" width="150" show-overflow-tooltip />
          <el-table-column label="币种" prop="currency" align="center" width="130" />
          <el-table-column label="提现大类" align="center" width="130">
            <template #default="scope">{{ scope.row.withdrawCategoryText || scope.row.withdrawCategory }}</template>
          </el-table-column>
          <el-table-column label="类型名称" align="center" width="140">
            <template #default="scope">{{ typeNameText(scope.row.typeName) }}</template>
          </el-table-column>
          <el-table-column label="提现账号/地址" prop="targetValueMask" align="center" min-width="220" show-overflow-tooltip />
          <el-table-column label="备注" prop="reason" align="center" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="scope">
              <el-button v-hasPermi="['risk:blacklist:remove']" link type="primary" @click="handleRemove(scope.row)">移出黑名单</el-button>
            </template>
          </el-table-column>
        </template>

        <el-table-column label="操作人" prop="operatorId" align="center" width="130" />
        <el-table-column label="操作时间" align="center" width="180">
          <template #default="scope">{{ formatTime(scope.row.operatedAt || scope.row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="batch-bar">
        <el-checkbox v-model="selectCurrentPage" @change="toggleCurrentPage">全选当前页</el-checkbox>
        <el-checkbox v-model="selectAllResults" @change="toggleAllResults">全选所有结果</el-checkbox>
        <el-select v-model="batchAction" placeholder="批量操作" style="width: 150px">
          <el-option label="移出黑名单" value="remove" />
        </el-select>
        <el-button type="primary" plain size="small" @click="handleBatch">执行</el-button>
        <span class="ml-2 text-gray-500">已选择 {{ selectedIds.length }} 条数据</span>
        <span class="ml-4 text-gray-500">共 {{ total }} 条</span>
      </div>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="addDialog.visible" :title="addDialog.title" width="560px" append-to-body destroy-on-close>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="120px">
        <el-form-item v-if="isTargetTab || isWithdrawTab" label="新增方式">
          <el-radio-group v-model="addForm.addMode">
            <el-radio :value="1">单个</el-radio>
            <el-radio :value="2">批量</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="isMemberTab">
          <el-form-item label="会员账号" prop="memberAccount">
            <el-input v-model="addForm.memberAccount" placeholder="请输入会员账号或会员ID" />
          </el-form-item>
          <el-form-item v-if="activeTab === 'member'" label="封禁类型">
            <el-select v-model="addForm.banType" style="width: 100%">
              <el-option label="黑名单（同步锁定账号）" :value="1" />
              <el-option label="禁止提现" :value="3" />
              <el-option label="禁止游戏" :value="5" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="isWithdrawTab">
          <el-form-item label="币种" prop="currency">
            <el-select v-model="addForm.currency" placeholder="请选择币种" style="width: 100%">
              <el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="提现大类" prop="withdrawCategory">
            <el-select v-model="addForm.withdrawCategory" placeholder="请选择提现大类" style="width: 100%" @change="onCategoryChange">
              <el-option v-for="item in withdrawCategories" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型名称" prop="typeName">
            <el-select v-model="addForm.typeName" placeholder="请选择类型名称" style="width: 100%">
              <el-option v-for="item in addTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item v-if="isTargetTab || isWithdrawTab" :label="formValueLabel" prop="valuesText">
          <el-input
            v-model="addForm.valuesText"
            :type="addForm.addMode === 2 ? 'textarea' : 'text'"
            :rows="4"
            :maxlength="isWithdrawTab ? 100 : undefined"
            :placeholder="formValuePlaceholder"
          />
        </el-form-item>

        <el-form-item v-if="isTargetTab && activeTab !== 'phone'" label="限制类型" prop="limitSceneList">
          <el-checkbox-group v-model="addForm.limitSceneList">
            <el-checkbox :value="1">注册</el-checkbox>
            <el-checkbox :value="2">登录</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" maxlength="50" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAdd">确认</el-button>
      </template>
    </el-dialog>

    <input ref="fileInputRef" type="file" accept=".csv,text/csv" style="display: none" @change="onFileSelected" />
  </div>
</template>

<script setup name="RiskBlacklist" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';
import {
  addRiskBlacklist,
  exportRiskBlacklist,
  getBlacklistOptions,
  importRiskBlacklist,
  listDeviceBlacklist,
  listIpBlacklist,
  listMemberBlacklist,
  listPhoneBlacklist,
  listRechargeBlacklist,
  listWithdrawBlacklist,
  removeRiskBlacklist
} from '@/api/risk/blacklist';
import { listRewardCurrencies } from '@/api/risk/reward';
import type {
  RiskBlacklistAddForm,
  RiskBlacklistQuery,
  RiskBlacklistTab,
  RiskDictOption
} from '@/api/risk/blacklist/types';

type AnyRow = Record<string, any>;

const { loading, withLoading } = useLoading(true);
const saving = ref(false);
const activeTab = ref<RiskBlacklistTab>('member');
const rows = ref<AnyRow[]>([]);
const total = ref(0);
// 雪花ID 超出 JS 安全整数范围，必须原样透传字符串，禁止 Number() 转换
const selectedIds = ref<Array<number | string>>([]);
const selectCurrentPage = ref(false);
const selectAllResults = ref(false);
const batchAction = ref('remove');
const tableRef = ref();
const addFormRef = ref();
const fileInputRef = ref<HTMLInputElement>();
const addDialog = reactive({ visible: false, title: '新增' });

const query = ref<RiskBlacklistQuery>({ pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME' });
const currencyOptions = ref<RiskDictOption[]>([]);
const withdrawCategories = ref<RiskDictOption[]>([]);
const withdrawTypes = ref<RiskDictOption[]>([]);
const limitSceneOptions = ref<RiskDictOption[]>([
  { label: '注册', value: '1' },
  { label: '登录', value: '2' }
]);

const addForm = reactive<RiskBlacklistAddForm & { valuesText: string; limitSceneList: number[] }>({
  tab: 'member',
  addMode: 1,
  memberAccount: '',
  banType: 1,
  valuesText: '',
  limitSceneList: [1],
  currency: undefined,
  withdrawCategory: '',
  typeName: '',
  reason: ''
});

const isMemberTab = computed(() => activeTab.value === 'member' || activeTab.value === 'recharge');
const isTargetTab = computed(() => activeTab.value === 'ip' || activeTab.value === 'phone' || activeTab.value === 'device');
const isWithdrawTab = computed(() => activeTab.value === 'withdraw-account');
const importable = computed(() => isTargetTab.value || isWithdrawTab.value);

const targetPlaceholder = computed(() =>
  activeTab.value === 'ip' ? '请输入IP地址' : activeTab.value === 'phone' ? '请输入手机号' : '请输入设备号'
);
const targetColumnLabel = computed(() =>
  activeTab.value === 'ip' ? 'IP地址' : activeTab.value === 'phone' ? '手机号' : '设备号'
);
const formValueLabel = computed(() =>
  isWithdrawTab.value ? '提现账号/地址' : activeTab.value === 'ip' ? 'IP地址' : activeTab.value === 'phone' ? '手机号' : '设备号'
);
const formValuePlaceholder = computed(() =>
  addForm.addMode === 2 ? '一行一个，单次最多 200 条' : '请输入' + formValueLabel.value
);
const addTypeOptions = computed(() =>
  withdrawTypes.value.filter((item) => !addForm.withdrawCategory || String(item.remark || '').includes('category=' + addForm.withdrawCategory))
);

const addRules = {
  memberAccount: [{ required: true, message: '会员账号不能为空', trigger: 'blur' }],
  valuesText: [{ required: true, message: '名单内容不能为空', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
  withdrawCategory: [{ required: true, message: '请选择提现大类', trigger: 'change' }],
  typeName: [{ required: true, message: '请选择类型名称', trigger: 'change' }]
};

const formatMoney = (value?: number) => {
  const num = Number(value ?? 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatTime = (value?: string) => (value ? String(value).replace('T', ' ').slice(0, 19) : '—');

const typeNameText = (value?: string) => {
  const hit = withdrawTypes.value.find((item) => item.value === value);
  return hit ? hit.label : value || '—';
};

const getList = async () => {
  selectCurrentPage.value = false;
  selectAllResults.value = false;
  const params: RiskBlacklistQuery = { ...query.value, accountValue: query.value.accountValue || undefined };
  await withLoading(async () => {
    try {
      let res: any;
      if (activeTab.value === 'member') {
        res = await listMemberBlacklist(params);
      } else if (activeTab.value === 'recharge') {
        res = await listRechargeBlacklist(params);
      } else if (activeTab.value === 'ip') {
        res = await listIpBlacklist(params);
      } else if (activeTab.value === 'phone') {
        res = await listPhoneBlacklist(params);
      } else if (activeTab.value === 'device') {
        res = await listDeviceBlacklist(params);
      } else {
        res = await listWithdrawBlacklist(params);
      }
      rows.value = res?.data?.rows ?? res?.rows ?? [];
      total.value = res?.data?.total ?? res?.total ?? 0;
      tableRef.value?.clearSelection();
    } catch (error) {
      rows.value = [];
      total.value = 0;
    }
  });
};

const handleTabChange = () => {
  query.value = { pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME' };
  selectedIds.value = [];
  getList();
};

const handleQuery = () => {
  query.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  query.value = { pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME' };
  getList();
};

const handleSelectionChange = (selection: AnyRow[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const toggleCurrentPage = () => {
  if (selectCurrentPage.value) {
    rows.value.forEach((row) => tableRef.value?.toggleRowSelection(row, true));
  } else {
    tableRef.value?.clearSelection();
    selectedIds.value = [];
  }
};

/** 全选所有结果：按当前筛选取回全部 ID（单次批量上限 200，超出提示分批） */
const toggleAllResults = async () => {
  if (!selectAllResults.value) {
    return;
  }
  const params: RiskBlacklistQuery = { ...query.value, pageNum: 1, pageSize: 200 };
  try {
    const res: any =
      activeTab.value === 'member'
        ? await listMemberBlacklist(params)
        : activeTab.value === 'recharge'
          ? await listRechargeBlacklist(params)
          : activeTab.value === 'ip'
            ? await listIpBlacklist(params)
            : activeTab.value === 'phone'
              ? await listPhoneBlacklist(params)
              : activeTab.value === 'device'
                ? await listDeviceBlacklist(params)
                : await listWithdrawBlacklist(params);
    const all = (res?.data?.rows ?? res?.rows ?? []) as AnyRow[];
    selectedIds.value = all.map((item) => item.id);
    modal.msgSuccess(`已选中当前筛选下 ${selectedIds.value.length} 条（单次批量上限 200 条）`);
  } catch (error) {
    modal.msgError('全选失败，请重试');
  }
};

const openAdd = (mode: number) => {
  addForm.tab = activeTab.value;
  addForm.addMode = mode;
  addForm.memberAccount = '';
  addForm.banType = activeTab.value === 'recharge' ? 4 : 1;
  addForm.valuesText = '';
  addForm.limitSceneList = [1];
  addForm.currency = currencyOptions.value[0]?.value;
  addForm.withdrawCategory = '';
  addForm.typeName = '';
  addForm.reason = '';
  addDialog.title = mode === 2 ? '批量新增' : isWithdrawTab.value ? '新增提现账号黑名单' : '新增';
  addDialog.visible = true;
};

const onCategoryChange = () => {
  addForm.typeName = '';
};

const submitAdd = async () => {
  await addFormRef.value?.validate();
  const values = addForm.valuesText
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if ((isTargetTab.value || isWithdrawTab.value) && values.length === 0) {
    modal.msgError('名单内容不能为空');
    return;
  }
  if (values.length > 200) {
    modal.msgError('单次最多新增 200 条');
    return;
  }
  const payload: RiskBlacklistAddForm = {
    tab: activeTab.value,
    addMode: values.length > 1 ? 2 : 1,
    memberAccount: addForm.memberAccount,
    banType: addForm.banType,
    values,
    limitScene: addForm.limitSceneList.reduce((sum, item) => sum + item, 0),
    currency: addForm.currency,
    withdrawCategory: addForm.withdrawCategory,
    typeName: addForm.typeName,
    reason: addForm.reason
  };
  saving.value = true;
  try {
    const res: any = await addRiskBlacklist(payload);
    modal.msgSuccess(`新增成功（影响 ${res?.data ?? 0} 条）`);
    addDialog.visible = false;
    getList();
  } catch (error) {
    // 业务错误由 request 拦截器统一提示
  } finally {
    saving.value = false;
  }
};

const handleRemove = async (row: AnyRow) => {
  const label = row.loginName || row.targetValueMask || row.id;
  try {
    await modal.confirm(`确认将 ${label} 移出黑名单？`);
  } catch {
    return;
  }
  try {
    const res: any = await removeRiskBlacklist({ tab: activeTab.value, id: row.id });
    modal.msgSuccess(`移出成功（影响 ${res?.data ?? 0} 条）`);
    getList();
  } catch (error) {
    // 统一错误提示
  }
};

const handleBatch = async () => {
  if (batchAction.value !== 'remove') {
    return;
  }
  if (selectedIds.value.length === 0) {
    modal.msgWarning('请先选择需要移出的记录');
    return;
  }
  try {
    await modal.confirm(`确认将已选 ${selectedIds.value.length} 条记录移出黑名单？`);
  } catch {
    return;
  }
  try {
    const res: any = await removeRiskBlacklist({ tab: activeTab.value, ids: selectedIds.value });
    modal.msgSuccess(`移出成功（影响 ${res?.data ?? 0} 条）`);
    selectedIds.value = [];
    getList();
  } catch (error) {
    // 统一错误提示
  }
};

const triggerImport = () => fileInputRef.value?.click();

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }
  try {
    const res: any = await importRiskBlacklist(activeTab.value, file);
    const data = res?.data ?? {};
    const tip = data.duplicated
      ? `该文件已导入过（台账 #${data.logId}），未重复入库`
      : `导入完成：成功 ${data.successCount ?? 0} 条，失败 ${data.failCount ?? 0} 条`;
    data.duplicated ? modal.msgWarning(tip) : modal.msgSuccess(tip);
    getList();
  } catch (error) {
    // 统一错误提示
  }
};

const handleExport = async () => {
  try {
    const blob: any = await exportRiskBlacklist(activeTab.value, query.value);
    saveBlob(blob, `黑名单_${activeTab.value}_${Date.now()}.csv`);
  } catch (error) {
    modal.msgError('导出失败，请稍后重试');
  }
};

const loadOptions = async () => {
  // 字典一律以后端 sys_dict_data 为准（运营在字典管理里改完即可生效），失败时才回退内置值
  try {
    const dict: any = await getBlacklistOptions();
    const data = dict?.data ?? {};
    limitSceneOptions.value = (data.limitScenes ?? []) as RiskDictOption[];
    withdrawCategories.value = (data.withdrawCategories ?? []) as RiskDictOption[];
    withdrawTypes.value = (data.withdrawTypes ?? []) as RiskDictOption[];
  } catch (error) {
    // 忽略：走下面的内置兜底
  }
  try {
    const res: any = await listRewardCurrencies();
    currencyOptions.value = (res?.data ?? []) as RiskDictOption[];
  } catch (error) {
    currencyOptions.value = [];
  }
  if (currencyOptions.value.length === 0) {
    currencyOptions.value = [{ label: '越南(VND1000:1)', value: 'VND1000:1' }];
  }
  if (withdrawCategories.value.length === 0) {
    withdrawCategories.value = [
      { label: '银行卡', value: 'banks' },
      { label: '电子钱包', value: 'ewallet' },
      { label: '加密货币', value: 'crypto' },
      { label: '充值卡', value: 'card' }
    ];
  }
};

onMounted(async () => {
  await loadOptions();
  await getList();
});
</script>

<style scoped>
.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.amount-positive {
  color: #52c41a;
}

.amount-negative {
  color: #f5222d;
}

.amount-muted {
  color: #999;
}
</style>
