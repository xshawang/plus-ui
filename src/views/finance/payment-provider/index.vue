<template>
  <div class="p-2 app-container payment-provider-page">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="综合排名" name="ranking" />
        <el-tab-pane label="供应商与账号" name="accounts" />
        <el-tab-pane label="IP 白名单" name="allowlist" />
        <el-tab-pane label="会员审核策略" name="policy" />
      </el-tabs>

      <template v-if="activeTab === 'ranking'">
        <div class="toolbar-shell mb-3">
          <div class="table-heading">
            <h3>供应商综合排名</h3>
            <p>成功率 70% + P95 延时 30%，少于 30 个终结样本显示观察中；每个供应商总开关独立，可同时开启。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="rankingOperation" style="width: 130px" @change="loadRanking">
              <el-option label="代收" value="DEPOSIT" />
              <el-option label="代付" value="PAYOUT" />
            </el-select>
            <el-select v-model="rankingWindow" style="width: 120px" @change="loadRanking">
              <el-option label="1 小时" value="1H" />
              <el-option label="24 小时" value="24H" />
              <el-option label="7 天" value="7D" />
              <el-option label="30 天" value="30D" />
            </el-select>
            <el-button icon="Refresh" @click="loadRanking">刷新</el-button>
          </div>
        </div>
        <el-table v-loading="loading" border :data="ranking">
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ row }">{{ row.rank ?? '观察中' }}</template>
          </el-table-column>
          <el-table-column label="供应商" prop="providerName" min-width="150" />
          <el-table-column label="综合分" prop="compositeScore" width="100" align="right" />
          <el-table-column label="平滑成功率" width="130" align="right">
            <template #default="{ row }">{{ percent(row.smoothedSuccessRate) }}</template>
          </el-table-column>
          <el-table-column label="原始成功率" width="130" align="right">
            <template #default="{ row }">{{ percent(row.rawSuccessRate) }}</template>
          </el-table-column>
          <el-table-column label="提交成功率" width="130" align="right">
            <template #default="{ row }">{{ percent(row.submissionSuccessRate) }}</template>
          </el-table-column>
          <el-table-column label="P95" prop="p95LatencyMs" width="110" align="right">
            <template #default="{ row }">{{ duration(row.p95LatencyMs) }}</template>
          </el-table-column>
          <el-table-column label="成功/失败/待定" width="170" align="center">
            <template #default="{ row }">{{ row.successCount }} / {{ row.failedCount }} / {{ row.pendingCount }}</template>
          </el-table-column>
          <el-table-column label="总开关" width="120" align="center">
            <template #default="{ row }">
              <el-switch
                v-hasPermi="['finance:merchant:edit']"
                :model-value="row.providerStatus"
                :active-value="1"
                :inactive-value="0"
                :loading="providerTogglingIds.includes(row.providerId)"
                @change="(value: number) => toggleProvider(row as PaymentRankingVO, value)"
              />
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else-if="activeTab === 'accounts'">
        <div class="toolbar-shell mb-3">
          <div class="table-heading">
            <h3>供应商账号</h3>
            <p>有独立密钥权限时默认显示完整商户号、密钥、私钥、公钥和加密串；查看会写审计。</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="loadAccounts">刷新</el-button>
            <el-button v-hasPermi="['finance:merchant:edit']" type="primary" icon="Plus" @click="openAccount()">新增账号</el-button>
          </div>
        </div>
        <el-table v-loading="loading" border :data="accounts">
          <el-table-column label="供应商" width="110">
            <template #default="{ row }">{{ row.providerName || providerName(row.providerId) }}</template>
          </el-table-column>
          <el-table-column label="商户编码" prop="merchantCode" min-width="140" />
          <el-table-column label="商户号" prop="apiKey" min-width="160" show-overflow-tooltip />
          <el-table-column label="API 密钥" prop="apiSecret" min-width="180" show-overflow-tooltip />
          <el-table-column label="私钥" prop="privateKey" min-width="180" show-overflow-tooltip />
          <el-table-column label="公钥" prop="publicKey" min-width="180" show-overflow-tooltip />
          <el-table-column label="加密串" prop="encryptedConfig" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="210">
            <template #default="{ row }">
              <el-button v-hasPermi="['finance:merchant:edit']" link type="success" @click="testAccount(row as ProviderAccountVO)">测试</el-button>
              <el-button v-hasPermi="['finance:merchant:edit']" link type="primary" @click="openAccount(row as ProviderAccountVO)">编辑</el-button>
              <el-button v-hasPermi="['finance:merchant:edit']" link type="danger" @click="removeAccount(row as ProviderAccountVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else-if="activeTab === 'channels'">
        <div class="toolbar-shell mb-3">
          <div class="table-heading">
            <h3>供应商收付通道</h3>
            <p>全量文档通道已建档；首期生产仅应启用 VND 通道。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="channelProviderId" clearable placeholder="全部供应商" style="width: 170px" @change="loadChannels">
              <el-option v-for="item in providers" :key="item.providerId" :label="item.providerName" :value="item.providerId" />
            </el-select>
            <el-button icon="Refresh" @click="loadChannels">刷新</el-button>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openChannel()">新增通道</el-button>
          </div>
        </div>
        <el-table v-loading="loading" border :data="channels">
          <el-table-column label="供应商" width="110">
            <template #default="{ row }">{{ providerName(row.providerId) }}</template>
          </el-table-column>
          <el-table-column label="方向" prop="operation" width="90" />
          <el-table-column label="通道编码" prop="providerChannelCode" min-width="130" />
          <el-table-column label="支付类型" prop="providerPayType" min-width="130" />
          <el-table-column label="币种" prop="currency" width="90" />
          <el-table-column label="金额单位" prop="amountUnit" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-switch
                v-hasPermi="['finance:withdrawchannel:edit']"
                :model-value="row.enabled"
                :active-value="1"
                :inactive-value="0"
                @change="(value: number) => toggleChannelStatus(row as ProviderChannelVO, value)"
              />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="90">
            <template #default="{ row }">
              <el-button v-hasPermi="['finance:withdrawchannel:edit']" link type="primary" @click="openChannel(row as ProviderChannelVO)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else-if="activeTab === 'routing'">
        <el-form inline class="mb-3">
          <el-form-item label="场景">
            <el-select v-model="routingScene" style="width: 120px">
              <el-option label="代收" value="DEPOSIT" />
              <el-option label="代付" value="PAYOUT" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务通道路由">
            <el-select
              v-model="routingRefId"
              filterable
              clearable
              placeholder="选择充值路由或提现渠道"
              style="width: 320px"
              @change="loadCandidates"
            >
              <el-option
                v-for="item in routeOptions"
                :key="item.businessRefId"
                :label="`${item.groupName || ''} / ${item.routeName} (${item.routeCode})`"
                :value="item.businessRefId"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button icon="Refresh" @click="loadCandidates">刷新</el-button>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openRoute()">新增候选</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" border :data="candidates">
          <el-table-column label="候选 ID" prop="candidateId" width="100" />
          <el-table-column label="业务路由" min-width="210">
            <template #default="{ row }">{{ routeOptionLabel(row.businessRefId) }}</template>
          </el-table-column>
          <el-table-column label="供应商通道" min-width="220">
            <template #default="{ row }">{{ channelOptionLabel(row.providerChannelId) }}</template>
          </el-table-column>
          <el-table-column label="权重" width="130" align="right">
            <template #default="{ row }">{{ (row.weightBp / 100).toFixed(2) }}%</template>
          </el-table-column>
          <el-table-column label="优先级" prop="priorityNo" width="100" align="center" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">{{ row.enabled === 1 ? '启用' : '停用' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="openRoute(row as RouteCandidateVO)">修改权重</el-button>
              <el-button link type="danger" @click="removeRoute(row as RouteCandidateVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else-if="activeTab === 'allowlist'">
        <div class="toolbar-shell mb-3">
          <div class="table-heading">
            <h3>回调与反查 IP 白名单</h3>
            <p>空白名单放行到签名校验并告警；非空时 IP/CIDR 不匹配直接 403。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="allowlistProviderId" clearable placeholder="全部供应商" style="width: 170px" @change="loadAllowlists">
              <el-option v-for="item in providers" :key="item.providerId" :label="item.providerName" :value="item.providerId" />
            </el-select>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openAllowlist()">新增规则</el-button>
          </div>
        </div>
        <el-table v-loading="loading" border :data="allowlists">
          <el-table-column label="供应商" width="120">
            <template #default="{ row }">{{ providerName(row.providerId) }}</template>
          </el-table-column>
          <el-table-column label="场景" prop="scene" width="180" />
          <el-table-column label="商户账号 ID" prop="merchantId" width="120" />
          <el-table-column label="IP / CIDR" prop="ipOrCidr" min-width="180" />
          <el-table-column label="说明" prop="description" min-width="220" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">{{ row.enabled === 1 ? '启用' : '停用' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="openAllowlist(row as IpAllowlistVO)">编辑</el-button>
              <el-button link type="danger" @click="removeAllowlist(row as IpAllowlistVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="activeTab === 'policy'">
        <el-form inline class="mb-3">
          <el-form-item label="会员 UID">
            <el-input-number v-model="policyUid" :min="1" controls-position="right" />
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" @click="loadPolicy">查询</el-button>
          </el-form-item>
        </el-form>
        <el-form v-if="policy" label-width="150px" class="policy-form">
          <el-form-item label="审核策略">
            <el-radio-group v-model="policyForm.auditMode">
              <el-radio value="EVERY_TIME">每次审核</el-radio>
              <el-radio value="AUTO_PAYOUT">免审核自动出款</el-radio>
            </el-radio-group>
            <div class="text-xs text-gray-400 mt-1">
              自动出款仅在首提成功、会员无风险标签且金额不超过提现通道上限时生效。
            </div>
          </el-form-item>
          <el-form-item label="首提完成时间">
            <el-text>{{ policy.firstManualCompletedAt || '首笔成功提现后自动生效' }}</el-text>
          </el-form-item>
          <el-form-item label="变更原因">
            <el-input v-model="policyForm.reason" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item>
            <el-button v-hasPermi="['finance:withdrawadmin:edit']" type="primary" @click="savePolicy">保存策略</el-button>
          </el-form-item>
        </el-form>
      </template>
    </el-card>

    <el-dialog v-model="accountDialog" :title="accountForm.merchantId ? '编辑供应商账号' : '新增供应商账号'"
      width="1100px" top="4vh" append-to-body class="account-dialog">
      <el-form :model="accountForm" label-width="140px">
        <el-row :gutter="12">
          <el-col :span="24"><el-divider content-position="left">基础信息</el-divider></el-col>
          <el-col :span="12">
            <el-form-item label="供应商编码">
              <el-input
                v-model="accountForm.providerCode"
                maxlength="32"
                show-word-limit
                placeholder="请输入供应商编码（与供应商名称一致）"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="商户编码"><el-input v-model="accountForm.merchantCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="商户名称"><el-input v-model="accountForm.merchantName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="平台"><el-input v-model="accountForm.platform" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="结算币种"><el-select v-model="accountForm.currency" style="width: 100%"><el-option label="VND" value="VND" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-switch v-model="accountForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" /></el-form-item></el-col>

          <el-col :span="24"><el-divider content-position="left">密钥与认证</el-divider></el-col>
          <el-col :span="12"><el-form-item label="API 密钥"><el-input v-model="accountForm.apiSecret" show-password :placeholder="secretPlaceholder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="私钥"><el-input v-model="accountForm.privateKey" type="textarea" :rows="3" :placeholder="secretPlaceholder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="公钥"><el-input v-model="accountForm.publicKey" type="textarea" :rows="3" :placeholder="secretPlaceholder" /></el-form-item></el-col>

          <el-col :span="24"><el-divider content-position="left">接口域名与回调</el-divider></el-col>
          <el-col :span="12"><el-form-item label="代收接口域名"><el-input v-model="accountForm.depositApiUrl" placeholder="https://provider-deposit.example" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="代付接口域名"><el-input v-model="accountForm.payoutApiUrl" placeholder="https://provider-payout.example" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="回调 IP">
              <el-input v-model="accountForm.callbackIp" type="textarea" :rows="3"
                placeholder="多个 IP/CIDR 使用逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="超时毫秒"><el-input-number v-model="accountForm.requestTimeoutMs" :min="1000" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="代收回调地址"><el-input v-model="accountForm.depositNotifyUrl" placeholder="https://paycb.g318.com/api/payment/{provider}/{accountCode}/deposit" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="代付回调地址"><el-input v-model="accountForm.payoutNotifyUrl" placeholder="https://paycb.g318.com/api/payment/{provider}/{accountCode}/payout" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="accountDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="routeDialog" title="修改人工流量权重" width="520px" append-to-body>
      <el-form :model="routeForm" label-width="110px">
        <el-form-item label="供应商通道">
          <el-select v-model="routeForm.providerChannelId" filterable style="width: 100%">
            <el-option v-for="item in routeChannelOptions" :key="item.providerChannelId"
              :label="channelOptionLabel(item.providerChannelId)"
              :value="item.providerChannelId" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重（万分比）"><el-input-number v-model="routeForm.weightBp" :min="0" :max="10000" controls-position="right" /></el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="routeForm.priorityNo" :min="0" controls-position="right" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="routeForm.enabled" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="routeDialog = false">取消</el-button><el-button type="primary" @click="saveRoute">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="allowlistDialog" title="IP 白名单规则" width="560px" append-to-body>
      <el-form :model="allowlistForm" label-width="110px">
        <el-form-item label="供应商"><el-select v-model="allowlistForm.providerId" style="width: 100%"><el-option v-for="item in providers" :key="item.providerId" :label="item.providerName" :value="item.providerId" /></el-select></el-form-item>
        <el-form-item label="商户账号">
          <el-select v-model="allowlistForm.merchantId" clearable placeholder="供应商全局规则" style="width: 100%">
            <el-option v-for="item in allowlistAccountOptions" :key="item.merchantId"
              :label="`${item.merchantCode} / ${item.merchantName}`" :value="item.merchantId" />
          </el-select>
        </el-form-item>
        <el-form-item label="场景"><el-select v-model="allowlistForm.scene" style="width: 100%"><el-option label="全部" value="ALL" /><el-option label="代收通知" value="DEPOSIT_CALLBACK" /><el-option label="代付通知" value="PAYOUT_CALLBACK" /><el-option label="代付反查" value="PAYOUT_REVERSE" /></el-select></el-form-item>
        <el-form-item label="IP / CIDR">
          <el-input v-model="allowlistForm.ipOrCidr" type="textarea" :rows="5"
            :placeholder="allowlistForm.allowlistId ? '编辑时仅支持单条规则' : '支持批量粘贴：每行一个 IP 或 CIDR'" />
          <div v-if="!allowlistForm.allowlistId" class="text-xs text-gray-400 mt-1">
            支持换行、逗号或空格分隔，最多 200 条；IPv4/IPv6 单 IP 与 CIDR 均可。
          </div>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="allowlistForm.description" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="allowlistForm.enabled" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="allowlistDialog = false">取消</el-button><el-button type="primary" @click="saveAllowlist">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="channelDialog" :title="channelForm.providerChannelId ? '编辑供应商通道' : '新增供应商通道'" width="680px" append-to-body>
      <el-form :model="channelForm" label-width="140px">
        <el-form-item label="供应商"><el-select v-model="channelForm.providerId" style="width: 100%"><el-option v-for="item in providers" :key="item.providerId" :label="item.providerName" :value="item.providerId" /></el-select></el-form-item>
        <el-form-item label="商户账号（可空）">
          <el-select v-model="channelForm.merchantId" clearable filterable style="width: 100%">
            <el-option
              v-for="item in accounts.filter(account => !channelForm.providerId || account.providerId === channelForm.providerId)"
              :key="item.merchantId"
              :label="`${item.merchantCode} / ${item.merchantName}`"
              :value="item.merchantId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="方向"><el-select v-model="channelForm.operation" style="width: 100%"><el-option label="代收" value="DEPOSIT" /><el-option label="代付" value="PAYOUT" /></el-select></el-form-item>
        <el-form-item label="通道编码"><el-input v-model="channelForm.providerChannelCode" /></el-form-item>
        <el-form-item label="支付类型"><el-input v-model="channelForm.providerPayType" /></el-form-item>
        <el-form-item label="银行编码"><el-input v-model="channelForm.bankCode" /></el-form-item>
        <el-form-item label="币种"><el-input v-model="channelForm.currency" /></el-form-item>
        <el-form-item label="金额单位"><el-select v-model="channelForm.amountUnit" style="width: 100%"><el-option label="VND" value="VND" /><el-option label="元" value="YUAN" /><el-option label="分" value="FEN" /></el-select></el-form-item>
        <el-form-item label="小数位"><el-input-number v-model="channelForm.amountScale" :min="0" :max="4" controls-position="right" /></el-form-item>
        <el-form-item label="最低金额"><el-input-number v-model="channelForm.amountMin" :min="0" controls-position="right" /></el-form-item>
        <el-form-item label="最高金额"><el-input-number v-model="channelForm.amountMax" :min="0" controls-position="right" /></el-form-item>
        <el-form-item label="扩展参数 JSON"><el-input v-model="channelForm.extraSchemaJson" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="channelForm.enabled" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="channelForm.remark" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="channelDialog = false">取消</el-button><el-button type="primary" @click="saveChannel">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="PaymentProviderCenter" lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import modal from '@/plugins/modal';
import {
  listPaymentIpAllowlists,
  listPaymentProviders,
  changePaymentProviderStatus,
  listPaymentRanking,
  listProviderAccounts,
  listProviderChannels,
  listRouteOptions,
  listRouteCandidates,
  changeProviderChannelStatus,
  deleteRouteCandidate,
  deletePaymentIpAllowlist,
  savePaymentIpAllowlist,
  savePaymentIpAllowlists,
  getWithdrawAuditPolicy,
  saveWithdrawAuditPolicy,
  saveProviderAccount,
  saveProviderChannel,
  saveRouteCandidate,
  deleteProviderAccount,
  testProviderAccount
} from '@/api/finance/payment-provider';
import type {
  IpAllowlistVO,
  PaymentProviderVO,
  PaymentRankingVO,
  ProviderAccountVO,
  ProviderChannelVO,
  RouteBusinessOptionVO,
  RouteCandidateVO
} from '@/api/finance/payment-provider';
import type { WithdrawAuditPolicyVO } from '@/api/finance/payment-provider';

const activeTab = ref('ranking');
const route = useRoute();
const loading = ref(false);
const providers = ref<PaymentProviderVO[]>([]);
const accounts = ref<ProviderAccountVO[]>([]);
const channels = ref<ProviderChannelVO[]>([]);
const candidates = ref<RouteCandidateVO[]>([]);
const allowlists = ref<IpAllowlistVO[]>([]);
const ranking = ref<PaymentRankingVO[]>([]);
const providerTogglingIds = ref<number[]>([]);
const routeOptions = ref<RouteBusinessOptionVO[]>([]);
const rankingOperation = ref('DEPOSIT');
const rankingWindow = ref('24H');
const channelProviderId = ref<number>();
const allowlistProviderId = ref<number>();
const routingScene = ref('DEPOSIT');
const routingRefId = ref<number>();
const accountDialog = ref(false);
const routeDialog = ref(false);
const allowlistDialog = ref(false);
const channelDialog = ref(false);
const accountForm = reactive<Partial<ProviderAccountVO>>({});
const routeForm = reactive<Partial<RouteCandidateVO>>({});
const allowlistForm = reactive<Partial<IpAllowlistVO>>({});
const channelForm = reactive<Partial<ProviderChannelVO>>({});
const policyUid = ref<number>();
const policy = ref<WithdrawAuditPolicyVO>();
const policyForm = reactive({ auditMode: 'EVERY_TIME', reason: '' });
const routeChannelOptions = computed(() =>
  channels.value.filter((item) => item.operation === routingScene.value)
);

const providerName = (id?: number) => providers.value.find((item) => item.providerId === id)?.providerName ?? '-';
const routeOptionLabel = (businessRefId?: number) => {
  const item = routeOptions.value.find((option) => option.businessRefId === businessRefId);
  return item
    ? `${item.groupName || ''} / ${item.routeName} (${item.routeCode})`
    : `业务路由 #${businessRefId ?? '-'}`;
};
const channelOptionLabel = (providerChannelId?: number) => {
  const item = channels.value.find((channel) => channel.providerChannelId === providerChannelId);
  return item
    ? `${providerName(item.providerId)} / ${item.operation} / ${item.providerChannelCode}`
    : `供应商通道 #${providerChannelId ?? '-'}`;
};
const percent = (value?: number) => `${Number(value ?? 0).toFixed(2)}%`;
const duration = (ms?: number) => (Number(ms ?? 0) < 1000 ? `${Math.round(Number(ms ?? 0))}ms` : `${(Number(ms ?? 0) / 1000).toFixed(2)}s`);
const secretPlaceholder = computed(() => accountForm.secretsVisible === false ? '无查看权限；留空保持原值' : '');
const allowlistAccountOptions = computed(() => accounts.value.filter(
  (item) => !allowlistForm.providerId || item.providerId === allowlistForm.providerId
));
const accountNumericFields: Array<keyof ProviderAccountVO> = [
  'providerId', 'requestTimeoutMs', 'status'
];

const loadProviders = async () => {
  const response = await listPaymentProviders();
  providers.value = response.data ?? [];
};

const loadRanking = async () => {
  loading.value = true;
  try {
    const response = await listPaymentRanking(rankingOperation.value, rankingWindow.value);
    ranking.value = response.data ?? [];
  } finally {
    loading.value = false;
  }
};

const loadAccounts = async () => {
  loading.value = true;
  try {
    const response = await listProviderAccounts();
    accounts.value = response.data ?? [];
  } finally {
    loading.value = false;
  }
};

const loadChannels = async () => {
  const response = await listProviderChannels({ providerId: channelProviderId.value });
  channels.value = response.data ?? [];
};

const loadCandidates = async () => {
  const response = await listRouteCandidates({ scene: routingScene.value, businessRefId: routingRefId.value });
  candidates.value = response.data ?? [];
};
const loadRouteOptions = async () => {
  const response = await listRouteOptions(routingScene.value);
  routeOptions.value = response.data ?? [];
  if (routingRefId.value && !routeOptions.value.some(
    (item) => item.businessRefId === routingRefId.value)) {
    routingRefId.value = undefined;
    candidates.value = [];
  }
};

const loadAllowlists = async () => {
  const response = await listPaymentIpAllowlists(allowlistProviderId.value);
  allowlists.value = response.data ?? [];
};

const openAccount = async (row?: ProviderAccountVO) => {
  Object.keys(accountForm).forEach((key) => delete (accountForm as Record<string, unknown>)[key]);
  const source: Partial<ProviderAccountVO> = row ? {
    merchantId: row.merchantId,
    providerId: row.providerId,
    providerCode: row.providerCode,
    merchantCode: row.merchantCode,
    merchantName: row.merchantName,
    platform: row.platform,
    currency: row.currency,
    status: row.status,
    depositApiUrl: row.depositApiUrl || row.apiUrl,
    payoutApiUrl: row.payoutApiUrl || row.orderUrl,
    callbackIp: row.callbackIp,
    requestTimeoutMs: row.requestTimeoutMs,
    apiSecret: row.apiSecret,
    privateKey: row.privateKey,
    publicKey: row.publicKey,
    depositNotifyUrl: row.depositNotifyUrl,
    payoutNotifyUrl: row.payoutNotifyUrl,
    secretsVisible: row.secretsVisible
  } : {
    providerCode: '',
    platform: 'go88',
    currency: 'VND',
    depositNotifyUrl: '',
    payoutNotifyUrl: '',
    requestTimeoutMs: 30000,
    status: 1
  };
  if (row && row.secretsVisible === false) {
    source.apiSecret = '';
    source.privateKey = '';
    source.publicKey = '';
  }
  accountNumericFields.forEach((key) => {
    const value = source[key];
    if (value !== null && value !== undefined && value !== '') {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        (source as Record<string, unknown>)[String(key)] = numeric;
      }
    }
  });
  Object.assign(accountForm, source);
  accountDialog.value = true;
};

const saveAccount = async () => {
  const providerCode = accountForm.providerCode?.trim();
  if (!providerCode || !accountForm.merchantCode?.trim() || !accountForm.merchantName?.trim()) {
    modal.msgWarning('请填写供应商编码、商户编码和商户名称');
    return;
  }
  const payload: Partial<ProviderAccountVO> = {
    merchantId: accountForm.merchantId,
    providerCode,
    providerName: providerCode,
    merchantCode: accountForm.merchantCode.trim(),
    merchantName: accountForm.merchantName.trim(),
    platform: accountForm.platform,
    currency: accountForm.currency,
    status: accountForm.status,
    depositApiUrl: accountForm.depositApiUrl,
    payoutApiUrl: accountForm.payoutApiUrl,
    callbackIp: accountForm.callbackIp,
    requestTimeoutMs: accountForm.requestTimeoutMs,
    apiSecret: accountForm.apiSecret,
    privateKey: accountForm.privateKey,
    publicKey: accountForm.publicKey,
    depositNotifyUrl: accountForm.depositNotifyUrl,
    payoutNotifyUrl: accountForm.payoutNotifyUrl
  };
  await saveProviderAccount(payload);
  modal.msgSuccess('保存成功');
  accountDialog.value = false;
  await Promise.all([loadAccounts(), loadProviders()]);
};

const removeAccount = async (row: ProviderAccountVO) => {
  await modal.confirm(
    `确认物理删除供应商账号「${row.providerName || row.providerCode} / ${row.merchantCode}」？`
  );
  await deleteProviderAccount(row.merchantId);
  modal.msgSuccess('供应商账号已删除，供应商主档保留');
  await loadAccounts();
};

const testAccount = async (row: ProviderAccountVO) => {
  const response = await testProviderAccount(row.merchantId);
  const result = response.data ?? {};
  if (result.status === 'FAILED') {
    modal.msgError(String(result.message || '测试失败'));
    return;
  }
  modal.msgSuccess(`${result.message || '测试通过'}${result.availableBankCount
    ? `，可用银行 ${result.availableBankCount} 个` : ''}`);
  loadAccounts();
};

const openChannel = (row?: ProviderChannelVO) => {
  Object.keys(channelForm).forEach((key) => delete (channelForm as Record<string, unknown>)[key]);
  Object.assign(channelForm, row ?? {
    providerId: channelProviderId.value ?? providers.value[0]?.providerId,
    operation: 'DEPOSIT',
    currency: 'VND',
    amountUnit: 'VND',
    amountScale: 0,
    amountMin: 0,
    amountMax: 0,
    extraSchemaJson: '{}',
    enabled: 0
  });
  channelDialog.value = true;
};

const saveChannel = async () => {
  await saveProviderChannel(channelForm);
  modal.msgSuccess('供应商通道已保存');
  channelDialog.value = false;
  loadChannels();
};
const toggleChannelStatus = async (row: ProviderChannelVO, status: number) => {
  await changeProviderChannelStatus(row.providerChannelId, status);
  modal.msgSuccess(status === 1 ? '供应通道已启用' : '供应通道已停用');
  await loadChannels();
};

const openRoute = (row?: RouteCandidateVO) => {
  Object.keys(routeForm).forEach((key) => delete (routeForm as Record<string, unknown>)[key]);
  Object.assign(routeForm, row ?? {
    scene: routingScene.value,
    businessRefId: routingRefId.value,
    platform: 'go88',
    currency: 'VND',
    weightBp: 5000,
    priorityNo: 0,
    enabled: 1
  });
  routeDialog.value = true;
};

const saveRoute = async () => {
  if (!routeForm.businessRefId || !routeForm.providerChannelId) {
    modal.msgWarning('请选择业务路由和供应商通道');
    return;
  }
  await saveRouteCandidate(routeForm);
  modal.msgSuccess('权重已保存');
  routeDialog.value = false;
  loadCandidates();
};
const removeRoute = async (row: RouteCandidateVO) => {
  await modal.confirm('确认删除该供应商候选？');
  await deleteRouteCandidate(row.candidateId);
  modal.msgSuccess('候选已删除');
  loadCandidates();
};

const openAllowlist = (row?: IpAllowlistVO) => {
  Object.keys(allowlistForm).forEach((key) => delete (allowlistForm as Record<string, unknown>)[key]);
  Object.assign(allowlistForm, row ?? { providerId: providers.value[0]?.providerId, scene: 'ALL', enabled: 1 });
  allowlistDialog.value = true;
};

const saveAllowlist = async () => {
  const values = String(allowlistForm.ipOrCidr || '')
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.length) {
    modal.msgWarning('请填写 IP 或 CIDR');
    return;
  }
  if (allowlistForm.allowlistId && values.length !== 1) {
    modal.msgWarning('编辑已有规则时只能填写一个 IP 或 CIDR');
    return;
  }
  if (values.length > 200) {
    modal.msgWarning('单次最多批量保存 200 条规则');
    return;
  }
  if (values.length === 1) {
    await savePaymentIpAllowlist({ ...allowlistForm, ipOrCidr: values[0] });
  } else {
    await savePaymentIpAllowlists(values.map((ipOrCidr) => ({ ...allowlistForm, ipOrCidr })));
  }
  modal.msgSuccess(`IP 白名单已保存（${values.length} 条）`);
  allowlistDialog.value = false;
  await Promise.all([loadAllowlists(), loadAccounts()]);
};

const removeAllowlist = async (row: IpAllowlistVO) => {
  await modal.confirm(`确认删除 IP 白名单「${row.ipOrCidr}」？`);
  await deletePaymentIpAllowlist(row.allowlistId);
  modal.msgSuccess('IP 白名单已删除');
  await Promise.all([loadAllowlists(), loadAccounts()]);
};

const loadPolicy = async () => {
  if (!policyUid.value) {
    modal.msgWarning('请输入会员 UID');
    return;
  }
  const response = await getWithdrawAuditPolicy(policyUid.value);
  policy.value = response.data;
  policyForm.auditMode = policy.value?.auditMode ?? 'EVERY_TIME';
  policyForm.reason = '';
};

const savePolicy = async () => {
  if (!policyUid.value || !policyForm.reason.trim()) {
    modal.msgWarning('请填写 UID 和变更原因');
    return;
  }
  const response = await saveWithdrawAuditPolicy({
    uid: policyUid.value,
    auditMode: policyForm.auditMode,
    reason: policyForm.reason.trim()
  });
  policy.value = response.data;
  policyForm.reason = '';
  modal.msgSuccess('审核策略已保存');
};

const toggleProvider = async (row: PaymentRankingVO, next: number) => {
  if (providerTogglingIds.value.includes(row.providerId)) return;
  const status = next === 1 ? 1 : 0;
  try {
    await modal.confirm(`确认${status === 1 ? '启用' : '停用'}供应商「${row.providerName}」？`);
  } catch {
    return;
  }
  providerTogglingIds.value = [...providerTogglingIds.value, row.providerId];
  try {
    await changePaymentProviderStatus(row.providerId, status);
    row.providerStatus = status;
    const provider = providers.value.find((item) => item.providerId === row.providerId);
    if (provider) provider.status = status;
    modal.msgSuccess(status === 1 ? '供应商总开关已启用' : '供应商总开关已停用');
    await Promise.all([loadRanking(), loadProviders()]);
  } finally {
    providerTogglingIds.value = providerTogglingIds.value.filter((id) => id !== row.providerId);
  }
};

watch(accountDialog, (open) => {
  if (!open) {
    Object.keys(accountForm).forEach((key) => delete (accountForm as Record<string, unknown>)[key]);
  }
});

watch(() => allowlistForm.providerId, () => {
  if (allowlistForm.merchantId
    && !allowlistAccountOptions.value.some((item) => item.merchantId === allowlistForm.merchantId)) {
    allowlistForm.merchantId = undefined;
  }
});

const openAccountFromRoute = async () => {
  if (String(route.query.tab || '') === 'accounts') {
    activeTab.value = 'accounts';
  }
  const action = String(route.query.action || '');
  if (action !== 'new' && action !== 'edit') return;
  const merchantId = Number(route.query.merchantId || 0);
  const account = merchantId > 0
    ? accounts.value.find((item) => Number(item.merchantId) === merchantId)
    : undefined;
  await openAccount(action === 'edit' ? account : undefined);
};

onMounted(async () => {
  await loadProviders();
  await Promise.all([loadRanking(), loadAccounts(), loadChannels(), loadRouteOptions(),
    loadAllowlists()]);
  await loadCandidates();
  await openAccountFromRoute();
});

watch(routingScene, async () => {
  routingRefId.value = undefined;
  candidates.value = [];
  await loadRouteOptions();
});
</script>

<style scoped>
.payment-provider-page :deep(.el-tabs__content) {
  overflow: visible;
}
.policy-form {
  max-width: 720px;
}
:deep(.account-dialog .el-dialog__body) {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}
</style>
