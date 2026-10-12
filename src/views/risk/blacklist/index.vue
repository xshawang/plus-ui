<template>
  <div class="p-2 app-container risk-blacklist-page">
    <!-- 六个页签是同一张表壳切六个数据源（设计稿 风控-8），因此页签头与内容分离渲染 -->
    <el-tabs v-model="activeTab" class="risk-tabs" @tab-change="handleTabChange">
      <el-tab-pane v-for="item in TABS" :key="item.name" :label="item.label" :name="item.name" />
    </el-tabs>

    <el-card shadow="hover" class="search-panel">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <!-- 会员 / 充值维度：字段选择器 + 关键字 -->
        <template v-if="isMemberTab">
          <el-form-item label="会员账号">
            <el-select v-model="queryParams.accountField" style="width: 120px">
              <el-option v-for="item in MEMBER_FIELDS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="queryParams.accountValue"
              :placeholder="'请输入' + (isMemberField.label || '会员账号')"
              clearable
              style="width: 220px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item v-if="activeTab === 'member'" label="账号状态">
            <el-select v-model="queryParams.accountStatus" placeholder="全部" clearable style="width: 130px">
              <el-option label="正常" :value="1" />
              <el-option label="锁定" :value="2" />
              <el-option label="注销" :value="3" />
            </el-select>
          </el-form-item>
        </template>

        <!-- IP / 手机 / 设备维度：关键字 + 限制类型 -->
        <template v-else-if="isTargetTab">
          <el-form-item>
            <el-input
              v-model="queryParams.keyword"
              :placeholder="'请输入' + targetLabel"
              clearable
              style="width: 220px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="限制类型">
            <el-select v-model="queryParams.limitScene" placeholder="全部" clearable style="width: 140px">
              <el-option
                v-for="item in limitSceneOptions"
                :key="item.value"
                :label="item.label"
                :value="Number(item.value)"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 提现账号维度 -->
        <template v-else>
          <el-form-item label="币种">
            <el-select v-model="queryParams.currency" placeholder="全部" clearable style="width: 170px">
              <el-option v-for="item in currencies" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="提现大类">
            <el-select v-model="queryParams.withdrawCategory" placeholder="全部" clearable style="width: 150px">
              <el-option
                v-for="item in options.withdrawCategories || []"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="类型名称">
            <el-select v-model="queryParams.typeName" placeholder="全部" clearable style="width: 160px">
              <el-option
                v-for="item in options.withdrawTypes || []"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="queryParams.keyword"
              placeholder="请输入提现账号/地址"
              clearable
              style="width: 200px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ activeTabLabel }}</h3>
            <span class="text-gray-400 text-sm">金额单位：VND（后端按分存储，页面已换算）</span>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['risk:blacklist:add']" type="primary" icon="Plus" @click="openAdd">新增</el-button>
            <el-button
              v-if="activeTab === 'withdraw-account'"
              v-hasPermi="['risk:blacklist:add']"
              type="primary"
              plain
              icon="Plus"
              @click="openAdd"
            >
              批量新增
            </el-button>
            <el-button
              v-if="supportImport"
              v-hasPermi="['risk:blacklist:import']"
              type="warning"
              plain
              icon="Upload"
              @click="importVisible = true"
            >
              批量导入
            </el-button>
            <el-button v-hasPermi="['risk:blacklist:export']" icon="Download" @click="handleExport">导出报表</el-button>
            <el-button icon="Refresh" @click="getList">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />

        <!-- 会员 / 充值维度 -->
        <template v-if="isMemberTab">
          <el-table-column label="会员ID" prop="uid" min-width="170" show-overflow-tooltip />
          <el-table-column label="会员账号" prop="loginName" min-width="140" show-overflow-tooltip />
          <el-table-column v-if="activeTab === 'member'" label="真实姓名" prop="realName" min-width="130" show-overflow-tooltip />
          <el-table-column label="币种" prop="currency" width="110" align="center" />
          <el-table-column label="充值次数" prop="rechargeCount" width="100" align="center" />
          <el-table-column :label="activeTab === 'member' ? '充值' : '充值金额'" width="130" align="right">
            <template #default="{ row }">{{ formatAmount(row.rechargeAmount) }}</template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="充提差额" width="130" align="right">
            <template #default="{ row }">
              <span :class="Number(row.balanceDiff) < 0 ? 'text-red-500' : ''">{{ formatAmount(row.balanceDiff) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="提现次数" prop="withdrawCount" width="100" align="center" />
          <el-table-column v-if="activeTab === 'member'" label="提现" width="130" align="right">
            <template #default="{ row }">{{ formatAmount(row.withdrawAmount) }}</template>
          </el-table-column>
          <el-table-column label="总余额" width="120" align="right">
            <template #default="{ row }">
              <span class="text-green-600">{{ formatAmount(row.totalBalance) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="利息宝" width="110" align="right">
            <template #default="{ row }">{{ formatAmount(row.extraBalance) }}</template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'member'" label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="banTagType(row.banType)">{{ row.statusText || '黑名单' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册IP地址" prop="registerIp" min-width="140" show-overflow-tooltip />
        </template>

        <!-- IP / 手机 / 设备维度 -->
        <template v-else-if="isTargetTab">
          <el-table-column label="ID" prop="id" min-width="180" show-overflow-tooltip />
          <el-table-column :label="targetLabel" prop="targetValueMask" min-width="200" show-overflow-tooltip />
          <el-table-column label="限制类型" prop="limitSceneText" width="120" align="center" />
          <el-table-column label="关联账号数" prop="relatedAccountCount" width="110" align="center" />
        </template>

        <!-- 提现账号维度 -->
        <template v-else>
          <el-table-column label="币种" prop="currency" width="130" align="center" />
          <el-table-column label="提现大类" width="120" align="center">
            <template #default="{ row }">{{ row.withdrawCategoryText || row.withdrawCategory }}</template>
          </el-table-column>
          <el-table-column label="类型名称" prop="typeName" min-width="140" show-overflow-tooltip />
          <el-table-column label="提现账号/地址" prop="targetValueMask" min-width="200" show-overflow-tooltip />
        </template>

        <el-table-column label="备注" prop="reason" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPermi="['risk:blacklist:remove']"
              link
              type="primary"
              @click="handleRemove(row)"
            >
              移出黑名单
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" width="110" align="center" />
        <el-table-column label="操作时间" width="170" align="center">
          <template #default="{ row }">{{ isMemberTab ? row.operatedAt : row.createdAt }}</template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-button
          v-hasPermi="['risk:blacklist:remove']"
          type="danger"
          plain
          :disabled="multiple"
          @click="handleBatchRemove"
        >
          批量移出
        </el-button>
        <span class="text-gray-500 text-sm">
          已选择 {{ ids.length }} 条数据 / 共 {{ total }} 条
        </span>
        <pagination
          v-show="total > 0"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="getList"
        />
      </div>
    </el-card>

    <blacklist-add-dialog
      v-model="addVisible"
      :tab="activeTab"
      :options="options"
      :currencies="currencies"
      @success="getList"
    />
    <blacklist-import-dialog
      v-if="supportImport"
      v-model="importVisible"
      :tab="activeTab"
      :tab-label="activeTabLabel"
      @success="getList"
    />
  </div>
</template>

<script setup name="RiskBlacklist" lang="ts">
import { getRiskBlacklistOptions, listMemberBlacklist, listRechargeBlacklist, listTargetBlacklist, listWithdrawBlacklist, removeRiskBlacklist, exportRiskBlacklist } from '@/api/risk/blacklist';
import type {
  RiskBlacklistOptions,
  RiskBlacklistTab,
  RiskBlacklistTabQuery,
  RiskMemberBlacklistVO,
  RiskTargetBlacklistVO,
  RiskWithdrawBlacklistVO
} from '@/api/risk/blacklist/types';
import { listRewardCurrencies } from '@/api/risk/reward-monitor';
import type { RiskCurrencyOption } from '@/api/risk/reward-monitor/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { computed, onMounted, reactive, ref } from 'vue';
import BlacklistAddDialog from './components/BlacklistAddDialog.vue';
import BlacklistImportDialog from './components/BlacklistImportDialog.vue';

type BlacklistRow = RiskMemberBlacklistVO | RiskTargetBlacklistVO | RiskWithdrawBlacklistVO;

/** 六个页签（顺序与设计稿一致；name 与后端 TAB_* 常量一致） */
const TABS: Array<{ name: RiskBlacklistTab; label: string }> = [
  { name: 'member', label: '会员黑名单' },
  { name: 'recharge', label: '充值黑名单' },
  { name: 'ip', label: 'IP黑名单' },
  { name: 'phone', label: '手机黑名单' },
  { name: 'device', label: '设备黑名单' },
  { name: 'withdraw-account', label: '提现账号黑名单' }
];

/** 会员维度查询字段选择器（后端 accountField） */
const MEMBER_FIELDS = [
  { label: '会员账号', value: 'LOGIN_NAME' },
  { label: '会员ID', value: 'UID' },
  { label: '手机号', value: 'PHONE' },
  { label: '真实姓名', value: 'REAL_NAME' }
];

/** 限制类型字典缺失时的兜底（位图 1注册 2登录 3两者），避免筛选框整体不可用 */
const FALLBACK_LIMIT_SCENES = [
  { label: '注册', value: '1' },
  { label: '登录', value: '2' },
  { label: '注册、登录', value: '3' }
];

const activeTab = ref<RiskBlacklistTab>('member');
const rows = ref<BlacklistRow[]>([]);
const total = ref(0);
const options = ref<RiskBlacklistOptions>({});
const currencies = ref<RiskCurrencyOption[]>([]);
const addVisible = ref(false);
const importVisible = ref(false);
const { loading, withLoading } = useLoading(true);
const { ids, multiple, handleSelectionChange, clearSelection } = useTableSelection<BlacklistRow>(
  row => row.id ?? ''
);

const queryParams = reactive<RiskBlacklistTabQuery>({
  pageNum: 1,
  pageSize: 10,
  accountField: 'LOGIN_NAME'
});

const isMemberTab = computed(() => activeTab.value === 'member' || activeTab.value === 'recharge');
const isTargetTab = computed(
  () => activeTab.value === 'ip' || activeTab.value === 'phone' || activeTab.value === 'device'
);
const activeTabLabel = computed(() => TABS.find(item => item.name === activeTab.value)?.label || '');
const targetLabel = computed(() =>
  activeTab.value === 'ip' ? 'IP地址' : activeTab.value === 'phone' ? '手机号' : '设备号'
);
const isMemberField = computed(
  () => MEMBER_FIELDS.find(item => item.value === queryParams.accountField) || { label: '会员账号' }
);
/** 批量导入只对「目标值」页签开放（会员维度走单个/批量新增） */
const supportImport = computed(
  () => activeTab.value === 'ip' || activeTab.value === 'phone' || activeTab.value === 'device' || activeTab.value === 'withdraw-account'
);
const limitSceneOptions = computed(() =>
  options.value.limitScenes && options.value.limitScenes.length > 0 ? options.value.limitScenes : FALLBACK_LIMIT_SCENES
);

/** 金额按分存储，页面统一换算成 VND 两位小数（与设计稿 28,150.00 口径一致） */
const formatAmount = (value?: number | null) => {
  if (value === null || value === undefined) return '0.00';
  return (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const banTagType = (banType?: number) => {
  if (banType === 1) return 'danger';
  if (banType === 3 || banType === 4) return 'warning';
  return 'info';
};

const getList = async () => {
  await withLoading(async () => {
    const query = { ...queryParams };
    if (activeTab.value === 'member') {
      const res = await listMemberBlacklist(query);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    } else if (activeTab.value === 'recharge') {
      const res = await listRechargeBlacklist(query);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    } else if (activeTab.value === 'withdraw-account') {
      const res = await listWithdrawBlacklist(query);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    } else {
      const res = await listTargetBlacklist(activeTab.value, query);
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
    }
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 切页签必须清空筛选与选择：上一页签的字段（如 accountField）对新数据源无意义 */
const handleTabChange = () => {
  Object.assign(queryParams, {
    pageNum: 1,
    accountField: isMemberTab.value ? 'LOGIN_NAME' : undefined,
    accountValue: undefined,
    accountStatus: undefined,
    keyword: undefined,
    limitScene: undefined,
    currency: undefined,
    withdrawCategory: undefined,
    typeName: undefined
  });
  clearSelection();
  getList();
};

/** 重置＝回到该页签的初始筛选（各页签字段不同，统一走 handleTabChange 的清理逻辑） */
const resetQuery = () => handleTabChange();

const confirmDialog = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    // 用户取消：ElMessageBox 以 reject 结束，这里吞掉以免冒泡成未处理异常
    return false;
  }
};

const rowKeyText = (row: BlacklistRow) => {
  if (isMemberTab.value) return (row as RiskMemberBlacklistVO).loginName || String(row.id ?? '');
  return (row as RiskTargetBlacklistVO).targetValueMask || String(row.id ?? '');
};

const handleRemove = async (row: BlacklistRow) => {
  if (!(await confirmDialog(`确认将 ${rowKeyText(row)} 移出名单？`))) return;
  await removeRiskBlacklist({ tab: activeTab.value, id: row.id });
  modal.msgSuccess('已移出');
  clearSelection();
  await getList();
};

const handleBatchRemove = async () => {
  if (ids.value.length === 0) {
    modal.msgWarning('请先选择需要移出的记录');
    return;
  }
  if (!(await confirmDialog(`确认将已选择的 ${ids.value.length} 条记录移出名单？`))) return;
  await removeRiskBlacklist({ tab: activeTab.value, ids: ids.value });
  modal.msgSuccess('已移出');
  clearSelection();
  await getList();
};

const handleExport = async () => {
  // 导出走全量查询，去掉分页参数（后端 export 不接受 pageNum/pageSize 语义）
  const exportQuery: Partial<RiskBlacklistTabQuery> = { ...queryParams };
  delete exportQuery.pageNum;
  delete exportQuery.pageSize;
  await exportRiskBlacklist(activeTab.value, exportQuery, activeTabLabel.value);
};

const openAdd = () => {
  addVisible.value = true;
};

onMounted(async () => {
  const [optionsRes, currencyRes] = await Promise.all([
    getRiskBlacklistOptions(),
    // 黑名单接口没有币种下拉，复用风控域已有的币种选项接口（只读）；后续有系统币种接口可替换
    listRewardCurrencies()
  ]);
  options.value = optionsRes.data || {};
  currencies.value = currencyRes.data || [];
  await getList();
});
</script>

<style scoped>
.risk-tabs {
  margin-bottom: 8px;
}

.search-panel {
  margin-bottom: 12px;
}

.toolbar-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
</style>
