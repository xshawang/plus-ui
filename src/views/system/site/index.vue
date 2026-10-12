<template>
  <div class="p-2 app-container system-site-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="站点信息" name="info" />
        <el-tab-pane label="站点开站" name="open" />
        <el-tab-pane label="站点账单" name="bill" />
        <el-tab-pane label="余额账变" name="balance" />
        <el-tab-pane label="站点额度" name="quota" />
        <el-tab-pane label="充币订单" name="coin" />
        <el-tab-pane label="金额和三方额度" name="credit" />
        <el-tab-pane label="站点收费标准" name="fee" />
      </el-tabs>

      <!-- 站点信息只读区（截图顶部 20 项） -->
      <el-descriptions v-if="activeTab === 'info' && current" :column="5" border size="small" class="site-summary">
        <el-descriptions-item label="主站点ID">{{ current.siteId }}</el-descriptions-item>
        <el-descriptions-item label="主站点名称">{{ current.siteName }}</el-descriptions-item>
        <el-descriptions-item label="所属集团">{{ current.groupName }}</el-descriptions-item>
        <el-descriptions-item label="所属公司">{{ current.companyName }}</el-descriptions-item>
        <el-descriptions-item label="持有人">{{ current.holder }}</el-descriptions-item>
        <el-descriptions-item label="对接商务">{{ current.businessOwner }}</el-descriptions-item>
        <el-descriptions-item label="推荐方式">{{ recommendText(current.recommendType) }}</el-descriptions-item>
        <el-descriptions-item label="推荐人/推荐单位">{{ current.recommender || '—' }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ current.currency }}</el-descriptions-item>
        <el-descriptions-item label="时区">{{ current.timezone }}</el-descriptions-item>
        <el-descriptions-item label="后台域名">
          <el-link type="primary" :href="domainLink(current.backendDomain)" target="_blank">
            {{ current.backendDomain }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="备用域名">
          <el-link type="primary" :href="domainLink(current.backupDomain)" target="_blank">
            {{ current.backupDomain }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="站点余额(U)">{{ money(current.siteBalance) }}</el-descriptions-item>
        <el-descriptions-item label="三方优惠">{{ percent(current.thirdDiscount) }}</el-descriptions-item>
        <el-descriptions-item label="站点状态">{{ siteStatusText(current.siteStatus) }}</el-descriptions-item>
        <el-descriptions-item label="主站开站(U)">{{ money(current.mainOpenFee) }}</el-descriptions-item>
        <el-descriptions-item label="子品牌开站(U)">{{ money(current.subOpenFee) }}</el-descriptions-item>
        <el-descriptions-item label="子品牌押金(U)">{{ money(current.subDeposit) }}</el-descriptions-item>
        <el-descriptions-item label="主站点维护费(U)">{{ money(current.mainMaintainFee) }}</el-descriptions-item>
        <el-descriptions-item label="子品牌维护费(U)">{{ money(current.subMaintainFee) }}</el-descriptions-item>
        <el-descriptions-item label="站点模式">{{ current.siteMode }}</el-descriptions-item>
        <el-descriptions-item label="客户端皮肤">{{ current.clientSkin }}</el-descriptions-item>
        <el-descriptions-item label="线路维护费(U)">{{ money(current.lineMaintainFee) }}</el-descriptions-item>
        <el-descriptions-item label="提现审核模式">
          {{ current.withdrawReviewMode === 2 ? '自动' : '人工' }}
        </el-descriptions-item>
        <el-descriptions-item label="合并状态">{{ current.mergeStatus || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-form :inline="true" class="query-form" @submit.prevent>
        <el-form-item>
          <el-radio-group v-model="timeScope" @change="handleScopeChange">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="timeScope === 'month'">
          <el-date-picker v-model="monthValue" type="month" value-format="YYYY-MM" placeholder="选择月份" style="width: 150px" />
        </el-form-item>
        <el-form-item v-else>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="站点ID">
          <el-input v-model="queryParams.siteId" placeholder="请输入站点ID" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'info'" label="站点状态">
          <el-select v-model="queryParams.status" clearable placeholder="请选择站点状态" style="width: 150px">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTab === 'bill'" label="结算状态">
          <el-select v-model="queryParams.subStatus" clearable placeholder="全部" style="width: 130px">
            <el-option label="未结" :value="1" />
            <el-option label="已结" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTab === 'coin'" label="充币状态">
          <el-select v-model="queryParams.subStatus" clearable placeholder="全部" style="width: 130px">
            <el-option label="待处理" :value="1" />
            <el-option label="成功" :value="2" />
            <el-option label="失败" :value="3" />
          </el-select>
        </el-form-item>
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
            <h3>{{ tabTitle }}</h3>
            <p>共 {{ total }} 条记录；站点余额只随充币与账单结算变动。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-if="activeTab === 'info'"
              v-hasPermi="['system:site:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
            >
              新增站点
            </el-button>
            <el-button
              v-if="activeTab === 'info'"
              v-hasPermi="['system:site:withdraw-mode']"
              type="warning"
              plain
              icon="Setting"
              :disabled="!current"
              @click="openWithdrawMode"
            >
              提现审核模式设置
            </el-button>
            <el-button
              v-if="activeTab === 'bill'"
              v-hasPermi="['system:site:edit']"
              type="primary"
              plain
              icon="Plus"
              @click="openBillGenerate"
            >
              生成账单
            </el-button>
            <el-button
              v-if="activeTab === 'quota'"
              v-hasPermi="['system:site:edit']"
              type="primary"
              plain
              icon="Plus"
              @click="openQuota"
            >
              配置额度
            </el-button>
            <el-button
              v-if="activeTab === 'credit'"
              v-hasPermi="['system:site:edit']"
              type="primary"
              plain
              icon="Plus"
              @click="openCredit"
            >
              配置三方额度
            </el-button>
            <el-button
              v-if="activeTab === 'fee'"
              v-hasPermi="['system:site:edit']"
              type="primary"
              plain
              icon="Plus"
              @click="openFee"
            >
              配置收费标准
            </el-button>
            <el-button
              v-if="activeTab === 'open'"
              v-hasPermi="['system:site:edit']"
              type="primary"
              plain
              icon="Plus"
              @click="openOpenRecord"
            >
              新增开站记录
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column v-if="activeTab === 'info'" type="selection" width="50" align="center" />
        <template v-if="activeTab === 'info'">
          <el-table-column label="所属主站" prop="parentSiteId" align="center" width="100" />
          <el-table-column label="站点类型" align="center" width="100">
            <template #default="{ row }">{{ row.siteType === 1 ? '主站点' : '子站点' }}</template>
          </el-table-column>
          <el-table-column label="站点ID" prop="siteId" align="center" width="100" />
          <el-table-column label="站点名称" prop="siteName" align="center" width="110" />
          <el-table-column label="所属集团" prop="groupName" align="center" width="110" />
          <el-table-column label="所属公司" prop="companyName" align="center" width="110" />
          <el-table-column label="站点余额(U)" align="center" width="120">
            <template #default="{ row }">
              <el-link type="danger">{{ money(row.siteBalance) }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="站点押金(U)" align="center" width="110">
            <template #default="{ row }">{{ money(row.subDeposit) }}</template>
          </el-table-column>
          <el-table-column label="客户端皮肤" prop="clientSkin" align="center" width="150" :show-overflow-tooltip="true" />
          <el-table-column label="合并状态" prop="mergeStatus" align="center" width="100" />
          <el-table-column label="线路维护费(U)" align="center" width="130">
            <template #default="{ row }">{{ money(row.lineMaintainFee) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作时间" align="center" width="170">
            <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
          <el-table-column label="站点状态" align="center" width="100">
            <template #default="{ row }">
              <span :class="row.siteStatus === 1 ? 'text-green-600' : 'text-red-500'">
                {{ siteStatusText(row.siteStatus) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="230" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['system:site:edit']" link type="primary" @click="handleUpdate(row)">修改</el-button>
              <el-button v-hasPermi="['system:site:maintain']" link type="primary" @click="openMaintain(row)">维护</el-button>
              <el-button v-hasPermi="['system:site:security-code']" link type="primary" @click="openSecurityCode(row)">
                修改安全码
              </el-button>
              <el-button v-hasPermi="['system:site:coin']" link type="success" @click="openRecharge(row)">充币</el-button>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <template v-for="column in tabColumns" :key="column.prop">
            <el-table-column :label="column.label" :prop="column.prop" :width="column.width" align="center" :show-overflow-tooltip="true">
              <template #default="{ row }">{{ column.format ? column.format(row) : (row[column.prop] ?? '—') }}</template>
            </el-table-column>
          </template>
          <el-table-column v-if="activeTab === 'bill'" label="操作" align="center" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.settleStatus === 1"
                v-hasPermi="['system:site:coin']"
                link
                type="primary"
                @click="handleSettle(row)"
              >
                结算
              </el-button>
              <span v-else class="text-gray-400">已结</span>
            </template>
          </el-table-column>
        </template>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 站点新增/修改 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="站点名称" prop="siteName">
              <el-input v-model="form.siteName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点类型">
              <el-select v-model="form.siteType" style="width: 100%">
                <el-option label="主站点" :value="1" />
                <el-option label="子站点" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属集团">
              <el-input v-model="form.groupName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司">
              <el-input v-model="form.companyName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="持有人">
              <el-input v-model="form.holder" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对接商务">
              <el-input v-model="form.businessOwner" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推荐方式">
              <el-select v-model="form.recommendType" style="width: 100%">
                <el-option label="个人" :value="1" />
                <el-option label="单位" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推荐人/单位">
              <el-input v-model="form.recommender" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种" prop="currency">
              <el-select v-model="form.currency" filterable style="width: 100%">
                <el-option v-for="item in options.currencies" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时区">
              <el-input v-model="form.timezone" placeholder="如 UTC+07:00" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="后台域名">
              <el-input v-model="form.backendDomain" placeholder="如 n188.cg.ink" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备用域名">
              <el-input v-model="form.backupDomain" placeholder="如 n188.offb.com" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点模式">
              <el-select v-model="form.siteMode" style="width: 100%">
                <el-option v-for="item in options.siteModes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户端皮肤">
              <el-input v-model="form.clientSkin" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点状态">
              <el-select v-model="form.siteStatus" style="width: 100%">
                <el-option label="正常" :value="1" />
                <el-option label="停用" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主站维护费(U)">
              <el-input-number v-model="form.mainMaintainFee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <SiteActionDialogs ref="actionRef" :options="options" @saved="getList" />
  </div>
</template>

<script setup name="SystemSite" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import modal from '@/plugins/modal';
import {
  addSite,
  delSite,
  generateSiteBill,
  getSite,
  getSiteOptions,
  listSite,
  listSiteTab,
  settleSiteBill,
  updateSite
} from '@/api/system/site';
import type { SiteForm, SiteOptions, SiteQuery, SiteVO } from '@/api/system/site/types';
import SiteActionDialogs from './components/SiteActionDialogs.vue';

const { loading, withLoading } = useLoading(true);
const { timeScope, dateRange, monthValue, applyScopeRange, handleScopeChange, buildTimeParams } = useTimeScopeQuery({
  defaultScope: 'month'
});

const activeTab = ref('info');
const rows = ref<any[]>([]);
const total = ref(0);
const ids = ref<string[]>([]);
const current = ref<SiteVO>();
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<ElFormInstance>();
const actionRef = ref<InstanceType<typeof SiteActionDialogs>>();
const options = reactive<SiteOptions>({
  sites: [],
  currencies: [],
  siteTypes: [],
  siteStatuses: [],
  siteModes: [],
  recommendTypes: [],
  billTypes: [],
  settleStatuses: [],
  quotaTypes: [],
  coinStatuses: [],
  feeUnits: []
});

const queryParams = ref<SiteQuery>({ pageNum: 1, pageSize: 10 });
const form = ref<SiteForm>({});
const rules = {
  siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }]
};

const tabTitles: Record<string, string> = {
  info: '站点信息',
  open: '站点开站',
  bill: '站点账单',
  balance: '余额账变',
  quota: '站点额度',
  coin: '充币订单',
  credit: '金额和三方额度',
  fee: '站点收费标准'
};
const tabTitle = computed(() => tabTitles[activeTab.value] ?? '站点信息');

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const money = (value?: number) => Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
const percent = (value?: number) => `${(Number(value ?? 0) * 100).toFixed(1)}%`;
const recommendText = (value?: number) => (value === 2 ? '单位' : '个人');
const siteStatusText = (value?: number) => (value === 2 ? '停用' : '正常');
const domainLink = (domain?: string) => (domain ? `https://${domain}` : '#');

/** 各页签列定义（截图页签二~八；列名与后端台账字段一一对应） */
const tabColumns = computed(() => {
  switch (activeTab.value) {
    case 'open':
      return [
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'openType', label: '开站类型', width: 130, format: (row: any) => (row.openType === 1 ? '主站开站' : '子品牌开站') },
        { prop: 'openFee', label: '开站费用(U)', width: 120, format: (row: any) => money(row.openFee) },
        { prop: 'currency', label: '币种', width: 120 },
        { prop: 'openStatus', label: '状态', width: 110, format: (row: any) => (row.openStatus === 2 ? '已开站' : row.openStatus === 3 ? '已取消' : '待开站') },
        { prop: 'applyAt', label: '申请时间', width: 170, format: (row: any) => fmt(row.applyAt) },
        { prop: 'finishAt', label: '完成时间', width: 170, format: (row: any) => fmt(row.finishAt) },
        { prop: 'remark', label: '备注', width: 200 },
        { prop: 'operatorId', label: '操作人', width: 100 }
      ];
    case 'bill':
      return [
        { prop: 'billNo', label: '账单号', width: 190 },
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'billMonth', label: '账单月份', width: 110 },
        { prop: 'billType', label: '账单类型', width: 120, format: (row: any) => billTypeText(row.billType) },
        { prop: 'amount', label: '账单金额(U)', width: 130, format: (row: any) => money(row.amount) },
        { prop: 'settleStatus', label: '结算状态', width: 100, format: (row: any) => (row.settleStatus === 2 ? '已结' : '未结') },
        { prop: 'settleAt', label: '结算时间', width: 170, format: (row: any) => fmt(row.settleAt) },
        { prop: 'remark', label: '备注', width: 200 }
      ];
    case 'balance':
      return [
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'changeType', label: '账变类型', width: 120, format: (row: any) => changeTypeText(row.changeType) },
        { prop: 'amount', label: '变动金额(U)', width: 130, format: (row: any) => money(row.amount) },
        { prop: 'balanceBefore', label: '变动前余额(U)', width: 150, format: (row: any) => money(row.balanceBefore) },
        { prop: 'balanceAfter', label: '变动后余额(U)', width: 150, format: (row: any) => money(row.balanceAfter) },
        { prop: 'bizNo', label: '关联单号', width: 190 },
        { prop: 'remark', label: '备注', width: 200 },
        { prop: 'createdAt', label: '操作时间', width: 170, format: (row: any) => fmt(row.createdAt) }
      ];
    case 'quota':
      return [
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'quotaType', label: '额度类型', width: 120, format: (row: any) => (row.quotaType === 2 ? '三方额度' : '授信额度') },
        { prop: 'currency', label: '币种', width: 120 },
        { prop: 'quotaAmount', label: '额度总额', width: 130, format: (row: any) => money(row.quotaAmount) },
        { prop: 'usedAmount', label: '已用额度', width: 130, format: (row: any) => money(row.usedAmount) },
        { prop: 'status', label: '状态', width: 90, format: (row: any) => (row.status === 1 ? '启用' : '停用') },
        { prop: 'remark', label: '备注', width: 200 },
        { prop: 'updatedAt', label: '操作时间', width: 170, format: (row: any) => fmt(row.updatedAt) }
      ];
    case 'coin':
      return [
        { prop: 'orderNo', label: '充币订单号', width: 200 },
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'currency', label: '币种', width: 100 },
        { prop: 'amount', label: '充币数量', width: 120, format: (row: any) => money(row.amount) },
        { prop: 'payType', label: '充币方式', width: 110 },
        { prop: 'status', label: '状态', width: 100, format: (row: any) => coinStatusText(row.status) },
        { prop: 'thirdOrderNo', label: '链上/三方单号', width: 220 },
        { prop: 'createdAt', label: '创建时间', width: 170, format: (row: any) => fmt(row.createdAt) }
      ];
    case 'credit':
      return [
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'thirdId', label: '三方ID', width: 140 },
        { prop: 'thirdName', label: '三方名称', width: 150 },
        { prop: 'supportFunc', label: '支持功能', width: 110 },
        { prop: 'creditAmount', label: '额度金额', width: 130, format: (row: any) => money(row.creditAmount) },
        { prop: 'usedCredit', label: '已用金额', width: 130, format: (row: any) => money(row.usedCredit) },
        { prop: 'settleCycle', label: '结算周期', width: 110 },
        { prop: 'status', label: '状态', width: 90, format: (row: any) => (row.status === 1 ? '启用' : '停用') }
      ];
    case 'fee':
      return [
        { prop: 'siteId', label: '站点ID', width: 100 },
        { prop: 'feeType', label: '费用类型', width: 130, format: (row: any) => billTypeText(row.feeType) },
        { prop: 'feeName', label: '费用名称', width: 150 },
        { prop: 'feeValue', label: '费用值', width: 120, format: (row: any) => (row.feeUnit === 2 ? `${(Number(row.feeValue) * 100).toFixed(2)}%` : money(row.feeValue)) },
        { prop: 'feeUnit', label: '单位', width: 100, format: (row: any) => (row.feeUnit === 2 ? '百分比' : 'U') },
        { prop: 'currency', label: '币种', width: 110 },
        { prop: 'status', label: '状态', width: 90, format: (row: any) => (row.status === 1 ? '启用' : '停用') },
        { prop: 'remark', label: '备注', width: 200 }
      ];
    default:
      return [];
  }
});

const billTypeText = (value?: number) =>
  value === 2 ? '开站费' : value === 3 ? '提现审核费/三方优惠' : value === 4 ? '其他' : '线路维护费';
const changeTypeText = (value?: number) =>
  value === 2 ? '扣减' : value === 3 ? '账单扣费' : value === 4 ? '人工调整' : '充币';
const coinStatusText = (value?: number) => (value === 2 ? '成功' : value === 3 ? '失败' : '待处理');

const getList = async () => {
  try {
    await withLoading(async () => {
      const params: SiteQuery = { ...queryParams.value, tab: activeTab.value, ...buildTimeParams() };
      if (activeTab.value === 'info') {
        const res = await listSite(params);
        rows.value = res.data?.rows ?? [];
        total.value = res.data?.total ?? 0;
        if (!current.value && rows.value.length) {
          current.value = rows.value[0] as SiteVO;
        }
        return;
      }
      const res = await listSiteTab(activeTab.value, params);
      rows.value = res.data?.rows ?? [];
      total.value = res.data?.total ?? 0;
    });
  } catch (error) {
    modal.msgError('站点数据加载失败，请稍后重试');
  }
};

const handleTabChange = () => {
  queryParams.value.pageNum = 1;
  queryParams.value.subStatus = undefined;
  getList();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: queryParams.value.pageSize };
  applyScopeRange();
  getList();
};

const handleSelectionChange = (selection: SiteVO[]) => {
  ids.value = selection.map(item => item.siteId);
};

const handleAdd = () => {
  form.value = { siteType: 1, siteStatus: 1, recommendType: 1, timezone: 'UTC+07:00', siteMode: '娱乐城（现金网）' };
  dialog.title = '新增站点';
  dialog.visible = true;
};

const handleUpdate = async (row: any) => {
  const res = await getSite(row.siteId);
  form.value = { ...(res.data as SiteForm) };
  dialog.title = '修改站点';
  dialog.visible = true;
};

const submitForm = async () => {
  await formRef.value?.validate();
  const payload = { ...form.value, parentSiteId: form.value.parentSiteId || '0' };
  if (form.value.siteId) {
    await updateSite(payload);
  } else {
    await addSite(payload);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};

const openMaintain = (row: any) => actionRef.value?.openMaintain(row);
const openSecurityCode = (row: any) => actionRef.value?.openSecurityCode(row);
const openRecharge = (row: any) => actionRef.value?.openRecharge(row);
const openWithdrawMode = () => actionRef.value?.openWithdrawMode(current.value);
const openQuota = (row?: any) => actionRef.value?.openQuota(row ?? current.value);
const openCredit = (row?: any) => actionRef.value?.openCredit(row ?? current.value);
const openFee = (row?: any) => actionRef.value?.openFee(row ?? current.value);
const openOpenRecord = () => actionRef.value?.openOpenRecord(current.value);
const openBillGenerate = () => actionRef.value?.openBillGenerate(current.value);

const handleSettle = async (row: any) => {
  await modal.confirm('确认结算该账单吗？结算将从站点余额中扣费并生成余额账变。');
  await settleSiteBill(row.id);
  modal.msgSuccess('结算成功');
  getList();
};

const handleDelete = async () => {
  if (!ids.value.length) {
    return;
  }
  await modal.confirm('确认删除所选站点吗？余额不为 0 的站点无法删除。');
  await delSite(ids.value);
  modal.msgSuccess('删除成功');
  getList();
};

onMounted(async () => {
  const res = await getSiteOptions();
  Object.assign(options, res.data ?? {});
  applyScopeRange();
  // 顶部只读区始终展示主站点信息（截图口径：站点信息区 = 主站点 2562）
  const primary = options.sites.find(item => item.siteType === 1) ?? options.sites[0];
  if (primary) {
    const detail = await getSite(primary.value);
    current.value = detail.data as SiteVO;
  }
  getList();
});
</script>

<style scoped>
.site-summary {
  margin-bottom: 12px;
}

.site-summary :deep(.el-descriptions__label) {
  width: 120px;
}
</style>
