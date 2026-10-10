<template>
  <div class="p-2 app-container member-detail-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="uidInput" placeholder="请输入会员ID" clearable style="width: 240px" @keyup.enter="handleLoad" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="loading" @click="handleLoad">查询</el-button>
          <el-button icon="Refresh" @click="resetAll">重置</el-button>
          <el-button v-hasPermi="['member:detail:plain']" plain icon="View" :disabled="!currentUid" @click="openPlain">明文查看</el-button>
          <el-button v-hasPermi="['member:user:edit']" plain icon="Message" :disabled="!currentUid" @click="openEmail">维护邮箱</el-button>
          <el-button v-hasPermi="['member:user:edit']" plain icon="Edit" :disabled="!currentUid" @click="openVipAdjust">VIP改档</el-button>
        </el-form-item>
        <el-form-item v-if="overview.loginName">
          <span class="text-gray-500">
            账号：{{ overview.loginName }}（{{ overview.currency }}）· 层级：{{ overview.levelName || '默认层级' }} ·
            VIP{{ overview.vipLevel ?? 0 }}
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="overview.uid" shadow="hover" class="table-panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="会员概览" name="overview">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="会员ID">{{ overview.uid }}</el-descriptions-item>
            <el-descriptions-item label="会员账号">{{ overview.loginName }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="overview.status === 1 ? 'success' : 'danger'">{{ statusLabel(overview.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="账号类型">{{ overview.accountType || 'FORMAL' }}</el-descriptions-item>
            <el-descriptions-item label="注册方式">{{ overview.registerType || 'ACCOUNT' }}</el-descriptions-item>
            <el-descriptions-item label="验证方式">{{ overview.verifyType || 'NONE' }}</el-descriptions-item>
            <el-descriptions-item label="会员层级">{{ overview.levelName || '默认层级' }}</el-descriptions-item>
            <el-descriptions-item label="会员标签">{{ overview.tagNames || '—' }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ overview.realName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="VIP等级">
              VIP{{ overview.vipLevel ?? 0 }}
              <span v-if="overview.vipUpgradeNeedPay != null" class="text-gray-400 text-sm">
                （距下一级还需充值 {{ fmtMoney(overview.vipUpgradeNeedPay) }} VND、打码
                {{ overview.vipUpgradeNeedRounds ?? 0 }} 局）
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="总余额">
              {{ fmtFen(overview.availableBalance) }}
              <span v-if="Number(overview.frozenBalance) > 0" class="text-orange-500">（冻结 {{ fmtFen(overview.frozenBalance) }}）</span>
            </el-descriptions-item>
            <el-descriptions-item label="奖励钱包">{{ fmtFen(overview.bonusBalance) }}</el-descriptions-item>
            <el-descriptions-item label="总充值（次数）">
              {{ fmtFen(overview.totalRechargeAmount) }}（{{ overview.totalRechargeCount ?? 0 }} 次）
            </el-descriptions-item>
            <el-descriptions-item label="总提现（次数）">
              {{ fmtFen(overview.totalWithdrawAmount) }}（{{ overview.totalWithdrawCount ?? 0 }} 次）
            </el-descriptions-item>
            <el-descriptions-item label="充提差额">{{ fmtFen(overview.balanceDiff) }}</el-descriptions-item>
            <el-descriptions-item label="首充金额">{{ fmtFen(overview.firstDepositAmount) }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ overview.registerAt || '—' }}</el-descriptions-item>
            <el-descriptions-item label="注册IP">{{ overview.registerIp || '—' }}</el-descriptions-item>
            <el-descriptions-item label="注册设备">{{ overview.registerDevice || '—' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间">{{ overview.lastLoginAt || '—' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录IP">{{ overview.lastLoginIp || '—' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录终端">
              {{ (overview.lastLoginClientType || '—') + ' ' + (overview.lastLoginOs || '') }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="联系方式" name="contact">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="手机号（掩码）">{{ contact.phoneMask || '—' }}</el-descriptions-item>
            <el-descriptions-item label="手机已验证">{{ contact.phoneVerified === 1 ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ contact.realName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="KYC等级">{{ contact.kycLevel ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="KYC状态">{{ kycStatusLabel(contact.kycStatus) }}</el-descriptions-item>
            <el-descriptions-item label="KYC通过时间">{{ contact.kycVerifiedAt || '—' }}</el-descriptions-item>
          </el-descriptions>
          <div class="text-gray-400 text-sm mt-2">合规提示：明文手机号需安全码解密（该能力待接入，见需求文档 02 遗留）。</div>
        </el-tab-pane>

        <el-tab-pane label="个人资料" name="profile">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="昵称">{{ profile.nickname || '—' }}</el-descriptions-item>
            <el-descriptions-item label="头像">
              <el-avatar v-if="profile.avatarUrl" :src="profile.avatarUrl" :size="36" />
              <span v-else>—</span>
            </el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderLabel(profile.gender) }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ profile.birthday || '—' }}</el-descriptions-item>
            <el-descriptions-item label="国家/语言">{{ (profile.countryCode || '—') + ' / ' + (profile.languageCode || '—') }}</el-descriptions-item>
            <el-descriptions-item label="邀请码">{{ profile.inviteCode || '—' }}</el-descriptions-item>
            <el-descriptions-item label="邀请人UID">{{ profile.inviteUid || '—' }}</el-descriptions-item>
            <el-descriptions-item label="上级代理UID">{{ profile.parentAgentUid || '—' }}</el-descriptions-item>
            <el-descriptions-item label="顶层代理UID">{{ profile.topAgentUid || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="提现账号" name="withdraw">
          <el-table :data="withdrawAccounts" border>
            <el-table-column label="类型" align="center" width="90">
              <template #default="{ row }">{{ accountTypeLabel(row.accountType) }}</template>
            </el-table-column>
            <el-table-column label="银行/渠道" prop="bankName" align="center" min-width="140" show-overflow-tooltip />
            <el-table-column label="开户名" prop="accountName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="账号（掩码）" prop="accountNoMask" align="center" min-width="150" />
            <el-table-column label="默认" align="center" width="80">
              <template #default="{ row }">{{ row.isPrimary === 1 ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">{{ row.status === 1 ? '正常' : row.status === 2 ? '冻结' : '已删除' }}</template>
            </el-table-column>
            <el-table-column label="最近使用" prop="lastUsedAt" align="center" width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="账户交易" name="transaction">
          <el-table v-loading="tabLoading.transaction" :data="transactions" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="流水号" prop="ledgerNo" align="left" min-width="220" show-overflow-tooltip />
            <el-table-column label="账变大类" align="center" width="110">
              <template #default="{ row }">{{ bizTypeLabel(row.bizType) }}</template>
            </el-table-column>
            <el-table-column label="变动金额" align="right" width="140">
              <template #default="{ row }">
                <span :class="Number(row.changeAmount) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.changeAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变动前余额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.beforeBalance) }}</template>
            </el-table-column>
            <el-table-column label="变动后余额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.afterBalance) }}</template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="txTotal > 0"
            v-model:page="txQuery.pageNum"
            v-model:limit="txQuery.pageSize"
            :total="txTotal"
            @pagination="loadTransactions"
          />
        </el-tab-pane>

        <el-tab-pane label="投注统计" name="bet">
          <el-table v-loading="tabLoading.bet" :data="betStats" border>
            <el-table-column label="日期" prop="statDate" align="center" width="130" />
            <el-table-column label="游戏" prop="gameCode" align="center" width="140" />
            <el-table-column label="注单数" prop="betCount" align="right" width="110" />
            <el-table-column label="投注金额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.betAmount) }}</template>
            </el-table-column>
            <el-table-column label="派彩金额" align="right" width="140">
              <template #default="{ row }">{{ fmtFen(row.payoutAmount) }}</template>
            </el-table-column>
            <el-table-column label="会员输赢" align="right" width="140">
              <template #default="{ row }">
                <span :class="Number(row.netWinLoss) >= 0 ? 'text-red-500' : 'text-green-600'">{{ fmtFen(row.netWinLoss) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="杀率" align="right" width="110">
              <template #default="{ row }">{{ Number(row.killRate ?? 0).toFixed(2) }}%</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="会员消息" name="message">
          <el-table v-loading="tabLoading.message" :data="messages" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="类型" align="center" width="100">
              <template #default="{ row }">{{ mailTypeLabel(row.mailType) }}</template>
            </el-table-column>
            <el-table-column label="标题" prop="title" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="内容" prop="content" align="left" min-width="260" show-overflow-tooltip />
            <el-table-column label="已读" align="center" width="80">
              <template #default="{ row }">{{ row.isRead === 1 ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="登录设备" name="device">
          <el-table v-loading="tabLoading.device" :data="devices" border>
            <el-table-column label="最近登录" prop="lastLoginAt" align="center" width="180" />
            <el-table-column label="设备号" prop="deviceId" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="客户端" align="center" min-width="120">
              <template #default="{ row }">{{ row.clientType || '—' }} {{ row.os || '' }}</template>
            </el-table-column>
            <el-table-column label="IP" prop="lastLoginIp" align="center" min-width="140" />
            <el-table-column label="信任设备" align="center" width="100">
              <template #default="{ row }">{{ row.isTrustDevice === 1 ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="会员日志" name="log">
          <el-table v-loading="tabLoading.log" :data="logs" border>
            <el-table-column label="登录时间" prop="loginAt" align="center" width="180" />
            <el-table-column label="登录IP" prop="loginIp" align="center" min-width="140" />
            <el-table-column label="设备" prop="loginDevice" align="left" min-width="200" show-overflow-tooltip />
            <el-table-column label="结果" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.loginResult === 1 ? 'success' : 'danger'">{{ row.loginResult === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="失败原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="历史备注" name="remark">
          <div class="mb-2">
            <el-input v-model="newRemark" type="textarea" :rows="2" placeholder="请输入新备注（将记录变更履历）" style="max-width: 640px" />
            <el-button v-hasPermi="['member:user:edit']" class="ml-2" type="primary" @click="submitRemark">保存备注</el-button>
          </div>
          <el-table v-loading="tabLoading.remark" :data="remarks" border>
            <el-table-column label="时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="原备注" prop="oldRemark" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="新备注" prop="newRemark" align="left" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operatorId" align="center" width="150" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-empty v-else description="请输入会员ID后查询" />

    <el-dialog v-model="plainDialog.visible" title="联系方式明文查看（高敏操作已记日志）" width="720px" append-to-body destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会员ID">{{ plainDialog.data.uid }}</el-descriptions-item>
        <el-descriptions-item label="会员账号">{{ plainDialog.data.loginName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ plainDialog.data.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机已验证">{{ plainDialog.data.phoneVerified === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ plainDialog.data.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="KYC等级">{{ plainDialog.data.kycLevel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ plainDialog.data.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱已验证">{{ plainDialog.data.emailVerified === 1 ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert class="mt-3" type="warning" :closable="false" :title="plainDialog.data.cardNote || '提现卡号仅存哈希与掩码，无法还原明文'" />
      <el-table class="mt-3" border :data="plainDialog.data.accounts ?? []" max-height="260">
        <el-table-column label="银行" prop="bankName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="开户名" prop="accountName" align="center" min-width="110" show-overflow-tooltip />
        <el-table-column label="卡号(掩码)" prop="accountNoMask" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column label="预留手机" prop="mobile" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="主账号" align="center" width="90">
          <template #default="{ row }">{{ row.isPrimary === 1 ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="plainDialog.visible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="vipDialog.visible" title="VIP 等级调整（写 user_vip_log）" width="520px" append-to-body destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="会员ID">
          <span>{{ currentUid }}</span>
        </el-form-item>
        <el-form-item label="目标VIP等级">
          <el-input-number v-model="vipDialog.vipLevel" :min="0" :max="99" controls-position="right" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="vipDialog.reason" type="textarea" :rows="3" maxlength="255" placeholder="必填：说明调整依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="vipDialog.saving" @click="submitVipAdjust">确 定</el-button>
        <el-button @click="vipDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="emailDialog.visible" title="维护会员邮箱" width="520px" append-to-body destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="会员ID">
          <span>{{ currentUid }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="emailDialog.email" placeholder="name@example.com" />
        </el-form-item>
        <el-form-item label="标记已验证">
          <el-switch v-model="emailDialog.verified" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="emailDialog.saving" @click="submitEmail">确 定</el-button>
        <el-button @click="emailDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberDetail" lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import {
  getMemberDetailContact,
  getMemberDetailOverview,
  getMemberDetailProfile,
  listMemberBetStat,
  listMemberMessage,
  listMemberRemarkHistory,
  listMemberTransaction,
  listMemberWithdrawAccount,
  updateMemberRemark
} from '@/api/member/detail';
import type {
  MemberBetStatVO,
  MemberContactVO,
  MemberDetailOverviewVO,
  MemberMessageVO,
  MemberProfileVO,
  MemberRemarkVO,
  MemberTransactionVO,
  MemberWithdrawAccountVO
} from '@/api/member/detail/types';
import { listMemberDevice } from '@/api/member/device';
import type { MemberDeviceVO } from '@/api/member/device/types';
import { listMemberLog } from '@/api/member/log';
import type { MemberLogVO } from '@/api/member/log/types';
// FIX(2026-10-10): 会员详情支持"账号 → uid"解析，需要复用会员列表接口（见 handleLoad）
import { listMemberUser } from '@/api/member/users';
import type { MemberUserVO } from '@/api/member/users/types';

type DataBody<T> = { data?: T };
type PageBody<T> = { rows?: T[]; total?: number };

const uidInput = ref<string>('');
const activeTab = ref('overview');
const loading = ref(false);
const currentUid = ref<string | number | null>(null);

const overview = reactive<MemberDetailOverviewVO>({ uid: 0 });
const contact = reactive<MemberContactVO>({ uid: 0 });
const profile = reactive<MemberProfileVO>({ uid: 0 });
const withdrawAccounts = ref<MemberWithdrawAccountVO[]>([]);
const transactions = ref<MemberTransactionVO[]>([]);
const messages = ref<MemberMessageVO[]>([]);
const remarks = ref<MemberRemarkVO[]>([]);
const betStats = ref<MemberBetStatVO[]>([]);
const devices = ref<MemberDeviceVO[]>([]);
const logs = ref<MemberLogVO[]>([]);
const newRemark = ref('');
const txTotal = ref(0);
const txQuery = reactive({ pageNum: 1, pageSize: 10 });

/** 页签懒加载状态：避免一次请求 10 张表 */
const loaded = reactive<Record<string, boolean>>({});
const tabLoading = reactive<Record<string, boolean>>({});

const fmtFen = (fen?: number | string) => {
  const value = Number(fen ?? 0) / 100;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtMoney = (value?: number) => Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel = (status?: number) => (status === 1 ? '正常' : status === 2 ? '锁定' : status === 3 ? '注销' : '—');
const genderLabel = (gender?: number) => (gender === 1 ? '男' : gender === 2 ? '女' : '未知');
const kycStatusLabel = (status?: number) => (status === 2 ? '通过' : status === 3 ? '驳回' : status === 1 ? '待审核' : '未提交');
const accountTypeLabel = (type?: number) => (type === 1 ? '银行卡' : type === 2 ? 'UPI' : type === 3 ? '手机钱包' : '其他');
const mailTypeLabel = (type?: number) => (type === 2 ? '活动奖励' : type === 3 ? '好友' : type === 4 ? '客服' : type === 5 ? '公告' : '系统');
const bizTypeLabel = (type?: number) =>
  ({ 1: '充值', 2: '提现', 3: '下注', 4: '派彩', 5: '退款', 6: '人工调账' } as Record<number, string>)[type ?? -1] ?? '其他';

const handleLoad = async () => {
  const input = uidInput.value.trim();
  if (!input) {
    modal.msgWarning('请输入会员ID');
    return;
  }
  loading.value = true;
  try {
    // FIX(2026-10-10): 输入非数字时先按"会员账号"解析出 uid，再调用详情接口。
    // 原因：本页输入框是自由文本，旧实现把内容原样拼进路径（/infra/member/detail/{uid}/overview），
    // 后端 @PathVariable Long uid 直接类型校验失败，返回
    // "请求参数类型不匹配，参数[uid]要求类型为：'java.lang.Long'，但输入值为：'www'"。
    // 解决方案：纯数字按 uid 用；非数字先经会员列表按 loginName 精确查询换取 uid；
    // 查不到/多条时给出明确提示，不再把非法值拼进 URL（同时避免后续各页签接口重复报错）。
    let uid = input;
    if (!/^\d+$/.test(input)) {
      // 注意：后端 loginName 是**模糊**匹配（实测 "g318test" 会命中 g318test1/g318test2），
      // 因此这里必须再按"精确相等"过滤一次，否则会把近似账号当成目标会员。
      const matched = (await listMemberUser({ loginName: input, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberUserVO>;
      const exact = (matched.rows ?? []).filter((item) => item.loginName === input);
      if (!exact.length) {
        modal.msgWarning(`未找到账号为「${input}」的会员，请输入数字会员ID或正确的会员账号`);
        return;
      }
      if (exact.length > 1) {
        modal.msgWarning(`账号「${input}」匹配到多个会员，请输入数字会员ID精确定位`);
        return;
      }
      uid = String(exact[0].uid);
      uidInput.value = uid;
    }
    currentUid.value = uid;
    const res = (await getMemberDetailOverview(uid)) as unknown as DataBody<MemberDetailOverviewVO>;
    Object.assign(overview, res.data ?? { uid: 0 });
    if (!res.data) {
      modal.msgWarning('未查询到该会员');
      return;
    }
    // 切换会员后清空缓存，避免串号
    Object.keys(loaded).forEach((key) => delete loaded[key]);
    loaded.overview = true;
    await loadTab(activeTab.value);
  } finally {
    loading.value = false;
  }
};

const resetAll = () => {
  uidInput.value = '';
  currentUid.value = null;
  Object.assign(overview, { uid: 0 });
  Object.keys(loaded).forEach((key) => delete loaded[key]);
};

const loadTab = async (tab: string) => {
  if (!currentUid.value) {
    return;
  }
  const uid = currentUid.value;
  tabLoading[tab] = true;
  try {
    if (tab === 'contact') {
      const res = (await getMemberDetailContact(uid)) as unknown as DataBody<MemberContactVO>;
      Object.assign(contact, res.data ?? { uid: 0 });
    } else if (tab === 'profile') {
      const res = (await getMemberDetailProfile(uid)) as unknown as DataBody<MemberProfileVO>;
      Object.assign(profile, res.data ?? { uid: 0 });
    } else if (tab === 'withdraw') {
      const res = (await listMemberWithdrawAccount(uid)) as unknown as DataBody<MemberWithdrawAccountVO[]>;
      withdrawAccounts.value = res.data ?? [];
    } else if (tab === 'transaction') {
      await loadTransactions();
    } else if (tab === 'bet') {
      const res = (await listMemberBetStat(uid)) as unknown as DataBody<MemberBetStatVO[]>;
      betStats.value = res.data ?? [];
    } else if (tab === 'message') {
      const res = (await listMemberMessage(uid, { pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberMessageVO>;
      messages.value = res.rows ?? [];
    } else if (tab === 'device') {
      const res = (await listMemberDevice({ uid, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberDeviceVO>;
      devices.value = res.rows ?? [];
    } else if (tab === 'log') {
      const res = (await listMemberLog({ uid, pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberLogVO>;
      logs.value = res.rows ?? [];
    } else if (tab === 'remark') {
      const res = (await listMemberRemarkHistory(uid, { pageNum: 1, pageSize: 20 })) as unknown as PageBody<MemberRemarkVO>;
      remarks.value = res.rows ?? [];
    }
    loaded[tab] = true;
  } finally {
    tabLoading[tab] = false;
  }
};

const loadTransactions = async () => {
  if (!currentUid.value) {
    return;
  }
  const res = (await listMemberTransaction(currentUid.value, txQuery)) as unknown as PageBody<MemberTransactionVO>;
  transactions.value = res.rows ?? [];
  txTotal.value = res.total ?? 0;
};

const submitRemark = async () => {
  if (!currentUid.value) {
    return;
  }
  const res = (await updateMemberRemark({ uid: currentUid.value, remark: newRemark.value })) as unknown as DataBody<number>;
  modal.msgSuccess(`备注已保存（履历 ${res.data ?? 0}）`);
  newRemark.value = '';
  await loadTab('remark');
};

watch(activeTab, async (tab) => {
  if (!loaded[tab]) {
    await loadTab(tab);
  }
});

onMounted(() => {
  const queryUid = new URLSearchParams(window.location.search).get('uid');
  if (queryUid) {
    uidInput.value = queryUid;
    handleLoad();
  }
});

/* ---------------- 明文查看 / VIP 改档（批次 7） ---------------- */
const plainDialog = reactive<{ visible: boolean; data: any }>({ visible: false, data: {} });
const vipDialog = reactive<{ visible: boolean; vipLevel: number; reason: string; saving: boolean }>({
  visible: false,
  vipLevel: 0,
  reason: '',
  saving: false
});

/** 明文查看：独立权限点 + 服务端写操作日志；卡号只存哈希/掩码，接口会返回提示 */
const openPlain = async () => {
  if (!currentUid.value) {
    return;
  }
  const { ElMessage } = await import('element-plus');
  const { getPlainContact } = await import('@/api/member/profile-adjust');
  try {
    const res: any = await getPlainContact(currentUid.value);
    plainDialog.data = res?.data ?? {};
    plainDialog.visible = true;
  } catch (e) {
    ElMessage.error('查询失败：' + (e as Error).message);
  }
};

const openVipAdjust = () => {
  vipDialog.vipLevel = Number(overview.vipLevel ?? 0);
  vipDialog.reason = '';
  vipDialog.visible = true;
};

const submitVipAdjust = async () => {
  const { ElMessage } = await import('element-plus');
  if (!vipDialog.reason) {
    ElMessage.error('请填写调整原因');
    return;
  }
  const { adjustMemberVip } = await import('@/api/member/profile-adjust');
  vipDialog.saving = true;
  try {
    await adjustMemberVip({ uid: currentUid.value, vipLevel: vipDialog.vipLevel, reason: vipDialog.reason });
    ElMessage.success('改档成功（已写入 user_vip_log）');
    vipDialog.visible = false;
    await handleLoad();
  } catch (e) {
    ElMessage.error('改档失败：' + (e as Error).message);
  } finally {
    vipDialog.saving = false;
  }
};

/* ---------------- 邮箱维护（批次 8：补齐联系方式写入侧） ---------------- */
const emailDialog = reactive<{ visible: boolean; email: string; verified: number; saving: boolean }>({
  visible: false,
  email: '',
  verified: 0,
  saving: false
});

const openEmail = async () => {
  const { ElMessage } = await import('element-plus');
  const { getPlainContact } = await import('@/api/member/profile-adjust');
  try {
    const res: any = await getPlainContact(currentUid.value);
    emailDialog.email = res?.data?.email ?? '';
    emailDialog.verified = res?.data?.emailVerified === 1 ? 1 : 0;
    emailDialog.visible = true;
  } catch (e) {
    ElMessage.error('查询失败：' + (e as Error).message);
  }
};

const submitEmail = async () => {
  const { ElMessage } = await import('element-plus');
  const request = (await import('@/utils/request')).default;
  if (!emailDialog.email) {
    ElMessage.error('请填写邮箱');
    return;
  }
  emailDialog.saving = true;
  try {
    await request({
      url: '/infra/member/detail/email',
      method: 'post',
      data: { uid: currentUid.value, email: emailDialog.email, emailVerified: emailDialog.verified }
    });
    ElMessage.success('邮箱已保存（已写操作日志）');
    emailDialog.visible = false;
    await handleLoad();
  } catch (e) {
    ElMessage.error('保存失败：' + (e as Error).message);
  } finally {
    emailDialog.saving = false;
  }
};
</script>
