<template>
  <div class="p-2 app-container promotion-grant-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>优惠领取与审核</h3>
            <p>全部优惠奖励的统一发放与审核中心；审核通过后按派发方式进入「待领取」或直接到账，拒绝必须填写原因。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
      </el-tabs>

      <el-form :model="query" inline class="query-bar">
        <el-form-item label="单号">
          <el-input v-model="query.orderNo" placeholder="请输入单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="优惠名称">
          <el-input v-model="query.activityName" placeholder="请输入优惠名称" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select v-model="query.rewardType" placeholder="全部" clearable style="width: 140px">
            <el-option label="金币" :value="1" />
            <el-option label="奖金" :value="2" />
            <el-option label="实物" :value="3" />
            <el-option label="幸运值" :value="4" />
            <el-option label="兑换码" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠来源">
          <el-select v-model="query.source" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar-line">
        <template v-if="activeTab !== 'aggregate'">
          <el-button v-hasPermi="['promotion:grant:dispatch']" type="primary" icon="Plus" @click="openDispatch">新增派发</el-button>
        </template>
        <el-button v-hasPermi="['promotion:grant:list']" plain @click="openLimit">派发限额</el-button>
        <template v-if="activeTab !== 'aggregate'">
          <el-button v-hasPermi="['promotion:grant:audit']" type="success" plain :disabled="!selected.length" @click="handleBatch('approve')">
            批量通过
          </el-button>
          <el-button v-hasPermi="['promotion:grant:audit']" type="warning" plain :disabled="!selected.length" @click="handleBatch('reject')">
            批量拒绝
          </el-button>
          <el-button v-hasPermi="['promotion:grant:audit']" plain :disabled="!selected.length" @click="handleBatch('unmatched')">
            标记不符合条件
          </el-button>
        </template>
        <el-button v-hasPermi="['promotion:report:export']" plain icon="Download" @click="handleExport">导出报表</el-button>
        <el-button v-if="activeTab === 'failed'" v-hasPermi="['promotion:grant:audit']" type="danger" plain :loading="autoRetrying" @click="handleAutoRetry">
          自动重试失败单
        </el-button>
        <span class="selected-tip">已选择 {{ selected.length }} 条数据</span>
      </div>

      <!-- 派发一键审核：按优惠聚合 -->
      <el-table v-if="activeTab === 'aggregate'" v-loading="loading" border :data="aggregateRows">
        <el-table-column label="优惠ID" prop="activityId" align="center" width="100" />
        <el-table-column label="优惠名称" prop="activityName" min-width="180" show-overflow-tooltip />
        <el-table-column label="活动类型" prop="activityType" align="center" width="140" show-overflow-tooltip />
        <el-table-column label="活动币种" prop="currency" align="center" width="110" />
        <el-table-column label="待审核数量" prop="pendingCount" align="right" width="120" sortable />
        <el-table-column label="待审核金额" align="right" width="140" sortable>
          <template #default="{ row }">{{ fmtMoney(row.pendingAmount) }}</template>
        </el-table-column>
        <el-table-column label="已审核数量" prop="auditedCount" align="right" width="120" sortable />
        <el-table-column label="已审核金额" align="right" width="140" sortable>
          <template #default="{ row }">{{ fmtMoney(row.auditedAmount) }}</template>
        </el-table-column>
        <el-table-column label="总数量" prop="totalCount" align="right" width="100" sortable />
        <el-table-column label="总金额" align="right" width="130" sortable>
          <template #default="{ row }">{{ fmtMoney(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="派发方式" prop="dispatchMode" align="center" width="140" />
        <el-table-column label="操作" align="center" width="210" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['promotion:grant:audit']" link type="primary" @click="oneKeyAudit(row)">一键审核</el-button>
            <el-button link type="primary" @click="drillActivity(row)">查看明细</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" />
      </el-table>

      <!-- 逐条 / 生命周期列表 -->
      <el-table
        v-else
        v-loading="loading"
        border
        :data="rows"
        @selection-change="(val: PromoGrantVO[]) => (selected = val)"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column label="单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
        <el-table-column label="优惠ID" prop="activityId" align="center" width="100" />
        <el-table-column label="优惠名称" prop="activityName" min-width="170" show-overflow-tooltip />
        <el-table-column label="活动类型" prop="activityType" align="center" width="130" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="120" />
        <el-table-column label="会员账号" prop="account" align="center" width="140" />
        <el-table-column label="会员层级" prop="memberLevel" align="center" width="120" />
        <el-table-column label="VIP等级" prop="vipLevel" align="center" width="100" />
        <el-table-column label="会员币种" prop="currency" align="center" width="110" />
        <el-table-column label="可领取时间" prop="claimableAt" align="center" width="170" />
        <el-table-column label="过期时间" prop="expireAt" align="center" width="170" />
        <el-table-column label="奖励类型" align="center" width="100">
          <template #default="{ row }">{{ rewardTypeText(row.rewardType) }}</template>
        </el-table-column>
        <el-table-column label="奖励" align="right" width="130">
          <template #default="{ row }">{{ fmtMoney(row.rewardAmount) }}</template>
        </el-table-column>
        <el-table-column label="稽核倍数" align="right" width="110">
          <template #default="{ row }">{{ Number(row.auditMultiple ?? 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="派发方式" prop="dispatchMode" align="center" width="130" />
        <el-table-column label="前台备注" prop="frontRemark" min-width="140" show-overflow-tooltip />
        <el-table-column label="后台备注" prop="backRemark" min-width="140" show-overflow-tooltip />
        <el-table-column label="奖励说明" prop="rewardDesc" min-width="180" show-overflow-tooltip />
        <el-table-column label="到账时间" prop="grantedAt" align="center" width="170" />
        <el-table-column label="失败原因" prop="failReason" min-width="170" show-overflow-tooltip />
        <el-table-column label="重试次数" prop="retryCount" align="right" width="100" />
        <el-table-column label="履约方式" align="center" width="110">
          <template #default="{ row }">{{ row.fulfillMode === 'PHYSICAL' ? '实物' : row.fulfillMode === 'CDKEY' ? '兑换码' : '--' }}</template>
        </el-table-column>
        <el-table-column label="履约凭证" prop="fulfillNo" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="履约时间" prop="fulfillAt" align="center" width="170" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="不符合原因" prop="unmatchedReason" min-width="160" show-overflow-tooltip />
        <el-table-column label="拒绝原因" prop="rejectReason" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建人" prop="creator" align="center" width="120" />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="170" />
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="操作时间" prop="operatedAt" align="center" width="170" />
        <el-table-column label="操作" align="center" width="230" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canAudit(row as PromoGrantVO)" v-hasPermi="['promotion:grant:audit']" link type="success" @click="singleAudit(row as PromoGrantVO, 'approve')">通过</el-button>
            <el-button v-if="canAudit(row as PromoGrantVO)" v-hasPermi="['promotion:grant:audit']" link type="warning" @click="singleAudit(row as PromoGrantVO, 'reject')">拒绝</el-button>
            <el-button v-if="canAudit(row as PromoGrantVO)" v-hasPermi="['promotion:grant:audit']" link @click="singleAudit(row as PromoGrantVO, 'unmatched')">不符合条件</el-button>
            <el-button v-if="row.status === 2" v-hasPermi="['promotion:grant:audit']" link type="primary" @click="handleClaim(row as PromoGrantVO)">标记已领取</el-button>
            <el-button v-if="row.status === 7" v-hasPermi="['promotion:grant:audit']" link type="danger" @click="handleRetry(row as PromoGrantVO)">重试入账</el-button>
            <el-button
              v-if="row.status === 2 && (row.rewardType === 3 || row.rewardType === 5)"
              v-hasPermi="['promotion:grant:audit']"
              link
              type="warning"
              @click="openFulfill(row as PromoGrantVO)"
            >
              履约
            </el-button>
            <el-button v-hasPermi="['promotion:grant:audit']" link type="primary" @click="editRemark(row as PromoGrantVO)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="summary-bar">本页小计：{{ fmtMoney(summary.totalAmount) }}（共 {{ summary.totalCount ?? 0 }} 条）</div>

      <pagination
        v-if="activeTab !== 'aggregate'"
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="loadRows"
      />
    </el-card>

    <!-- 新增派发 -->
    <el-dialog v-model="dispatch.visible" title="新增派发" width="720px" append-to-body destroy-on-close>
      <el-form ref="dispatchFormRef" :model="dispatchForm" :rules="dispatchRules" label-width="140px">
        <el-form-item label="优惠活动" prop="activityId">
          <el-select v-model="dispatchForm.activityId" filterable placeholder="请选择优惠活动" style="width: 320px">
            <el-option v-for="item in activityOptions" :key="item.instanceId" :label="`${item.instanceId} - ${item.instanceName}`" :value="item.instanceId" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员账号" prop="accountsText">
          <el-input
            v-model="dispatchForm.accountsText"
            type="textarea"
            :rows="4"
            placeholder="多条添加：每行一个会员账号，或使用英文逗号分隔；单批上限以「派发限额」页配置为准"
          />
        </el-form-item>
        <el-form-item label="奖励类型" prop="rewardType">
          <el-select v-model="dispatchForm.rewardType" style="width: 220px">
            <el-option label="金币" :value="1" />
            <el-option label="奖金" :value="2" />
            <el-option label="实物" :value="3" />
            <el-option label="幸运值" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励金额(分)" prop="rewardAmount">
          <el-input-number v-model="dispatchForm.rewardAmount" :min="0" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="会员币种" prop="currency">
          <el-select v-model="dispatchForm.currency" style="width: 220px">
            <el-option label="VND" value="VND" />
            <el-option label="USDT" value="USDT" />
            <el-option label="THB" value="THB" />
          </el-select>
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="dispatchForm.auditMultiple" :min="0" :precision="2" :controls="false" style="width: 220px" />
        </el-form-item>
        <el-form-item label="派发方式">
          <el-select v-model="dispatchForm.dispatchMode" style="width: 240px">
            <el-option label="玩家自领" value="玩家自领" />
            <el-option label="系统自动派发" value="系统自动派发" />
          </el-select>
        </el-form-item>
        <el-form-item label="可领取/过期时间">
          <el-date-picker
            v-model="dispatchTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="可领取时间"
            end-placeholder="过期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="奖励说明">
          <el-input v-model="dispatchForm.rewardDesc" maxlength="255" />
        </el-form-item>
        <el-form-item label="前台备注">
          <el-input v-model="dispatchForm.frontRemark" maxlength="255" />
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="dispatchForm.backRemark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="dispatching" @click="submitDispatch">确认派发</el-button>
        <el-button @click="dispatch.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 派发限额 -->
    <el-dialog v-model="limitDialog.visible" title="派发限额" width="760px" append-to-body destroy-on-close>
      <el-form v-loading="limitDialog.loading" label-width="220px" class="disburse-form">
        <el-form-item label="奖励真实入账开关">
          <el-switch v-model="grantSetting.disburseEnabled" :active-value="1" :inactive-value="0" />
          <span class="tip">关闭后审核通过/领取只流转状态，不调用钱包（灰度与应急回滚用）</span>
        </el-form-item>
        <el-form-item label="单批派发会员账号上限">
          <el-input-number v-model="grantSetting.maxBatchAccounts" :min="1" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button v-hasPermi="['promotion:grant:audit']" type="primary" :loading="limitDialog.saving" @click="saveGrantSetting">
            保存入账设置
          </el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="limitDialog.loading" border :data="limitRows">
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="单笔奖金限额(分,0=不限)" align="center" width="200">
          <template #default="{ row }">
            <el-input-number v-model="row.singleMaxAmount" :min="0" :controls="false" style="width: 160px" />
          </template>
        </el-table-column>
        <el-table-column label="单活动总限额(分,0=不限)" align="center" width="210">
          <template #default="{ row }">
            <el-input-number v-model="row.activityTotalMaxAmount" :min="0" :controls="false" style="width: 170px" />
          </template>
        </el-table-column>
        <el-table-column label="大额审核门槛(分)" align="center" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.bigAmountThreshold" :min="0" :controls="false" style="width: 150px" />
          </template>
        </el-table-column>
        <el-table-column label="启用大额审核" align="center" width="130">
          <template #default="{ row }">
            <el-switch v-model="row.bigAmountAuditEnabled" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
          <template #default="{ row }">
            <el-button v-hasPermi="['promotion:grant:audit']" link type="primary" @click="saveLimit(row as PromoDispatchLimitVO)">保存</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="limitDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 实物 / 兑换码履约（L13） -->
    <el-dialog v-model="fulfillDialog.visible" title="奖励履约（实物 / 兑换码）" width="660px" append-to-body destroy-on-close>
      <el-form ref="fulfillFormRef" :model="fulfillForm" :rules="fulfillRules" label-width="130px">
        <el-form-item label="发放单号">
          <span>{{ fulfillDialog.orderNo }}</span>
        </el-form-item>
        <el-form-item label="奖励类型">
          <span>{{ fulfillDialog.rewardType === 3 ? '实物' : fulfillDialog.rewardType === 5 ? '兑换码' : '--' }}</span>
        </el-form-item>
        <el-form-item label="履约方式" prop="fulfillMode">
          <el-radio-group v-model="fulfillForm.fulfillMode">
            <el-radio value="PHYSICAL" :disabled="fulfillDialog.rewardType !== 3">实物发货</el-radio>
            <el-radio value="CDKEY" :disabled="fulfillDialog.rewardType !== 5">兑换码发放</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="fulfillForm.fulfillMode === 'PHYSICAL'">
          <el-form-item label="收货人" prop="receiverName">
            <el-input v-model="fulfillForm.receiverName" maxlength="64" />
          </el-form-item>
          <el-form-item label="收货电话" prop="receiverPhone">
            <el-input v-model="fulfillForm.receiverPhone" maxlength="32" />
          </el-form-item>
          <el-form-item label="收货地址" prop="receiverAddress">
            <el-input v-model="fulfillForm.receiverAddress" type="textarea" :rows="2" maxlength="512" />
          </el-form-item>
          <el-form-item label="快递公司">
            <el-input v-model="fulfillForm.expressCompany" maxlength="64" placeholder="发货时填写" />
          </el-form-item>
          <el-form-item label="快递单号">
            <el-input v-model="fulfillForm.expressNo" maxlength="64" placeholder="填写后发放单将置为已领取" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="兑换码" prop="cdkey">
            <el-input v-model="fulfillForm.cdkey" maxlength="128" placeholder="填写发放给会员的兑换码" />
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input v-model="fulfillForm.remark" type="textarea" :rows="2" maxlength="255" placeholder="写入发放单后台备注，便于追溯" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="fulfilling" @click="submitFulfill">确认履约</el-button>
        <el-button @click="fulfillDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PromotionGrantAudit" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  auditPromoGrant,
  claimPromoGrant,
  dispatchPromoGrant,
  getPromoGrantSummary,
  listPromoDispatchLimit,
  listPromoGrant,
  listPromoGrantAggregate,
  remarkPromoGrant,
  retryPromoGrant,
  autoRetryPromoGrant,
  fulfillPromoGrant,
  savePromoDispatchLimit
} from '@/api/promotion/grant';
import type { PromoDispatchLimitVO, PromoGrantFulfillForm, PromoGrantQuery, PromoGrantVO } from '@/api/promotion/grant/types';
import { listPromoActivity } from '@/api/promotion/activity';
import type { PromoActivityVO } from '@/api/promotion/activity/types';
import { listPromoSourceOptions } from '@/api/promotion/report';
import { listPromoConfig, savePromoConfig } from '@/api/promotion/config';

/**
 * 优惠领取与审核页（需求文档 07：11 个页签 + 新增派发 + 派发限额）。
 *
 * 设计要点：
 *   ① 11 个页签共用同一表格与筛选，靠 tab 参数区分切片，避免 11 份列定义漂移；
 *   ② 「派发一键审核」是聚合视图（按优惠聚合），其余页签是单据视图，两者共用一个 tab 状态；
 *   ③ 批量审核支持跨页选中（后端按 orderId 列表处理，且只更新未审核单据，天然幂等）；
 *   ④ 超限校验由后端在本页操作时执行，前端只做必填与提示，避免出现"前端放过、后端拒绝"的错位展示。
 */
type Row = Record<string, any>;

const tabs = [
  { label: '派发一键审核', name: 'aggregate' },
  { label: '派发逐条审核', name: 'audit' },
  { label: '会员申请审核', name: 'apply' },
  { label: '大额审核', name: 'big' },
  { label: '不符合条件审核', name: 'unmatched' },
  { label: '待申请', name: 'pendingApply' },
  { label: '待领取', name: 'pendingClaim' },
  { label: '已领取', name: 'claimed' },
  { label: '被拒绝', name: 'rejected' },
  { label: '已过期', name: 'expired' },
  { label: '全部记录', name: 'all' },
  { label: '实物/兑换码履约', name: 'manual' },
  { label: '派发失败', name: 'failed' }
];

const route = useRoute();
const { loading, withLoading } = useLoading();
const { loading: dispatching, withLoading: withDispatching } = useLoading();
const { loading: autoRetrying, withLoading: withAutoRetrying } = useLoading();
const { loading: fulfilling, withLoading: withFulfilling } = useLoading();

const activeTab = ref('aggregate');
const rows = ref<PromoGrantVO[]>([]);
const aggregateRows = ref<Row[]>([]);
const selected = ref<PromoGrantVO[]>([]);
const total = ref(0);
const timeRange = ref<string[]>([]);
const sourceOptions = ref<string[]>([]);
const summary = reactive<Row>({ totalCount: 0, totalAmount: 0 });

const query = reactive<PromoGrantQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10, tab: 'aggregate' });

const dispatch = reactive({ visible: false });
const dispatchFormRef = ref();
const dispatchTime = ref<string[]>([]);
const activityOptions = ref<PromoActivityVO[]>([]);
const dispatchForm = reactive({
  activityId: undefined as number | undefined,
  accountsText: '',
  rewardType: 1,
  rewardAmount: 0,
  currency: 'VND',
  auditMultiple: 0,
  dispatchMode: '玩家自领',
  rewardDesc: '',
  frontRemark: '',
  backRemark: ''
});

const dispatchRules = {
  activityId: [{ required: true, message: '请选择优惠活动', trigger: 'change' }],
  accountsText: [{ required: true, message: '请填写会员账号', trigger: 'blur' }],
  rewardAmount: [{ required: true, message: '请输入奖励金额', trigger: 'blur' }]
};

const limitDialog = reactive({ visible: false, loading: false, saving: false });
const limitRows = ref<PromoDispatchLimitVO[]>([]);
/** 履约弹窗（L13：实物/兑换码） */
const fulfillDialog = reactive({ visible: false, saving: false, orderId: 0, orderNo: '', rewardType: 0 });
const fulfillFormRef = ref();
const fulfillForm = reactive<PromoGrantFulfillForm>({ fulfillMode: 'PHYSICAL' });
const fulfillRules = {
  fulfillMode: [{ required: true, message: '请选择履约方式', trigger: 'change' }],
  receiverName: [{ required: true, message: '请填写收货人', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请填写收货电话', trigger: 'blur' }],
  receiverAddress: [{ required: true, message: '请填写收货地址', trigger: 'blur' }],
  cdkey: [{ required: true, message: '请填写兑换码', trigger: 'blur' }]
};
/** 入账设置（grant-setting 分组：真实入账开关、单批派发账号上限） */
const grantSetting = reactive({ disburseEnabled: 1, maxBatchAccounts: 200 });

const fmtMoney = (value?: number) =>
  value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

const rewardTypeText = (type?: number) =>
  ({ 1: '金币', 2: '奖金', 3: '实物', 4: '幸运值', 5: '兑换码' } as Record<number, string>)[type ?? -1] ?? '未知';

const statusText = (status?: number) =>
  ({ 0: '待申请', 1: '待审核', 2: '待领取', 3: '已领取', 4: '被拒绝', 5: '已过期', 6: '不符合条件', 7: '派发失败' } as Record<number, string>)[status ?? -1] ?? '未知';

const statusTag = (status?: number) => {
  if (status === 3) return 'success';
  if (status === 1 || status === 2) return 'warning';
  if (status === 4 || status === 6) return 'danger';
  return 'info';
};

const canAudit = (row: PromoGrantVO) => row.status === 0 || row.status === 1;

const buildParams = () => ({
  ...query,
  tab: activeTab.value,
  timeStart: timeRange.value?.[0],
  timeEnd: timeRange.value?.[1]
});

const loadRows = async () => {
  await withLoading(async () => {
    const params = buildParams();
    if (activeTab.value === 'aggregate') {
      const res = (await listPromoGrantAggregate(params)) as { data?: Row[] };
      aggregateRows.value = res.data ?? [];
      return;
    }
    const res = (await listPromoGrant(params)) as { rows?: PromoGrantVO[]; total?: number };
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
    const sum = (await getPromoGrantSummary(params)) as { data?: Row };
    Object.assign(summary, sum.data ?? { totalCount: 0, totalAmount: 0 });
  });
};

const handleTabChange = () => {
  query.pageNum = 1;
  selected.value = [];
  rows.value = [];
  aggregateRows.value = [];
  loadRows();
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
    account: undefined,
    activityName: undefined,
    rewardType: undefined,
    source: undefined,
    activityId: undefined
  });
  timeRange.value = [];
  loadRows();
};

const drillActivity = (row: Row) => {
  activeTab.value = 'audit';
  query.activityId = Number(row.activityId);
  query.pageNum = 1;
  loadRows();
};

const oneKeyAudit = async (row: Row) => {
  await modal.confirm(`确认一键审核「${row.activityName}」的全部待审核发放单（${row.pendingCount} 条）？`);
  const res = (await listPromoGrant({ activityId: Number(row.activityId), tab: 'audit', pageNum: 1, pageSize: 500 })) as {
    rows?: PromoGrantVO[];
  };
  const ids = (res.rows ?? []).map((item) => item.orderId);
  if (!ids.length) {
    modal.msgWarning('该优惠下没有待审核的发放单');
    return;
  }
  const result = (await auditPromoGrant({ orderIds: ids, action: 'approve' })) as { data?: Row };
  modal.msgSuccess(`审核完成，影响 ${result.data?.affected ?? 0} 条`);
  await loadRows();
};

const singleAudit = async (row: PromoGrantVO, action: string) => {
  if (action === 'approve') {
    await modal.confirm(`确认通过单号 ${row.orderNo}？`);
  }
  // modal.prompt 解析为 { value, action }，必须取 .value 才是用户输入文本
  const reason = action === 'approve'
    ? undefined
    : String((await modal.prompt(action === 'reject' ? '请输入拒绝原因' : '请输入不符合条件的原因'))?.value ?? '');
  if (action !== 'approve' && !reason) {
    modal.msgWarning('必须填写原因');
    return;
  }
  await doAudit([row.orderId], action, reason);
};

const handleBatch = async (action: string) => {
  if (!selected.value.length) {
    modal.msgWarning('请先选择要审核的发放单');
    return;
  }
  if (action === 'approve') {
    await modal.confirm(`确认通过选中的 ${selected.value.length} 条发放单？`);
  }
  const reason = action === 'approve'
    ? undefined
    : String((await modal.prompt(action === 'reject' ? '请输入拒绝原因' : '请输入不符合条件的原因'))?.value ?? '');
  if (action !== 'approve' && !reason) {
    modal.msgWarning('必须填写原因');
    return;
  }
  await doAudit(selected.value.map((item) => item.orderId), action, reason);
};

const doAudit = async (orderIds: number[], action: string, reason?: string) => {
  const res = (await auditPromoGrant({ orderIds, action, reason })) as { data?: Row };
  modal.msgSuccess(`操作完成，影响 ${res.data?.affected ?? 0} 条`);
  selected.value = [];
  await loadRows();
};

const handleClaim = async (row: PromoGrantVO) => {
  await modal.confirm(`确认将单号 ${row.orderNo} 标记为已领取？该操作会真实入账（钱包加款），重复操作不会重复到账。`);
  await claimPromoGrant(row.orderId);
  modal.msgSuccess('已标记为已领取（奖励已真实到账）');
  await loadRows();
};

const handleRetry = async (row: PromoGrantVO) => {
  await modal.confirm(`确认重试单号 ${row.orderNo} 的入账？重试沿用同一发放单号作为钱包幂等键，不会重复到账。`);
  const res = (await retryPromoGrant(row.orderId)) as { data?: Record<string, unknown> };
  modal.msgSuccess(`重试结果：${res.data?.outcome ?? '-'}（${res.data?.message ?? ''}）`);
  await loadRows();
};

/** 自动重试失败单（L11）：与定时任务共用同一实现，幂等且达上限自动停止 */
const handleAutoRetry = async () => {
  const res = await withAutoRetrying(async () => autoRetryPromoGrant());
  const data = (res as { data?: Record<string, unknown> }).data ?? {};
  if (data.skipped) {
    modal.msgWarning(String(data.skipped));
  } else {
    modal.msgSuccess(`自动重试完成：扫描 ${data.scanned ?? 0} 笔，到账 ${data.credited ?? 0} 笔，仍失败 ${data.failed ?? 0} 笔`);
  }
  await loadRows();
};

const openFulfill = (row: PromoGrantVO) => {
  fulfillDialog.visible = true;
  fulfillDialog.orderId = row.orderId;
  fulfillDialog.orderNo = row.orderNo;
  fulfillDialog.rewardType = row.rewardType ?? 0;
  Object.assign(fulfillForm, {
    fulfillMode: row.rewardType === 5 ? 'CDKEY' : 'PHYSICAL',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    expressCompany: '',
    expressNo: '',
    cdkey: '',
    remark: ''
  });
};

const submitFulfill = async () => {
  await fulfillFormRef.value.validate();
  const res = await withFulfilling(async () => fulfillPromoGrant(fulfillDialog.orderId, fulfillForm));
  const data = (res as { data?: Record<string, unknown> }).data ?? {};
  modal.msgSuccess(String(data.message ?? (data.completed ? '履约完成' : '已登记，待发货')));
  fulfillDialog.visible = false;
  await loadRows();
};

const editRemark = async (row: PromoGrantVO) => {
  // modal.prompt 只接受一个参数（仓库既有封装），回显历史备注放在提示文案里
  const input = await modal.prompt(`请输入后台备注（仅后台可见）${row.backRemark ? `，当前：${row.backRemark}` : ''}`);
  const remark = String(input?.value ?? '');
  if (!remark) {
    return;
  }
  await remarkPromoGrant(row.orderId, remark);
  modal.msgSuccess('备注已保存');
  await loadRows();
};

const openDispatch = async () => {
  dispatch.visible = true;
  dispatchTime.value = [];
  Object.assign(dispatchForm, {
    activityId: query.activityId,
    accountsText: '',
    rewardType: 1,
    rewardAmount: 0,
    currency: 'VND',
    auditMultiple: 0,
    dispatchMode: '玩家自领',
    rewardDesc: '',
    frontRemark: '',
    backRemark: ''
  });
  const res = (await listPromoActivity({ scope: 'active', pageNum: 1, pageSize: 200 })) as { rows?: PromoActivityVO[] };
  activityOptions.value = res.rows ?? [];
};

const submitDispatch = async () => {
  await dispatchFormRef.value.validate();
  const accounts = dispatchForm.accountsText
    .split(/[\n,，;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!accounts.length) {
    modal.msgWarning('请填写有效的会员账号');
    return;
  }
  const result = await withDispatching(async () =>
    dispatchPromoGrant({
      activityId: dispatchForm.activityId,
      accounts,
      rewardType: dispatchForm.rewardType,
      rewardAmount: dispatchForm.rewardAmount,
      currency: dispatchForm.currency,
      auditMultiple: dispatchForm.auditMultiple,
      dispatchMode: dispatchForm.dispatchMode,
      rewardDesc: dispatchForm.rewardDesc,
      frontRemark: dispatchForm.frontRemark,
      backRemark: dispatchForm.backRemark,
      claimableAt: dispatchTime.value?.[0],
      expireAt: dispatchTime.value?.[1]
    })
  );
  const data = (result as { data?: Row }).data ?? {};
  modal.msgSuccess(`派发完成：成功 ${data.successCount ?? 0} 条，失败 ${data.failCount ?? 0} 条`);
  dispatch.visible = false;
  activeTab.value = activeTab.value === 'aggregate' ? 'audit' : activeTab.value;
  query.pageNum = 1;
  await loadRows();
};

const openLimit = async () => {
  limitDialog.visible = true;
  limitDialog.loading = true;
  try {
    const res = (await listPromoDispatchLimit()) as { data?: PromoDispatchLimitVO[] };
    limitRows.value = res.data ?? [];
    const cfg = (await listPromoConfig('grant-setting')) as { data?: Array<{ configKey: string; configValue: string }> };
    const byKey = new Map((cfg.data ?? []).map((item) => [item.configKey, item.configValue]));
    grantSetting.disburseEnabled = Number(String(byKey.get('disburse_enabled') ?? '1').replace(/"/g, '')) === 0 ? 0 : 1;
    grantSetting.maxBatchAccounts = Number(String(byKey.get('max_batch_accounts') ?? '200').replace(/"/g, '')) || 200;
  } finally {
    limitDialog.loading = false;
  }
};

/** 保存入账设置：关闭入账开关后所有放款入口只流转状态、不再调用钱包（灰度与应急回滚） */
const saveGrantSetting = async () => {
  limitDialog.saving = true;
  try {
    await savePromoConfig('grant-setting', {
      items: [
        { configKey: 'disburse_enabled', configValue: String(grantSetting.disburseEnabled) },
        { configKey: 'max_batch_accounts', configValue: String(grantSetting.maxBatchAccounts) }
      ]
    });
    modal.msgSuccess('入账设置已保存');
  } finally {
    limitDialog.saving = false;
  }
};

const saveLimit = async (row: PromoDispatchLimitVO) => {
  await savePromoDispatchLimit({
    currency: row.currency,
    singleMaxAmount: row.singleMaxAmount,
    activityTotalMaxAmount: row.activityTotalMaxAmount,
    bigAmountThreshold: row.bigAmountThreshold,
    bigAmountAuditEnabled: row.bigAmountAuditEnabled
  });
  modal.msgSuccess(`${row.currency} 限额已保存`);
};

const handleExport = () => {
  const data = activeTab.value === 'aggregate' ? aggregateRows.value : rows.value;
  if (!data.length) {
    modal.msgWarning('当前筛选无数据可导出');
    return;
  }
  const header = Object.keys(data[0]);
  const csv = [header.join(','), ...data.map((row) => header.map((key) => `"${row[key] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `promotion-grant-${activeTab.value}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

onMounted(async () => {
  const res = (await listPromoSourceOptions()) as { data?: string[] };
  sourceOptions.value = res.data ?? [];
  const routeTab = route.query.tab as string | undefined;
  const routeActivityId = route.query.activityId as string | undefined;
  if (routeTab && tabs.some((tab) => tab.name === routeTab)) {
    activeTab.value = routeTab;
  }
  if (routeActivityId) {
    query.activityId = Number(routeActivityId);
  }
  await loadRows();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.query-bar {
  margin-top: 8px;
}

.toolbar-line {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-tip {
  color: #909399;
  font-size: 12px;
}

.disburse-form {
  margin-bottom: 12px;
}

.disburse-form .tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.summary-bar {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
</style>
