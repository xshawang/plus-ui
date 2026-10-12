<template>
  <div class="p-2 app-container member-anchor-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="时间维度">
          <el-select v-model="queryParams.dateField" placeholder="开通时间" clearable style="width: 130px">
            <el-option label="开通时间" value="CREATE" />
            <el-option label="最后登录" value="LOGIN" />
            <el-option label="最后退出" value="LOGOUT" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="账号维度">
          <el-select v-model="queryParams.accountField" placeholder="主播号" clearable style="width: 130px">
            <el-option label="主播号" value="USERNAME" />
            <el-option label="主播号(模糊)" value="USERNAME_LIKE" />
            <el-option label="主播号ID" value="STREAMER_ID" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="queryParams.accountValue" placeholder="请输入检索值" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.accountStatus" placeholder="全部" clearable style="width: 110px">
            <el-option label="正常" :value="1" />
            <el-option label="冻结" :value="2" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="在线">
          <el-select v-model="queryParams.onlineStatus" placeholder="全部" clearable style="width: 100px">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">财务隔离提示：主播号余额为虚拟额度，注单与余额不计入真实账单与财务报表。</div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>主播号</h3>
            <p>共 {{ total }} 个主播号；余额变更会写入虚拟账变流水，可核对「余额 = 初值 + Σ变动」。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:anchor:edit']" type="primary" plain icon="Plus" @click="openCreate">新增主播号</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="开通时间" prop="createdAt" align="center" width="180" />
        <el-table-column label="币种" prop="currency" align="center" width="120" />
        <el-table-column label="主播号ID" align="center" width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row as StreamerVO)">{{ row.streamerId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="主播号" align="center" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row as StreamerVO)">{{ row.username }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.accountStatus === 1 ? 'success' : row.accountStatus === 2 ? 'danger' : 'info'">
              {{ statusLabel(row.accountStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="VIP" align="center" width="80">
          <template #default="{ row }">VIP{{ row.vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="主播号层级" align="center" width="130">
          <template #default="{ row }">{{ row.levelName || '—' }}</template>
        </el-table-column>
        <el-table-column label="账号余额(虚拟)" align="right" width="160">
          <template #default="{ row }">
            <span class="text-red-500">{{ fmtMoney(row.virtualBalance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="在线" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.onlineStatus === 1 ? 'success' : 'info'">{{ row.onlineStatus === 1 ? '在线' : '离线' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录（时间/设备）" align="center" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.lastLoginTime || '--' }}</div>
            <div class="text-gray-400 text-sm">{{ row.lastLoginDevice || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最后登录IP/地区" align="center" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.lastLoginIp || '--' }}</div>
            <div class="text-gray-400 text-sm">{{ row.lastLoginRegion || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最后退出（时间/设备）" align="center" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.lastLogoutTime || '--' }}</div>
            <div class="text-gray-400 text-sm">{{ row.lastLogoutDevice || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最后退出IP/地区" align="center" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.lastLogoutIp || '--' }}</div>
            <div class="text-gray-400 text-sm">{{ row.lastLogoutRegion || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row as StreamerVO)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 新增主播号 -->
    <el-dialog v-model="createDialog.visible" title="新增主播号" width="620px" append-to-body destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="130px">
        <el-form-item label="主播号" prop="username">
          <el-input v-model="createForm.username" maxlength="64" placeholder="登录账号，全局唯一" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="初始虚拟额度">
          <el-input-number v-model="createForm.initBalance" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="VIP等级">
          <el-input-number v-model="createForm.vipLevel" :min="0" :max="30" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="主播号层级">
          <el-select v-model="createForm.levelId" placeholder="请选择层级" clearable style="width: 100%">
            <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCreate">确 定</el-button>
        <el-button @click="createDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 主播号详情 -->
    <el-dialog v-model="detail.visible" :title="'主播号详情 - ' + detail.data.username" width="1000px" append-to-body top="5vh">
      <el-tabs v-model="detail.tab">
        <el-tab-pane label="主播号概览" name="overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="主播号ID">{{ detail.data.streamerId }}</el-descriptions-item>
            <el-descriptions-item label="主播号">{{ detail.data.username }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              {{ statusLabel(detail.data.accountStatus) }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('status')">修改状态</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="账号余额（虚拟）">
              {{ fmtMoney(detail.data.virtualBalance) }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('balance')">修改余额</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="VIP等级">
              VIP{{ detail.data.vipLevel ?? 0 }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('vip')">修改VIP等级</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="主播号层级">
              {{ detail.data.levelName || '—' }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('level')">修改层级</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="登录密码">
              ******
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('password')">修改登录密码</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="提现密码">
              {{ detail.data.withdrawPasswordSet ? '******' : '未设置' }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('withdrawPassword')">重置提现密码</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="提现账号数量">{{ detail.data.withdrawAccountCount ?? 0 }} 个</el-descriptions-item>
            <el-descriptions-item label="在线状态">{{ detail.data.onlineStatus === 1 ? '在线' : '离线' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间">{{ detail.data.lastLoginTime || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录设备">{{ detail.data.lastLoginDevice || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录IP/地区">
              {{ (detail.data.lastLoginIp || '--') + ' / ' + (detail.data.lastLoginRegion || '--') }}
            </el-descriptions-item>
            <el-descriptions-item label="最后退出时间">{{ detail.data.lastLogoutTime || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最后退出设备">{{ detail.data.lastLogoutDevice || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最后退出IP/地区">
              {{ (detail.data.lastLogoutIp || '--') + ' / ' + (detail.data.lastLogoutRegion || '--') }}
            </el-descriptions-item>
            <el-descriptions-item label="备注">
              {{ detail.data.remark || '—' }}
              <el-link v-hasPermi="['member:anchor:edit']" class="ml-2" type="primary" :underline="false" @click="openChange('remark')">修改备注</el-link>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="账户交易" name="transaction">
          <el-table v-loading="txLoading" border :data="transactions">
            <el-table-column label="交易时间" prop="transactionTime" align="center" width="180" />
            <el-table-column label="账变单号" prop="transactionNo" align="left" min-width="200" show-overflow-tooltip />
            <el-table-column label="变动钱包" prop="walletType" align="center" width="130" />
            <el-table-column label="账变大类" align="center" width="120">
              <template #default="{ row }">{{ categoryLabel(row.categoryType) }}</template>
            </el-table-column>
            <el-table-column label="变动前" align="right" width="130">
              <template #default="{ row }">{{ fmtMoney(row.beforeBalance) }}</template>
            </el-table-column>
            <el-table-column label="变动金额" align="right" width="130">
              <template #default="{ row }">
                <span :class="Number(row.changeAmount) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtMoney(row.changeAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变动后" align="right" width="130">
              <template #default="{ row }">{{ fmtMoney(row.afterBalance) }}</template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorName" align="center" width="130" />
          </el-table>
          <pagination
            v-show="txTotal > 0"
            v-model:page="txQuery.pageNum"
            v-model:limit="txQuery.pageSize"
            :total="txTotal"
            @pagination="loadTransactions"
          />
        </el-tab-pane>

        <el-tab-pane label="操作历史" name="log">
          <el-table v-loading="logLoading" border :data="remarkLogs">
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="业务类型" align="center" width="110">
              <template #default="{ row }">{{ bizTypeLabel(row.bizType) }}</template>
            </el-table-column>
            <el-table-column label="变更前" prop="oldValue" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column label="变更后" prop="newValue" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column label="原因" prop="reason" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operatorName" align="center" width="130" />
          </el-table>
        </el-tab-pane>
    </el-tabs>

    <!-- 投注明细（批次 7，只读）：按主播号映射的真实玩家账号查询注单 -->
    <el-card v-if="detail.visible" shadow="never" class="mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>投注明细</h3>
            <p>{{ betMapping.note || '按主播号映射的真实玩家账号查询注单' }}</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" :loading="betLoading" @click="loadBets">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="betLoading" border :data="betRows" max-height="360">
        <el-table-column label="会员UID" prop="uid" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="局号" prop="roundNo" align="center" min-width="160" show-overflow-tooltip />
        <el-table-column label="游戏" prop="gameCode" align="center" width="130" />
        <el-table-column label="投注额(分)" prop="betAmount" align="right" width="120" />
        <el-table-column label="赔率" prop="odds" align="right" width="90" />
        <el-table-column label="派彩(分)" prop="payout" align="right" width="120" />
        <el-table-column label="结算状态" prop="settleStatus" align="center" width="130" />
        <el-table-column label="投注时间" prop="createTime" align="center" width="170" />
      </el-table>
      <pagination
        v-show="betTotal > 0"
        v-model:page="betQuery.pageNum"
        v-model:limit="betQuery.pageSize"
        :total="betTotal"
        @pagination="loadBets"
      />
    </el-card>
    </el-dialog>

    <!-- 人工变更弹窗（一次一个维度） -->
    <el-dialog v-model="change.visible" :title="change.title" width="560px" append-to-body destroy-on-close>
      <el-form label-width="140px">
        <el-form-item v-if="change.field === 'status'" label="目标状态" required>
          <el-select v-model="changeForm.accountStatus" style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="冻结（强制离线）" :value="2" />
            <el-option label="停用（强制离线）" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="change.field === 'balance'" label="变更方式" required>
          <el-radio-group v-model="change.balanceMode">
            <el-radio value="add">加款</el-radio>
            <el-radio value="sub">扣款</el-radio>
            <el-radio value="set">设为目标余额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="change.field === 'balance'" label="金额(VND)" required>
          <el-input-number
            v-if="change.balanceMode === 'add'"
            v-model="changeForm.addAmount"
            :min="0.01"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
          <el-input-number
            v-else-if="change.balanceMode === 'sub'"
            v-model="changeForm.subAmount"
            :min="0.01"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
          <el-input-number v-else v-model="changeForm.virtualBalance" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="change.field === 'vip'" label="VIP等级" required>
          <el-input-number v-model="changeForm.vipLevel" :min="0" :max="30" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="change.field === 'level'" label="主播号层级" required>
          <el-select v-model="changeForm.levelId" style="width: 100%">
            <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="change.field === 'password'" label="新登录密码" required>
          <el-input v-model="changeForm.loginPassword" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item v-if="change.field === 'withdrawPassword'" label="新提现密码">
          <el-input v-model="changeForm.withdrawPassword" type="password" show-password placeholder="留空表示清空提现密码" />
        </el-form-item>
        <el-form-item v-if="change.field === 'remark'" label="备注">
          <el-input v-model="changeForm.remark" type="textarea" :rows="3" maxlength="255" />
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="changeForm.reason" type="textarea" :rows="2" maxlength="255" placeholder="将写入操作历史" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitChange">确 定</el-button>
        <el-button @click="change.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberAnchor" lang="ts">
import { onMounted, reactive, ref, toRefs, watch } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addStreamer,
  changeStreamer,
  getStreamer,
  listStreamer,
  listStreamerRemarkLog,
  listStreamerTransaction
} from '@/api/member/anchor';
import type {
  StreamerChangeForm,
  StreamerCreateForm,
  StreamerQuery,
  StreamerRemarkLogVO,
  StreamerTransactionVO,
  StreamerVO
} from '@/api/member/anchor/types';
import { listMemberLevelOptions } from '@/api/member/level';
import type { MemberLevelVO } from '@/api/member/level/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const { loading: txLoading, withLoading: withTxLoading } = useLoading(false);
const { loading: logLoading, withLoading: withLogLoading } = useLoading(false);

const rows = ref<StreamerVO[]>([]);
const total = ref(0);
const levelOptions = ref<MemberLevelVO[]>([]);
const dateRange = ref<string[]>([]);

const createFormRef = ref();
const createDialog = reactive({ visible: false });
const detail = reactive<{ visible: boolean; tab: string; data: StreamerVO }>({ visible: false, tab: 'overview', data: { streamerId: 0, username: '' } });
const change = reactive<{ visible: boolean; field: string; title: string; balanceMode: 'add' | 'sub' | 'set' }>({
  visible: false,
  field: '',
  title: '',
  balanceMode: 'add'
});
const transactions = ref<StreamerTransactionVO[]>([]);
const remarkLogs = ref<StreamerRemarkLogVO[]>([]);
const txTotal = ref(0);
const txQuery = reactive<{ pageNum: number; pageSize: number; streamerId: number }>({ pageNum: 1, pageSize: 10, streamerId: 0 });

const data = reactive<{ queryParams: StreamerQuery; createForm: StreamerCreateForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  createForm: { username: '', password: '', initBalance: 0, vipLevel: 0, levelId: undefined, remark: '' }
});
const { queryParams, createForm } = toRefs(data);

const changeForm = reactive<StreamerChangeForm>({ streamerId: 0 });

const createRules = {
  username: [{ required: true, message: '主播号不能为空', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '登录密码不能少于 6 位', trigger: 'blur' }]
};

const fmtMoney = (value?: number) => Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusLabel = (status?: number) => (status === 1 ? '正常' : status === 2 ? '冻结' : '停用');
const categoryLabel = (type?: string) =>
  ({ MANUAL_ADD: '后台加款', MANUAL_SUB: '后台扣款', BET: '游戏下注', PAYOUT: '派彩', CLEAR: '清零' } as Record<string, string>)[type ?? ''] ?? (type || '—');
const bizTypeLabel = (type?: string) =>
  ({ REMARK: '备注', STATUS: '状态', BALANCE: '余额', VIP: 'VIP', LEVEL: '层级', PASSWORD: '密码' } as Record<string, string>)[type ?? ''] ?? (type || '—');

const getList = async () => {
  await withLoading(async () => {
    const params: StreamerQuery = { ...queryParams.value };
    if (dateRange.value && dateRange.value.length === 2) {
      params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
    }
    const res = (await listStreamer(params)) as unknown as PageBody<StreamerVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const loadOptions = async () => {
  const res = (await listMemberLevelOptions()) as unknown as DataBody<MemberLevelVO[]>;
  levelOptions.value = res.data ?? [];
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  dateRange.value = [];
  getList();
};

const openCreate = () => {
  Object.assign(createForm.value, { username: '', password: '', initBalance: 0, vipLevel: 0, levelId: undefined, remark: '' });
  createDialog.visible = true;
};

const submitCreate = () => {
  createFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const res = (await addStreamer(createForm.value)) as unknown as DataBody<number>;
    modal.msgSuccess(`新增成功（主播号ID ${res.data ?? '-'}）`);
    createDialog.visible = false;
    await getList();
  });
};

const openDetail = async (row: StreamerVO) => {
  const res = (await getStreamer(row.streamerId)) as unknown as DataBody<StreamerVO>;
  detail.data = res.data ?? row;
  detail.tab = 'overview';
  detail.visible = true;
  txQuery.streamerId = row.streamerId;
  betQuery.pageNum = 1;
  betRows.value = [];
  betTotal.value = 0;
  loadBets();
  txQuery.pageNum = 1;
  await Promise.all([loadTransactions(), loadRemarkLogs()]);
};

const loadTransactions = async () => {
  await withTxLoading(async () => {
    const res = (await listStreamerTransaction(txQuery)) as unknown as PageBody<StreamerTransactionVO>;
    transactions.value = res.rows ?? [];
    txTotal.value = res.total ?? 0;
  });
};

const loadRemarkLogs = async () => {
  await withLogLoading(async () => {
    const res = (await listStreamerRemarkLog(detail.data.streamerId, { pageNum: 1, pageSize: 20 })) as unknown as PageBody<StreamerRemarkLogVO>;
    remarkLogs.value = res.rows ?? [];
  });
};

const changeTitles: Record<string, string> = {
  status: '修改状态',
  balance: '修改余额',
  vip: '修改VIP等级',
  level: '修改主播号层级',
  password: '修改登录密码',
  withdrawPassword: '重置提现密码',
  remark: '修改备注'
};

const openChange = (field: string) => {
  Object.keys(changeForm).forEach((key) => delete (changeForm as Record<string, unknown>)[key]);
  changeForm.streamerId = detail.data.streamerId;
  change.field = field;
  change.title = changeTitles[field] ?? '人工变更';
  change.balanceMode = 'add';
  change.visible = true;
};

const submitChange = async () => {
  const payload: StreamerChangeForm = { streamerId: changeForm.streamerId };
  if (change.field === 'status') {
    payload.accountStatus = changeForm.accountStatus;
  } else if (change.field === 'balance') {
    if (change.balanceMode === 'add') {
      payload.addAmount = changeForm.addAmount;
    } else if (change.balanceMode === 'sub') {
      payload.subAmount = changeForm.subAmount;
    } else {
      payload.virtualBalance = changeForm.virtualBalance;
    }
  } else if (change.field === 'vip') {
    payload.vipLevel = changeForm.vipLevel;
  } else if (change.field === 'level') {
    payload.levelId = changeForm.levelId;
  } else if (change.field === 'password') {
    payload.loginPassword = changeForm.loginPassword;
  } else if (change.field === 'withdrawPassword') {
    payload.withdrawPassword = changeForm.withdrawPassword ?? '';
  } else {
    payload.remark = changeForm.remark;
  }
  payload.reason = changeForm.reason;

  const res = (await withSaving(async () => changeStreamer(payload))) as unknown as DataBody<number>;
  modal.msgSuccess(`变更完成（影响 ${res.data ?? 0} 条）`);
  change.visible = false;
  await openDetail(detail.data);
  await getList();
};

watch(
  () => detail.tab,
  async (tab) => {
    if (!detail.data.streamerId) {
      return;
    }
    if (tab === 'transaction') {
      await loadTransactions();
    } else if (tab === 'log') {
      await loadRemarkLogs();
    }
  }
);

onMounted(async () => {
  await loadOptions();
  await getList();
});

/* ---------------- 投注明细（批次 7，只读） ---------------- */
const betRows = ref<any[]>([]);
const betTotal = ref(0);
const betLoading = ref(false);
const betMapping = reactive<{ mapped: boolean; playerUid?: number; note: string }>({ mapped: false, note: '' });
const betQuery = reactive<{ pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10 });

/** 先取映射信息再取注单：未映射时明确提示，避免把"无数据"误判为接口故障 */
const loadBets = async () => {
  const streamerId = detail.data.streamerId;
  if (!streamerId) {
    return;
  }
  betLoading.value = true;
  try {
    const request = (await import('@/utils/request')).default;
    const mapping: any = await request({ url: `/infra/member/anchor/${streamerId}/bet-mapping`, method: 'get' });
    betMapping.mapped = !!mapping?.data?.mapped;
    betMapping.playerUid = mapping?.data?.playerUid ?? undefined;
    betMapping.note = mapping?.data?.note ?? '';
    const res: any = await request({
      url: `/infra/member/anchor/${streamerId}/bets`,
      method: 'get',
      params: { pageNum: betQuery.pageNum, pageSize: betQuery.pageSize }
    });
    betRows.value = res?.rows ?? [];
    betTotal.value = res?.total ?? 0;
  } finally {
    betLoading.value = false;
  }
};
</script>
