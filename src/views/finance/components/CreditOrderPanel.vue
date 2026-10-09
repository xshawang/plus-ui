<template>
  <div class="credit-order-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="query.account" placeholder="多账号空格/逗号分隔" clearable style="width: 220px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="单号">
          <el-input v-model="query.orderNo" placeholder="单号模糊" clearable style="width: 180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待审核" :value="0" />
            <el-option label="已入账" :value="1" />
            <el-option label="已驳回" :value="2" />
            <el-option label="已锁定" :value="3" />
            <el-option label="失败" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="query.channelCode" placeholder="渠道编码" clearable style="width: 140px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <!-- 建单入口只出现在「全部代充」页签（参照截图：代充审核页签工具条无建单/补单按钮） -->
          <template v-if="showCreate">
            <el-button v-hasPermi="[editPerm]" type="primary" icon="Plus" @click="openCreate()">新建单据</el-button>
            <!-- 代充补单：与「新建单据」同一弹窗，仅默认打开「直接入账」（参照运营后台工具条） -->
            <el-button v-hasPermi="[editPerm]" type="warning" icon="CirclePlus" @click="openCreate(true)">代充补单</el-button>
          </template>
          <el-button icon="Download" @click="exportOpen = true">导出</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        资金口径：金额与赠送均以「分」存储；审核通过才调用钱包 deposit 入账（本金 bizNo 与赠送 bizNo 分开，同单重审不重复加钱）；
        入账后由平台按充值稽核配置自动生成流水稽核任务（本页填写的倍数仅作记录）。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ title }}</h3>
            <p>共 {{ total }} 条</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" min-width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="成功时间" prop="auditedAt" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="VIP等级" prop="vipLevel" align="center" width="90" />
        <!-- 会员层级：member_user_level.level_name，无记录按会员域口径显示「默认层级」 -->
        <el-table-column label="会员层级" align="center" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ (row as CreditOrderVO).memberLevel || '默认层级' }}</template>
        </el-table-column>
        <el-table-column label="注册来源" prop="registerSource" align="center" width="120" show-overflow-tooltip />
        <!-- 会员币种(比例)：建单快照，两段展示更贴近参照页（VND / VND1000:1） -->
        <el-table-column label="会员币种(比例)" align="center" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as CreditOrderVO).currency || '—' }}
            <span v-if="(row as CreditOrderVO).currencyRate"> / {{ (row as CreditOrderVO).currencyRate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" prop="amount" align="right" width="140" :formatter="moneyColumnFormatter" />
        <el-table-column label="赠送金额" prop="bonusAmount" align="right" width="120" :formatter="moneyColumnFormatter" />
        <el-table-column label="总上分金额" prop="totalCreditAmount" align="right" width="150" :formatter="moneyColumnFormatter" />
        <el-table-column label="充值大类" prop="rechargeGroupName" align="center" width="120" show-overflow-tooltip />
        <el-table-column label="通道名称" prop="channelName" align="center" width="130" show-overflow-tooltip />
        <!-- 充值信息：客服代充填「凭证说明」，转账充值有独立的付款账号/流水号/附言列 -->
        <el-table-column v-if="!isTransfer" label="充值信息" prop="proofRemark" align="left" min-width="150" show-overflow-tooltip />
        <el-table-column label="稽核倍数" prop="turnoverMultiple" align="right" width="100" />
        <el-table-column label="渠道编码" prop="channelCode" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="付款人/经办" prop="payerName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="标记" prop="tag" align="center" width="110" show-overflow-tooltip />
        <!-- 备注：参考页只有一列「备注」，这里优先显示后台备注，无则回落到前台备注 -->
        <el-table-column label="备注" align="left" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as CreditOrderVO).backRemark || (row as CreditOrderVO).frontRemark || '' }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="lastOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="创建人" prop="operatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditOperatorId" align="center" width="110" show-overflow-tooltip />
        <!-- 转账充值专属列：客户端（/payment/bank）提交的付款账号/银行交易码/转账附言必须可见，
             否则运营无法核对"谁在什么时间用什么账号转了多少钱"，只能看到付款人姓名。 -->
        <el-table-column v-if="isTransfer" label="付款账号" prop="payerAccount" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="isTransfer" label="转账流水号" prop="transferNo" align="center" min-width="160" show-overflow-tooltip />
        <el-table-column v-if="isTransfer" label="转账附言" prop="transferRemark" align="left" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType((row as CreditOrderVO).status)">{{ statusText((row as CreditOrderVO).status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败/驳回原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip />
        <el-table-column label="锁定人" prop="lockOperatorId" align="center" width="110" show-overflow-tooltip />
        <!-- 行内操作（审核入账/驳回/锁定/备注）只属于「代充审核」页签；「全部代充」按截图隐藏该列 -->
        <el-table-column v-if="showActions" label="操作" align="center" fixed="right" width="280">
          <template #default="{ row }">
            <template v-if="[0, 3].includes((row as CreditOrderVO).status)">
              <el-button v-hasPermi="[editPerm]" link type="primary" @click="audit(row as CreditOrderVO, true)">审核入账</el-button>
              <el-button v-hasPermi="[editPerm]" link type="danger" @click="audit(row as CreditOrderVO, false)">驳回</el-button>
            </template>
            <el-button
              v-if="!(row as CreditOrderVO).lockOperatorId"
              v-hasPermi="[editPerm]"
              link
              type="primary"
              @click="lock(row as CreditOrderVO, 1)"
            >
              锁定
            </el-button>
            <el-button
              v-else
              v-hasPermi="[editPerm]"
              link
              type="warning"
              @click="lock(row as CreditOrderVO, 0)"
            >
              解锁
            </el-button>
            <el-button v-hasPermi="[editPerm]" link type="primary" @click="openRemark(row as CreditOrderVO)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="createOpen" :title="`新建${title}`" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="会员账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入会员账号（精确）" style="width: 260px" />
          <el-button class="ml-2" :loading="memberLoading" @click="searchMember">搜索</el-button>
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input :model-value="member?.uid ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="账户余额">
          <el-input :model-value="formatMoney(member?.available)" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            controls-position="right"
            style="width: 260px"
            @change="recalcBonus"
          />
        </el-form-item>
        <el-form-item label="赠送金额">
          <el-input-number
            v-model="form.bonusAmount"
            :min="0"
            controls-position="right"
            style="width: 260px"
            @change="onBonusManualChange"
          />
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="form.turnoverMultiple" :min="0" :precision="2" controls-position="right" style="width: 260px" />
          <span class="ml-2 text-gray-400 text-sm">仅记录：入账后由平台充值稽核配置自动生成流水要求，如需加成请到"稽核任务"页新增</span>
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="form.channelCode" placeholder="如 银行卡 / Momo / USDT / 现金" style="width: 260px" />
        </el-form-item>
        <!-- 客服渠道（仅客服代充）：选定后按「客服渠道 + 会员层级」自动带出赠送金额（口径见需求文档 14） -->
        <el-form-item v-if="!isTransfer" label="代充客服渠道">
          <el-select v-model="form.csConfigId" placeholder="选择客服渠道后自动带出赠送金额" clearable style="width: 260px" @change="onCsChannelChange">
            <el-option v-for="item in csChannels" :key="item.configId" :label="item.csName" :value="item.configId" />
          </el-select>
          <div v-if="giftHint" class="text-gray-400 text-sm">{{ giftHint }}</div>
        </el-form-item>
        <!-- 会员币种(比例)与标记：参照运营后台客服代充列表列口径，建单时快照，留空取「充值设置 → 客服代充设置」默认值 -->
        <el-form-item label="会员币种">
          <el-input v-model="form.currency" placeholder="留空取客服代充设置默认值(VND)" style="width: 260px" />
        </el-form-item>
        <el-form-item label="币种比例">
          <el-input v-model="form.currencyRate" placeholder="如 VND1000:1（留空取默认值）" style="width: 260px" />
        </el-form-item>
        <el-form-item label="标记">
          <el-input v-model="form.tag" placeholder="运营自定义标签（如 大额/风控复核）" style="width: 260px" />
        </el-form-item>
        <template v-if="orderType === 'TRANSFER'">
          <el-form-item label="付款人姓名">
            <el-input v-model="form.payerName" style="width: 260px" />
          </el-form-item>
          <el-form-item label="付款人账号">
            <el-input v-model="form.payerAccount" style="width: 320px" />
          </el-form-item>
          <el-form-item label="付款银行">
            <el-input v-model="form.payerBank" style="width: 260px" />
          </el-form-item>
          <el-form-item label="转账流水号">
            <el-input v-model="form.transferNo" style="width: 320px" />
          </el-form-item>
          <el-form-item label="凭证URL">
            <el-input v-model="form.voucherUrl" placeholder="转账凭证图片地址" style="width: 420px" />
          </el-form-item>
          <el-form-item label="转账附言">
            <el-input v-model="form.transferRemark" style="width: 320px" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="经办客服">
            <el-input v-model="form.payerName" style="width: 260px" />
          </el-form-item>
          <el-form-item label="凭证说明">
            <el-input v-model="form.proofRemark" style="width: 420px" />
          </el-form-item>
        </template>
        <el-form-item label="直接入账">
          <el-switch v-model="form.creditNow" />
          <span class="ml-2 text-gray-400 text-sm">开启=创建即入账（补单场景）；关闭=生成待审核单据</span>
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="form.backRemark" type="textarea" :rows="2" style="width: 420px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="remarkOpen" title="备注维护" width="560px" append-to-body>
      <el-form label-width="120px">
        <el-form-item label="前台备注">
          <el-input v-model="remarkForm.frontRemark" type="textarea" :rows="2" placeholder="会员端可见" />
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="remarkForm.backRemark" type="textarea" :rows="2" placeholder="仅后台可见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRemark">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportOpen" title="导出字段列表" width="620px" append-to-body>
      <el-checkbox-group v-model="exportProps">
        <el-checkbox v-for="column in allColumns" :key="column.prop" :value="column.prop" class="mr-3">
          {{ column.label }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="exportOpen = false">取消</el-button>
        <el-button type="primary" @click="doExport">导出 CSV</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { getMemberAsset } from '@/api/finance/manual-adjust';
import type { FinanceMemberAssetVO } from '@/api/finance/manual-adjust/types';
import {
  auditCsOrder,
  auditTransferOrder,
  createCsOrder,
  createTransferOrder,
  listCsOrders,
  listTransferOrders,
  lockCsOrder,
  lockTransferOrder,
  remarkCsOrder,
  remarkTransferOrder
} from '@/api/finance/credit-order';
import type { CreditOrderForm, CreditOrderQuery, CreditOrderVO } from '@/api/finance/credit-order';
import { exportCsv, type CsvColumn } from './csvExport';
import { getCsGiftRatio, listCsChannels } from '@/api/finance/cs-config';
import type { CsChannelVO } from '@/api/finance/cs-config';
import { formatMoney, moneyColumnFormatter } from '@/utils/money';

/**
 * 转账充值单 / 客服代充单共用面板（需求文档 2_财务/06、07）。
 *
 * 两类单据流程一致（创建 → 锁定领单 → 审核入账/驳回 → 备注），差异只在采集字段与接口前缀，
 * 因此抽成一个组件由两个页面按 orderType 复用，避免两份几乎相同的页面各自演进。
 */
const props = withDefaults(
  defineProps<{
    orderType: 'TRANSFER' | 'CS';
    title: string;
    listPerm: string;
    editPerm: string;
    /**
     * 初始状态筛选。
     *
     * 为什么需要：参照运营后台「客服代充」页签结构——「代充审核」默认只看待审核（status=0），
     * 「全部代充」不筛状态。两个页签共用同一列表，只差这一个默认值，因此以 prop 传入而不是复制页面。
     */
    initialStatus?: number;
    /**
     * 是否展示「新建单据 / 代充补单」按钮。
     *
     * 为什么需要开关：参照截图，「代充审核」页签工具条只有「审核设置/不自动刷新/导出报表」，
     * 建单入口只出现在「全部代充」页签；用开关复用同一列表面板，避免复制两份页面后各自漂移。
     */
    showCreate?: boolean;
    /**
     * 是否展示行内「操作」列。
     *
     * 为什么需要开关：参照截图，「全部代充」页签末列止于「订单状态」，「操作」列只属于「代充审核」页签。
     */
    showActions?: boolean;
  }>(),
  { showCreate: true, showActions: true }
);

const loading = ref(false);
const submitting = ref(false);
const memberLoading = ref(false);
const rows = ref<CreditOrderVO[]>([]);
const total = ref(0);
/** 可选的客服渠道（仅客服代充页用；转账充值不显示该字段） */
const csChannels = ref<CsChannelVO[]>([]);
/** 赠送比例命中提示（会员层级 + 比例 + 命中方式），只在选了客服渠道后显示 */
const giftHint = ref('');
/** 当前渠道×会员层级命中的赠送比例（%），用于金额变化时重算赠送金额 */
const currentGiftRate = ref(0);
/** 赠送金额是否来自「按层级自动带出」：true=提交时不覆盖（交给服务端口径），false=运营手工值 */
const bonusFromRule = ref(false);
const createOpen = ref(false);
const remarkOpen = ref(false);
const exportOpen = ref(false);
const formRef = ref<FormInstance>();
const member = ref<FinanceMemberAssetVO>();
const remarkTarget = ref<CreditOrderVO>();
const exportProps = ref<string[]>(['orderNo', 'account', 'amount', 'bonusAmount', 'status', 'createdAt']);

const query = reactive<CreditOrderQuery>({
  account: '',
  orderNo: '',
  status: props.initialStatus,
  channelCode: '',
  pageNum: 1,
  pageSize: 10
});

const form = reactive<CreditOrderForm>({
  uid: undefined,
  account: '',
  amount: 0,
  bonusAmount: 0,
  turnoverMultiple: 0,
  channelCode: '',
  currency: '',
  currencyRate: '',
  tag: '',
  payerName: '',
  payerAccount: '',
  payerBank: '',
  transferNo: '',
  voucherUrl: '',
  transferRemark: '',
  proofRemark: '',
  creditNow: false,
  backRemark: '',
  requestId: ''
});

const remarkForm = reactive<{ frontRemark?: string; backRemark?: string }>({ frontRemark: '', backRemark: '' });

const rules: FormRules = {
  account: [{ required: true, message: '请输入会员账号', trigger: 'blur' }],
  amount: [{ required: true, message: '充值金额不能为空', trigger: 'blur' }]
};

const isTransfer = computed(() => props.orderType === 'TRANSFER');

const allColumns: CsvColumn[] = [
  { label: '单号', prop: 'orderNo' },
  { label: '会员ID', prop: 'uid' },
  { label: '会员账号', prop: 'account' },
  { label: '创建时间', prop: 'createdAt' },
  { label: '成功时间', prop: 'auditedAt' },
  { label: 'VIP等级', prop: 'vipLevel' },
  { label: '会员层级', prop: 'memberLevel' },
  { label: '注册来源', prop: 'registerSource' },
  { label: '会员币种', prop: 'currency' },
  { label: '币种比例', prop: 'currencyRate' },
  { label: '订单金额', prop: 'amount' },
  { label: '赠送金额', prop: 'bonusAmount' },
  { label: '总上分金额', prop: 'totalCreditAmount' },
  { label: '充值大类', prop: 'rechargeGroupName' },
  { label: '通道名称', prop: 'channelName' },
  { label: '充值信息', prop: 'proofRemark' },
  { label: '稽核倍数', prop: 'turnoverMultiple' },
  { label: '渠道编码', prop: 'channelCode' },
  { label: '付款人/经办', prop: 'payerName' },
  // 转账充值导出必须带上客户端提交的三个核对字段（与列表列保持一致）
  ...(isTransfer.value
    ? ([
        { label: '付款账号', prop: 'payerAccount' },
        { label: '转账流水号', prop: 'transferNo' },
        { label: '转账附言', prop: 'transferRemark' }
      ] as CsvColumn[])
    : []),
  { label: '标记', prop: 'tag' },
  { label: '状态', prop: 'status', format: (row) => statusText(Number(row.status)) },
  { label: '操作人', prop: 'lastOperatorId' },
  { label: '创建人', prop: 'operatorId' },
  { label: '审核人', prop: 'auditOperatorId' },
  { label: '锁定人', prop: 'lockOperatorId' },
  { label: '失败/驳回原因', prop: 'failReason' },
  { label: '前台备注', prop: 'frontRemark' },
  { label: '后台备注', prop: 'backRemark' }
];

const selectedColumns = computed(() => allColumns.filter((column) => exportProps.value.includes(column.prop)));

function statusText(status: number) {
  return status === 1 ? '已入账' : status === 2 ? '已驳回' : status === 3 ? '已锁定' : status === 4 ? '失败' : '待审核';
}

function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 || status === 4 ? 'danger' : status === 3 ? 'warning' : 'info';
}

const load = async () => {
  loading.value = true;
  try {
    const res = isTransfer.value ? await listTransferOrders(query) : await listCsOrders(query);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.account = '';
  query.orderNo = '';
  // 重置回当前页签的默认状态（审核页=待审核，全部代充=全部）
  query.status = props.initialStatus;
  query.channelCode = '';
  query.pageNum = 1;
  load();
};

const searchMember = async () => {
  if (!form.account) {
    modal.msgWarning('请输入会员账号');
    return;
  }
  memberLoading.value = true;
  try {
    const res = await getMemberAsset({ account: form.account });
    member.value = res.data;
    form.uid = res.data?.uid;
    // 会员层级决定赠送比例：选定会员后重算一次，避免"先选渠道后选会员"时比例按旧层级算
    if (form.csConfigId) {
      await onCsChannelChange();
    }
  } finally {
    memberLoading.value = false;
  }
};

/**
 * 打开新建弹窗。
 *
 * 为什么带参数：参照运营后台「客服代充」工具条，除「创建订单」外还有一个「代充补单」入口，
 * 两者差异只是「直接入账」开关的默认值（补单=创建即入账），复用同一弹窗可以避免两套表单漂移。
 */
const openCreate = (creditNow = false) => {
  Object.assign(form, {
    uid: undefined,
    account: '',
    amount: 0,
    bonusAmount: 0,
    turnoverMultiple: 0,
    channelCode: '',
    csConfigId: undefined,
    bonusOverride: false,
    currency: '',
    currencyRate: '',
    tag: '',
    payerName: '',
    payerAccount: '',
    payerBank: '',
    transferNo: '',
    voucherUrl: '',
    transferRemark: '',
    proofRemark: '',
    creditNow,
    backRemark: '',
    // 幂等请求号在打开弹窗时生成一次并复用，网络重试不会重复建单
    requestId: `${props.orderType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  });
  member.value = undefined;
  giftHint.value = '';
  currentGiftRate.value = 0;
  bonusFromRule.value = false;
  createOpen.value = true;
};

/**
 * 加载可选的客服渠道（仅启用）。
 *
 * 为什么只取 status=1：关闭的渠道不应再被用于新建代充单（历史单据仍能通过 cs_config_id 回溯）。
 */
const loadCsChannels = async () => {
  if (isTransfer.value) {
    return;
  }
  const res = await listCsChannels({ status: 1, pageNum: 1, pageSize: 200 });
  csChannels.value = res.data?.rows ?? [];
};

/** 选客服渠道后按「渠道 + 会员层级」取赠送比例，并自动带出赠送金额。 */
const onCsChannelChange = async () => {
  bonusFromRule.value = false;
  giftHint.value = '';
  currentGiftRate.value = 0;
  const configId = Number(form.csConfigId ?? 0);
  if (!configId) {
    return;
  }
  const res = await getCsGiftRatio(configId, member.value?.uid ?? form.uid);
  const rate = Number(res.data?.giftRate ?? 0);
  currentGiftRate.value = rate;
  const matchedText =
    res.data?.matched === 'EXACT' ? '按会员层级命中' : res.data?.matched === 'DEFAULT' ? '未命中，回落默认层级' : '该渠道未配置比例';
  giftHint.value = `会员层级：${res.data?.levelName ?? '-'}　赠送比例：${rate}%（${matchedText}）`;
  applyBonusFromRule(rate);
};

/** 金额变化时按已命中的比例重算赠送金额（只在赠送金额仍是"自动带出"状态时覆盖）。 */
const recalcBonus = () => {
  if (currentGiftRate.value > 0 && bonusFromRule.value) {
    applyBonusFromRule(currentGiftRate.value);
  }
};

/** 按比例计算并写入赠送金额；rate<=0 时不动原值（避免把运营手填值清零）。 */
const applyBonusFromRule = (rate: number) => {
  const amount = Number(form.amount ?? 0);
  if (rate <= 0 || amount <= 0) {
    return;
  }
  form.bonusAmount = Math.round((amount * rate) / 100);
  bonusFromRule.value = true;
};

/** 运营手工修改赠送金额 → 标记为"以手工值为准"（提交时带上 bonusOverride）。 */
const onBonusManualChange = () => {
  if (bonusFromRule.value) {
    bonusFromRule.value = false;
  }
};

const submitCreate = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!form.uid) {
    modal.msgWarning('请先搜索并确认有效的会员账号');
    return;
  }
  submitting.value = true;
  try {
    // 赠送金额若仍由"按层级自动带出"，则不带 override，让服务端按同一口径再算一次（防前端被绕过）；
    // 运营手工改过则置 true，以手工值为准。
    form.bonusOverride = !bonusFromRule.value;
    const res = isTransfer.value ? await createTransferOrder({ ...form }) : await createCsOrder({ ...form });
    modal.msgSuccess(`单据已创建：${res.data?.orderNo ?? ''}`);
    createOpen.value = false;
    load();
    if (member.value) {
      await searchMember();
    }
  } finally {
    submitting.value = false;
  }
};

const audit = async (row: CreditOrderVO, approve: boolean) => {
  let remark = '';
  if (!approve) {
    const result = await modal.prompt('请输入驳回原因');
    remark = String(result.value ?? '');
  } else {
    await modal.confirm(`确认审核通过并立即入账 ${row.amount} 分给 ${row.account ?? row.uid}？`);
  }
  if (isTransfer.value) {
    await auditTransferOrder(row.orderId, approve, remark);
  } else {
    await auditCsOrder(row.orderId, approve, remark);
  }
  modal.msgSuccess(approve ? '审核通过并已入账' : '已驳回');
  load();
};

const lock = async (row: CreditOrderVO, value: number) => {
  if (isTransfer.value) {
    await lockTransferOrder(row.orderId, value);
  } else {
    await lockCsOrder(row.orderId, value);
  }
  modal.msgSuccess(value === 1 ? '已锁定领单' : '已解锁');
  load();
};

const openRemark = (row: CreditOrderVO) => {
  remarkTarget.value = row;
  remarkForm.frontRemark = row.frontRemark ?? '';
  remarkForm.backRemark = row.backRemark ?? '';
  remarkOpen.value = true;
};

const submitRemark = async () => {
  const target = remarkTarget.value;
  if (!target) {
    return;
  }
  submitting.value = true;
  try {
    if (isTransfer.value) {
      await remarkTransferOrder(target.orderId, remarkForm.frontRemark, remarkForm.backRemark);
    } else {
      await remarkCsOrder(target.orderId, remarkForm.frontRemark, remarkForm.backRemark);
    }
    modal.msgSuccess('备注已保存');
    remarkOpen.value = false;
    load();
  } finally {
    submitting.value = false;
  }
};

const doExport = () => {
  if (selectedColumns.value.length === 0) {
    modal.msgWarning('请至少选择一个导出字段');
    return;
  }
  exportCsv(`${props.orderType === 'TRANSFER' ? 'transfer-order' : 'cs-recharge'}-${Date.now()}.csv`,
    rows.value as unknown as Array<Record<string, unknown>>, selectedColumns.value);
  exportOpen.value = false;
};

load();
// 客服代充页需要客服渠道下拉；转账充值页不请求（isTransfer 内部直接返回）
loadCsChannels();
</script>
