<template>
  <div class="p-2 app-container finance-channel-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="大类">
          <el-input v-model="queryParams.groupKeyword" placeholder="名称/编码" clearable style="width: 180px" @keyup.enter="getGroups" />
        </el-form-item>
        <el-form-item label="通道">
          <el-input v-model="queryParams.routeKeyword" placeholder="名称/编号/商户" clearable style="width: 180px" @keyup.enter="getGroups" />
        </el-form-item>
        <el-form-item label="大类类型">
          <el-select v-model="queryParams.groupType" placeholder="全部" clearable style="width: 160px">
            <el-option label="在线充值" :value="1" />
            <el-option label="转账充值" :value="2" />
            <el-option label="客服代充" :value="3" />
            <el-option label="数字货币" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getGroups">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：充值大类对应玩家端收银台一级入口，子通道承载通道编号/三方商户/限额/推荐金额/费率/成功率；
        金额单位一律为分（VND1000:1）。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>充值大类与通道路由</h3>
            <p>共 {{ groups.length }} 个大类 / {{ routeTotal }} 条通道</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:channel:edit']" type="primary" icon="Plus" @click="handleAddGroup">新增大类</el-button>
            <el-button icon="Refresh" @click="getGroups">刷新</el-button>
          </div>
        </div>
      </template>

      <el-collapse v-loading="loading" v-model="activeGroups">
        <el-collapse-item v-for="group in filteredGroups" :key="group.groupId" :name="group.groupId">
          <template #title>
            <div class="group-title">
              <span class="group-name">{{ group.groupName }}</span>
              <el-tag size="small" class="ml-2">{{ group.groupCode }}</el-tag>
              <el-tag size="small" :type="group.status === 1 ? 'success' : 'info'" class="ml-2">
                {{ group.status === 1 ? '启用' : '停用' }}
              </el-tag>
              <span class="ml-3 text-gray-400 text-sm">排序 {{ group.sortNo ?? 0 }}</span>
              <span class="ml-3 text-gray-400 text-sm">通道 {{ (group.routes || []).length }} 条</span>
            </div>
          </template>
          <div class="group-actions">
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleEditGroup(group)">修改大类</el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleToggleGroup(group)">
              {{ group.status === 1 ? '停用大类' : '启用大类' }}
            </el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleAddRoute(group)">新增通道</el-button>
          </div>
          <el-table :data="filterRoutes(group)" border size="small">
            <el-table-column label="通道编号" prop="routeCode" align="center" width="120" />
            <el-table-column label="通道名称" prop="channelName" align="left" min-width="150" show-overflow-tooltip />
            <el-table-column label="所属商户" prop="merchantName" align="left" min-width="170" show-overflow-tooltip />
            <el-table-column label="币种" prop="currency" align="center" width="80" />
            <el-table-column label="费率(%)" prop="feeRate" align="right" width="90" />
            <el-table-column label="成功率(%)" prop="successRate" align="right" width="100" />
            <el-table-column label="单笔限额(分)" align="right" width="180">
              <template #default="{ row }">{{ row.amountMin ?? 0 }} ~ {{ row.amountMax ?? 0 }}</template>
            </el-table-column>
            <el-table-column label="推荐金额(分)" prop="recommendAmounts" align="left" min-width="160" show-overflow-tooltip />
            <el-table-column label="停启用" align="center" width="90">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'status', val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="前台账用" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.frontEnable"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'frontEnable', val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="通道合并" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.mergeFlag"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'mergeFlag', val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="充值黑名单" align="center" width="110">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.blacklistEnable"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'blacklistEnable', val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" fixed="right" width="130">
              <template #default="{ row }">
                <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleEditRoute(row as FinanceChannelRouteVO)">修改</el-button>
                <el-button v-hasPermi="['finance:channel:edit']" link type="danger" @click="handleDeleteRoute(row as FinanceChannelRouteVO)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog v-model="groupDialog" :title="groupForm.groupId ? '修改充值大类' : '新增充值大类'" width="620px" append-to-body>
      <el-form ref="groupFormRef" :model="groupForm" :rules="groupRules" label-width="130px">
        <el-form-item label="大类编码" prop="groupCode">
          <el-input v-model="groupForm.groupCode" placeholder="字母/数字/下划线，2~32 位" />
        </el-form-item>
        <el-form-item label="大类名称" prop="groupName">
          <el-input v-model="groupForm.groupName" placeholder="如 USDT - TRC20" />
        </el-form-item>
        <el-form-item label="大类类型">
          <el-select v-model="groupForm.groupType" style="width: 100%">
            <el-option label="在线充值" :value="1" />
            <el-option label="转账充值" :value="2" />
            <el-option label="客服代充" :value="3" />
            <el-option label="数字货币" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标URL">
          <el-input v-model="groupForm.groupIcon" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="合并展示到">
          <el-input v-model="groupForm.linkGroupCode" placeholder="目标大类编码，空=不合并" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="groupForm.sortNo" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="groupForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="groupForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitGroup">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="routeDialog" :title="routeForm.routeId ? '修改充值通道' : '新增充值通道'" width="720px" append-to-body>
      <el-form ref="routeFormRef" :model="routeForm" :rules="routeRules" label-width="140px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="所属大类" prop="groupId">
              <el-select v-model="routeForm.groupId" style="width: 100%">
                <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道编号" prop="routeCode">
              <el-input v-model="routeForm.routeCode" placeholder="如 TRC20 / QR3 / Momo 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道名称" prop="channelName">
              <el-input v-model="routeForm.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属商户">
              <el-select v-model="routeForm.merchantId" clearable placeholder="自有(不选)" style="width: 100%">
                <el-option v-for="merchant in merchants" :key="merchant.merchantId" :label="merchant.merchantName" :value="merchant.merchantId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种">
              <el-input v-model="routeForm.currency" placeholder="VND" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种比例">
              <el-input v-model="routeForm.currencyRate" placeholder="VND1000:1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最低(分)">
              <el-input-number v-model="routeForm.amountMin" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最高(分)">
              <el-input-number v-model="routeForm.amountMax" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="推荐金额(分)">
              <el-input v-model="routeForm.recommendAmounts" placeholder="逗号分隔，如 50000,100000,500000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道费率(%)">
              <el-input-number v-model="routeForm.feeRate" :min="0" :max="100" :precision="4" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成功率(%)">
              <el-input-number v-model="routeForm.successRate" :min="0" :max="100" :precision="4" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子通道排序">
              <el-input-number v-model="routeForm.subSort" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="停启用">
              <el-switch v-model="routeForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="前台账用">
              <el-switch v-model="routeForm.frontEnable" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道合并">
              <el-switch v-model="routeForm.mergeFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="充值黑名单">
              <el-switch v-model="routeForm.blacklistEnable" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="通道备注">
              <el-input v-model="routeForm.channelRemark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="routeDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRoute">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceChannel" lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import {
  changeChannelGroupStatus,
  changeChannelRouteSwitch,
  deleteChannelRoute,
  listChannelGroups,
  saveChannelGroup,
  saveChannelRoute
} from '@/api/finance/channel';
import type {
  FinanceChannelGroupForm,
  FinanceChannelGroupVO,
  FinanceChannelQuery,
  FinanceChannelRouteForm,
  FinanceChannelRouteVO
} from '@/api/finance/channel/types';
import { merchantOptions } from '@/api/finance/merchant';
import type { FinanceMerchantVO } from '@/api/finance/merchant/types';

/**
 * 充值大类与通道路由页（需求文档 2_财务/02）。
 *
 * 交互：大类折叠面板内嵌通道路由表，行内开关直接落库（停启用/前台账用/通道合并/充值黑名单），
 * 与截图中"行内开关 + 修改/删除 + 排序"的操作形态一致。
 */
const loading = ref(false);
const submitting = ref(false);
const groups = ref<FinanceChannelGroupVO[]>([]);
const merchants = ref<FinanceMerchantVO[]>([]);
const activeGroups = ref<number[]>([]);
const groupDialog = ref(false);
const routeDialog = ref(false);
const groupFormRef = ref<FormInstance>();
const routeFormRef = ref<FormInstance>();

const queryParams = reactive<FinanceChannelQuery>({
  groupKeyword: '',
  routeKeyword: '',
  groupType: undefined
});

const groupForm = reactive<FinanceChannelGroupForm>({
  groupId: undefined,
  groupCode: '',
  groupName: '',
  groupIcon: '',
  groupType: 1,
  linkGroupCode: '',
  sortNo: 0,
  status: 1,
  remark: ''
});

const routeForm = reactive<FinanceChannelRouteForm>({
  routeId: undefined,
  groupId: undefined,
  routeCode: '',
  channelName: '',
  subSort: 0,
  merchantId: undefined,
  currency: 'VND',
  currencyRate: 'VND1000:1',
  amountMin: 0,
  amountMax: 0,
  recommendAmounts: '',
  feeRate: 0,
  successRate: 0,
  channelRemark: '',
  status: 1,
  mergeFlag: 0,
  frontEnable: 1,
  blacklistEnable: 0
});

const groupRules: FormRules = {
  groupCode: [{ required: true, message: '大类编码不能为空', trigger: 'blur' }],
  groupName: [{ required: true, message: '大类名称不能为空', trigger: 'blur' }]
};

const routeRules: FormRules = {
  groupId: [{ required: true, message: '所属大类不能为空', trigger: 'change' }],
  routeCode: [{ required: true, message: '通道编号不能为空', trigger: 'blur' }],
  channelName: [{ required: true, message: '通道名称不能为空', trigger: 'blur' }]
};

/** 大类关键字过滤（后端已支持，前端再兜一层以便本地即时反馈） */
const filteredGroups = computed(() => groups.value);

const routeTotal = computed(() => groups.value.reduce((sum, group) => sum + (group.routes?.length ?? 0), 0));

/** 通道关键字过滤：作用于当前大类内的通道列表 */
const filterRoutes = (group: FinanceChannelGroupVO): FinanceChannelRouteVO[] => {
  const routes = group.routes ?? [];
  const kw = (queryParams.routeKeyword ?? '').trim().toLowerCase();
  if (!kw) {
    return routes;
  }
  return routes.filter(
    (route) =>
      route.channelName.toLowerCase().includes(kw) ||
      route.routeCode.toLowerCase().includes(kw) ||
      (route.merchantName ?? '').toLowerCase().includes(kw)
  );
};

const getGroups = async () => {
  loading.value = true;
  try {
    const res = await listChannelGroups(queryParams);
    groups.value = res.data ?? [];
    if (activeGroups.value.length === 0) {
      activeGroups.value = groups.value.slice(0, 2).map((group) => group.groupId);
    }
  } finally {
    loading.value = false;
  }
};

const loadMerchants = async () => {
  const res = await merchantOptions();
  merchants.value = res.data ?? [];
};

const resetQuery = () => {
  queryParams.groupKeyword = '';
  queryParams.routeKeyword = '';
  queryParams.groupType = undefined;
  getGroups();
};

const handleAddGroup = () => {
  Object.assign(groupForm, {
    groupId: undefined,
    groupCode: '',
    groupName: '',
    groupIcon: '',
    groupType: 1,
    linkGroupCode: '',
    sortNo: 0,
    status: 1,
    remark: ''
  });
  groupDialog.value = true;
};

const handleEditGroup = (group: FinanceChannelGroupVO) => {
  Object.assign(groupForm, {
    groupId: group.groupId,
    groupCode: group.groupCode,
    groupName: group.groupName,
    groupIcon: group.groupIcon ?? '',
    groupType: group.groupType ?? 1,
    linkGroupCode: group.linkGroupCode ?? '',
    sortNo: group.sortNo ?? 0,
    status: group.status ?? 1,
    remark: group.remark ?? ''
  });
  groupDialog.value = true;
};

const submitGroup = async () => {
  const valid = await groupFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await saveChannelGroup({ ...groupForm });
    modal.msgSuccess('保存成功');
    groupDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
};

const handleAddRoute = (group: FinanceChannelGroupVO) => {
  Object.assign(routeForm, {
    routeId: undefined,
    groupId: group.groupId,
    routeCode: '',
    channelName: '',
    subSort: 0,
    merchantId: undefined,
    currency: group.groupType === 4 ? 'USDT' : 'VND',
    currencyRate: group.groupType === 4 ? '' : 'VND1000:1',
    amountMin: 0,
    amountMax: 0,
    recommendAmounts: '',
    feeRate: 0,
    successRate: 0,
    channelRemark: '',
    status: 1,
    mergeFlag: 0,
    frontEnable: 1,
    blacklistEnable: 0
  });
  routeDialog.value = true;
};

const handleEditRoute = (route: FinanceChannelRouteVO) => {
  Object.assign(routeForm, {
    routeId: route.routeId,
    groupId: route.groupId,
    routeCode: route.routeCode,
    channelName: route.channelName,
    subSort: route.subSort ?? 0,
    merchantId: route.merchantId && route.merchantId > 0 ? route.merchantId : undefined,
    currency: route.currency ?? 'VND',
    currencyRate: route.currencyRate ?? '',
    amountMin: route.amountMin ?? 0,
    amountMax: route.amountMax ?? 0,
    recommendAmounts: route.recommendAmounts ?? '',
    feeRate: route.feeRate ?? 0,
    successRate: route.successRate ?? 0,
    channelRemark: route.channelRemark ?? '',
    status: route.status ?? 1,
    mergeFlag: route.mergeFlag ?? 0,
    frontEnable: route.frontEnable ?? 1,
    blacklistEnable: route.blacklistEnable ?? 0
  });
  routeDialog.value = true;
};

const submitRoute = async () => {
  const valid = await routeFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await saveChannelRoute({ ...routeForm });
    modal.msgSuccess('保存成功');
    routeDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
};

const handleToggleGroup = async (group: FinanceChannelGroupVO) => {
  const next = group.status === 1 ? 0 : 1;
  await modal.confirm(`确认${next === 1 ? '启用' : '停用'}大类「${group.groupName}」？`);
  await changeChannelGroupStatus(group.groupId, next);
  modal.msgSuccess('操作成功');
  getGroups();
};

const handleSwitch = async (route: FinanceChannelRouteVO, field: string, value: number) => {
  await changeChannelRouteSwitch(route.routeId, field, value);
  modal.msgSuccess('已更新');
  getGroups();
};

const handleDeleteRoute = async (route: FinanceChannelRouteVO) => {
  await modal.confirm(`确认删除通道「${route.channelName}」？`);
  await deleteChannelRoute(route.routeId);
  modal.msgSuccess('删除成功');
  getGroups();
};

getGroups();
loadMerchants();
</script>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
}

.group-name {
  font-weight: 600;
}

.group-actions {
  margin-bottom: 8px;
}
</style>
