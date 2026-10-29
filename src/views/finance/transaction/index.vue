<template>
  <div class="p-2 app-container finance-transaction-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-if="showTabs" v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部交易" name="all" />
        <el-tab-pane label="充值订单" name="recharge" />
        <el-tab-pane label="提现订单" name="withdraw" />
        <el-tab-pane label="手工充值" name="manual" />
        <el-tab-pane label="交易所 OTC" name="exchange" />
        <el-tab-pane label="通知与回调" name="notification" />
      </el-tabs>

      <el-form v-if="activeTab !== 'notification'" :inline="true" class="query-form">
        <el-form-item label="UID">
          <el-input v-model="query.uid" placeholder="会员UID" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="用户名/昵称">
          <el-input
            v-model="query.keyword"
            placeholder="账号或昵称"
            clearable
            style="width: 160px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="平台订单号" clearable style="width: 190px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 160px">
            <el-option v-if="activeTab === 'withdraw'" label="待审核（默认）" value="AUDITING" />
            <el-option v-if="activeTab === 'withdraw'" label="待处理（审核+处理中）" value="PENDING_GROUP" />
            <el-option v-if="activeTab === 'withdraw'" label="全部状态" value="ALL" />
            <el-option
              v-for="item in selectableStatusOptions"
              :key="item"
              :label="statusLabel(item)"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTab === 'withdraw'" label="提现大类">
          <el-select
            v-model="query.withdrawTabCode"
            placeholder="全部"
            clearable
            style="width: 140px"
            @change="handleWithdrawTabChange"
          >
            <el-option
              v-for="item in withdrawTabs"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="渠道">
          <el-select v-model="query.channel" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in options.channels" :key="item" :label="channelLabel(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select
            v-if="activeTab === 'withdraw'"
            v-model="query.channel"
            placeholder="全部"
            clearable
            filterable
            style="width: 170px"
          >
            <el-option
              v-for="item in withdrawMethodOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select v-else v-model="query.methodType" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in options.methodTypes" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="商户">
          <el-select v-model="query.merchantId" placeholder="全部" clearable filterable style="width: 170px">
            <el-option
              v-for="item in options.merchants"
              :key="item.merchantId"
              :label="item.merchantName"
              :value="item.merchantId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通知状态">
          <el-select v-model="query.notifyStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="待处理" value="PENDING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="已忽略" value="IGNORED" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-form v-else :inline="true" class="query-form">
        <el-form-item label="来源">
          <el-select v-model="notificationQuery.sourceType" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="item in options.sourceTypes" :key="item" :label="sourceLabel(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="notificationQuery.orderNo" placeholder="订单号" clearable style="width: 190px" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="notificationQuery.handleStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="待处理" value="PENDING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="已忽略" value="IGNORED" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="notificationQuery.direction" placeholder="全部" clearable style="width: 170px">
            <el-option label="入站回调" value="INBOUND_CALLBACK" />
            <el-option label="出站三方" value="OUTBOUND_PROVIDER" />
            <el-option label="出站客户端" value="OUTBOUND_CLIENT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadNotifications">搜索</el-button>
          <el-button icon="Refresh" @click="resetNotificationQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="activeTab !== 'notification'" shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ tabTitle }}</h3>
            <p>统一口径：标准状态与原始状态并存；操作按钮由后端 availableActions 下发。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:transaction:export']" icon="Download" @click="handleExport">导出当前页</el-button>
            <el-button icon="Refresh" @click="loadTransactions">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows" @row-dblclick="openDetailRow">
        <el-table-column label="来源" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.sourceType)">{{ sourceLabel(row.sourceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单号" prop="orderNo" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row as FinanceTransactionVO)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'exchange'" label="发票号" prop="invoiceNo" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="activeTab === 'exchange'" label="OTC订单号" prop="externalOrderNo" min-width="170" show-overflow-tooltip />
        <el-table-column v-if="activeTab === 'exchange'" label="交易对手" prop="counterpartyName" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="activeTab === 'exchange'" label="交易类型" prop="transactionType" width="150" show-overflow-tooltip />
        <el-table-column label="会员" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link
              v-if="row.uid"
              type="primary"
              :underline="false"
              @click.stop="openMemberDetail(row.uid)"
            >
              {{ row.account || row.nickName || row.uid }}
            </el-link>
            <div v-else>-</div>
            <div class="text-gray-400 text-sm">{{ row.uid }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'withdraw'" label="会员标签 / 等级" min-width="210">
          <template #default="{ row }">
            <div class="member-level-line">
              <el-tag size="small" type="info" effect="plain">{{ row.memberLevelName || '默认层级' }}</el-tag>
              <span class="text-gray-400 text-sm">VIP {{ row.vipLevel ?? 0 }}</span>
            </div>
            <div v-if="memberTagItems(row as FinanceTransactionVO).length" class="member-tag-line">
              <el-tag
                v-for="tag in memberTagItems(row as FinanceTransactionVO)"
                :key="tag.name"
                size="small"
                effect="dark"
                :style="{ backgroundColor: tag.color, borderColor: tag.color }"
              >
                {{ tag.name }}
              </el-tag>
            </div>
            <span v-else class="text-gray-400">无标签</span>
          </template>
        </el-table-column>
        <el-table-column :label="targetColumnLabel" min-width="300">
          <template #default="{ row }">
            <div v-if="hasTargetInfo(row as FinanceTransactionVO)" class="withdraw-beneficiary-cell">
              <div class="target-platform-line">
                <el-tag size="small" effect="plain">{{ targetTypeLabel(row.targetType) }}</el-tag>
                <strong>{{ targetPlatformText(row as FinanceTransactionVO) }}</strong>
              </div>
              <div v-if="row.targetCode" class="target-code">{{ row.targetCode }}</div>
              <div v-if="row.targetAccountName" class="withdraw-beneficiary-user">
                户名：{{ row.targetAccountName }}
              </div>
              <div v-if="targetValue(row as FinanceTransactionVO)" class="withdraw-beneficiary-account">
                <code>{{ targetValue(row as FinanceTransactionVO) }}</code>
                <el-button
                  link
                  type="primary"
                  icon="CopyDocument"
                  @click.stop="copyTransactionText(targetValue(row as FinanceTransactionVO), '收款账号')"
                />
              </div>
            </div>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <template v-if="activeTab === 'withdraw'">
          <el-table-column label="会员累计提现" min-width="210">
            <template #default="{ row }">
              <div class="font-medium">
                {{ formatMoney(row.cumulativeWithdrawAmount) }} VND
                <span class="text-gray-400">/ {{ row.cumulativeWithdrawCount ?? 0 }} 次</span>
              </div>
              <div class="text-gray-400 text-sm">
                最后 {{ fmtTransactionTime(row.lastWithdrawAt) }}
              </div>
            </template>
          </el-table-column>
        </template>
        <el-table-column v-if="activeTab !== 'recharge' && activeTab !== 'withdraw'" label="方向" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.direction === 'IN' ? 'success' : 'warning'">
              {{ row.direction === 'IN' ? '入账' : '出款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="activeTab === 'recharge' ? '充值金额' : '金额'" align="right" width="170">
          <template #default="{ row }">
            <template v-if="activeTab === 'recharge'">
              <div>{{ formatRechargeAmount(row.amount, row.currency) }}</div>
              <div v-if="row.currency && row.currency !== 'VND'" class="text-gray-400 text-sm">
                折算 {{ formatMoney(row.vndAmount) }} VND
              </div>
            </template>
            <template v-else>
              <div>{{ formatMoney(row.amount) }} {{ row.currency || 'VND' }}</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'exchange'" label="资产/法币" align="right" width="180">
          <template #default="{ row }">
            <div>{{ formatMoney(row.assetAmount) }}</div>
            <div class="text-gray-400 text-sm">{{ formatMoney(row.fiatAmount) }}</div>
          </template>
        </el-table-column>
        <el-table-column
          :label="activeTab === 'withdraw' ? '实际到账/手续费' : activeTab === 'recharge' ? '到账金额' : '到账/赠送'"
          align="right"
          width="190"
        >
          <template #default="{ row }">
            <template v-if="activeTab === 'withdraw'">
              <div>{{ settlementCurrency(row as FinanceTransactionVO) }} {{ formatMoney(row.arriveAmount) }}</div>
              <div class="text-gray-400 text-sm">
                手续费 {{ settlementCurrency(row as FinanceTransactionVO) }} {{ formatMoney(row.feeAmount) }}
              </div>
            </template>
            <template v-else-if="activeTab === 'recharge'">
              <div class="font-medium">{{ formatPlatformAmount(row.arriveAmount) }}</div>
              <div class="text-gray-400 text-sm">平台币</div>
            </template>
            <template v-else>
              <div>{{ formatMoney(row.arriveAmount) }}</div>
              <div v-if="Number(row.bonusAmount) > 0" class="text-gray-400 text-sm">
                赠送 {{ formatMoney(row.bonusAmount) }}
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="渠道 / 方式" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.sourceType === 'WITHDRAW'">
              <div>{{ withdrawTabLabel(row.withdrawTabCode) }}</div>
              <div class="text-gray-400 text-sm">{{ withdrawMethodLabel(row.channel) }}</div>
            </template>
            <template v-else>
              <div>{{ channelLabel(row.channel) }}</div>
              <div class="text-gray-400 text-sm">{{ row.methodType || '-' }}</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="商户" prop="merchantName" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="160" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ activeTab === 'withdraw' ? withdrawStatusLabel(row.status) : statusLabel(row.status) }}
            </el-tag>
            <div v-if="row.failMsg" class="transaction-failure" :title="row.failMsg">
              {{ row.failMsg }}
            </div>
            <div v-if="activeTab !== 'withdraw' && activeTab !== 'recharge'" class="text-gray-400 text-sm">
              原值 {{ row.sourceStatus ?? '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="通知" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="notifyTagType(row.notifyStatus)">
              {{ notifyLabel(row.notifyStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="185">
          <template #default="{ row }">
            <div>{{ fmtTransactionTime(row.createdAt) }}</div>
            <div v-if="pendingAgeLabel(row as FinanceTransactionVO)" class="transaction-waiting">
              {{ pendingAgeLabel(row as FinanceTransactionVO) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="170">
          <template #default="{ row }">{{ fmtTransactionTime(row.finishedAt) }}</template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'withdraw'" label="客户端" min-width="190">
          <template #default="{ row }">
            <div
              v-if="row.clientOs || row.clientOsVersion || row.clientBrowser || row.clientBrowserVersion"
              class="text-gray-400 text-sm"
            >
              {{ clientSystemLabel(row as FinanceTransactionVO) }}
            </div>
            <div v-if="row.appVersion" class="text-gray-400 text-sm">APP {{ row.appVersion }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'withdraw'" label="提现 IP / 关联账号" min-width="210">
          <template #default="{ row }">
            <template v-if="row.clientIp">
              <a
                class="relation-link"
                :href="memberUsersByIpHref(row.clientIp)"
                @click.prevent.stop="navigateTo(memberUsersByIpHref(row.clientIp))"
              >
                {{ row.clientIp }}
              </a>
              <div class="link-count">
                同 IP 账号：
                <a
                  class="relation-link"
                  :href="memberUsersByIpHref(row.clientIp)"
                  @click.prevent.stop="navigateTo(memberUsersByIpHref(row.clientIp))"
                >
                  {{ row.sameIpAccountCount ?? 0 }}
                </a>
              </div>
            </template>
            <span v-else class="text-gray-400">未采集</span>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'withdraw'" label="设备 / 关联账号" min-width="245">
          <template #default="{ row }">
            <template v-if="row.deviceFingerprint">
              <a
                class="device-link"
                :href="memberUsersByDeviceHref(row.deviceFingerprint)"
                @click.prevent.stop="navigateTo(memberUsersByDeviceHref(row.deviceFingerprint))"
              >
                {{ row.deviceFingerprint }}
              </a>
              <div class="link-count">
                同设备账号：
                <a
                  class="relation-link"
                  :href="memberUsersByDeviceHref(row.deviceFingerprint)"
                  @click.prevent.stop="navigateTo(memberUsersByDeviceHref(row.deviceFingerprint))"
                >
                  {{ row.sameDeviceAccountCount ?? 0 }}
                </a>
              </div>
            </template>
            <span v-else class="text-gray-400">未采集</span>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'recharge'" label="客户端 / IP / 设备" min-width="240">
          <template #default="{ row }">
            <div>{{ row.clientIp || '-' }}</div>
            <div
              v-if="row.clientOs || row.clientOsVersion || row.clientBrowser || row.clientBrowserVersion"
              class="text-gray-400 text-sm"
            >
              {{ clientSystemLabel(row as FinanceTransactionVO) }}
            </div>
            <div v-if="row.deviceFingerprint" class="text-gray-400 text-sm">
              x-fg-id {{ row.deviceFingerprint }}
            </div>
            <div v-if="row.appVersion" class="text-gray-400 text-sm">APP {{ row.appVersion }}</div>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          :width="activeTab === 'withdraw' ? 310 : activeTab === 'recharge' ? 176 : 220"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div v-if="activeTab === 'recharge'" class="recharge-actions">
              <el-button link type="primary" @click="openDetail(row as FinanceTransactionVO)">详情</el-button>
              <el-button
                v-if="hasAction(row as FinanceTransactionVO, 'REMARK')"
                v-hasPermi="['finance:transaction:edit']"
                link
                type="primary"
                @click="handleAction(row as FinanceTransactionVO, 'REMARK')"
              >
                备注
              </el-button>
              <el-button
                v-if="hasAction(row as FinanceTransactionVO, 'RETRY_NOTIFY')"
                v-hasPermi="['finance:transaction:edit']"
                link
                type="warning"
                @click="handleAction(row as FinanceTransactionVO, 'RETRY_NOTIFY')"
              >
                重试通知
              </el-button>
              <el-button
                v-if="hasAction(row as FinanceTransactionVO, 'CREDIT')"
                v-hasPermi="['finance:transaction:edit']"
                link
                type="success"
                @click="handleAction(row as FinanceTransactionVO, 'CREDIT')"
              >
                入账
              </el-button>
            </div>
            <template v-else>
              <el-button link type="primary" @click="openDetail(row as FinanceTransactionVO)">详情</el-button>
              <template v-if="activeTab === 'withdraw'">
                <span v-hasPermi="['finance:transaction:edit']" class="withdraw-actions">
                  <el-button v-if="hasAction(row as FinanceTransactionVO, 'REMARK')" link type="primary" @click="handleAction(row as FinanceTransactionVO, 'REMARK')">备注</el-button>
                  <el-button v-if="hasAction(row as FinanceTransactionVO, 'REJECT')" link type="danger" @click="handleAction(row as FinanceTransactionVO, 'REJECT')">驳回</el-button>
                  <el-button v-if="hasAction(row as FinanceTransactionVO, 'AUDIT')" link type="success" @click="handleAction(row as FinanceTransactionVO, 'AUDIT')">审核</el-button>
                  <el-button v-if="hasAction(row as FinanceTransactionVO, 'PAY')" link type="warning" @click="handleAction(row as FinanceTransactionVO, 'PAY')">转账</el-button>
                  <el-button v-if="hasAction(row as FinanceTransactionVO, 'RETRY')" link type="warning" @click="handleAction(row as FinanceTransactionVO, 'RETRY')">重试</el-button>
                </span>
              </template>
              <el-dropdown
                v-else
                v-hasPermi="['finance:transaction:edit']"
                trigger="click"
                @command="(action: string) => handleAction(row as FinanceTransactionVO, action)"
              >
                <el-button link type="primary">操作<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="action in row.availableActions || []"
                      :key="action"
                      :command="action"
                    >
                      {{ actionLabel(action) }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="loadTransactions"
      />
    </el-card>

    <el-card v-else shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>通知与回调</h3>
            <p>统一展示入站回调、出站三方和出站客户端通知；重试与忽略均留痕。</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="loadNotifications">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="notificationLoading" border :data="notifications">
        <el-table-column label="来源" width="120" align="center">
          <template #default="{ row }">{{ sourceLabel(row.sourceType) }}</template>
        </el-table-column>
        <el-table-column label="订单号" prop="orderNo" min-width="180" show-overflow-tooltip />
        <el-table-column label="方向" width="150" align="center">
          <template #default="{ row }">{{ directionLabel(row.direction) }}</template>
        </el-table-column>
        <el-table-column label="事件" prop="eventType" min-width="160" show-overflow-tooltip />
        <el-table-column label="签名" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.signOk === 1 ? 'success' : 'danger'">{{ row.signOk === 1 ? '通过' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.resultCode || '-' }} {{ row.resultMsg || '' }}</div>
            <div class="text-gray-400 text-sm">HTTP {{ row.httpStatus ?? '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="处理状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="notifyTagType(row.handleStatus)">{{ notifyLabel(row.handleStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="重试" prop="retryCount" width="80" align="center" />
        <el-table-column label="下次重试" prop="nextRetryAt" width="170" />
        <el-table-column label="接收时间" prop="receivedAt" width="170" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-hasPermi="['finance:transaction:notify']" link type="primary" @click="handleNotification(row as FinanceNotificationVO, 'retry')">重试</el-button>
            <el-button v-hasPermi="['finance:transaction:notify']" link type="warning" @click="handleNotification(row as FinanceNotificationVO, 'replay')">重放</el-button>
            <el-button v-hasPermi="['finance:transaction:notify']" link type="danger" @click="handleNotification(row as FinanceNotificationVO, 'ignore')">忽略</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-model:page="notificationQuery.pageNum"
        v-model:limit="notificationQuery.pageSize"
        :total="notificationTotal"
        @pagination="loadNotifications"
      />
    </el-card>

    <el-drawer
      v-model="detailVisible"
      :title="detailDrawerTitle"
      size="min(980px, 94vw)"
      destroy-on-close
      class="finance-detail-drawer"
    >
      <div v-if="detail" class="tx-detail">
        <section class="tx-hero" :class="`tx-hero--${detailStatusTone}`">
          <div class="tx-hero__main">
            <div class="tx-hero__identity">
              <div class="tx-hero__eyebrow">
                <el-tag :type="sourceTagType(detail.transaction.sourceType)" effect="plain">
                  {{ sourceLabel(detail.transaction.sourceType) }}
                </el-tag>
                <span>{{ detail.transaction.direction === 'IN' ? '资金入账' : '资金出款' }}</span>
              </div>
              <h2>{{ detailOutcomeTitle }}</h2>
              <p>{{ detailOutcomeDescription }}</p>
              <div class="tx-order-no">
                <span>订单号</span>
                <code>{{ detail.transaction.orderNo }}</code>
                <el-button
                  link
                  type="primary"
                  icon="CopyDocument"
                  @click="copyTransactionText(detail.transaction.orderNo, '订单号')"
                />
              </div>
            </div>
            <div class="tx-hero__amount">
              <span>{{ detailArrivalLabel }}</span>
              <strong>{{ platformCreditDisplay }}</strong>
              <small>{{ detail.transaction.currency || 'VND' }} 账户 · {{ fmtTransactionTime(detail.transaction.finishedAt || detail.transaction.updatedAt) }}</small>
            </div>
          </div>
          <div class="tx-hero__status">
            <el-tag :type="statusTagType(detail.transaction.status)" effect="dark" size="large">
              {{ detailStatusText }}
            </el-tag>
            <span>原始状态 {{ detail.transaction.sourceStatus || '-' }}</span>
            <el-button
              v-if="detail.transaction.uid"
              link
              type="primary"
              @click="openMemberDetail(detail.transaction.uid)"
            >
              查看会员
            </el-button>
          </div>
        </section>

        <el-alert
          v-if="detailActionAlert"
          :type="detailActionAlert.type"
          :title="detailActionAlert.title"
          :description="detailActionAlert.description"
          :closable="false"
          show-icon
          class="tx-action-alert"
        />

        <section class="tx-kpi-grid" aria-label="充值金额概览">
          <article class="tx-kpi">
            <span>{{ detailAmountLabel }}</span>
            <strong>{{ transactionAmountDisplay }}</strong>
            <small>用户实际支付面额</small>
          </article>
          <article class="tx-kpi">
            <span>VND 折算</span>
            <strong>{{ vndAmountDisplay }}</strong>
            <small>汇率 {{ detail.transaction.conversionRate ?? '-' }}</small>
          </article>
          <article class="tx-kpi">
            <span>手续费</span>
            <strong>{{ formatMoney(detail.transaction.feeAmount) || '0.00' }}</strong>
            <small>{{ settlementCurrency(detail.transaction) }}</small>
          </article>
          <article class="tx-kpi">
            <span>赠送金额</span>
            <strong>{{ formatMoney(detail.transaction.bonusAmount) || '0.00' }}</strong>
            <small>{{ detail.transaction.currency || 'VND' }}</small>
          </article>
        </section>

        <div class="tx-card-grid">
          <section class="tx-info-card">
            <div class="tx-info-card__header">
              <h3>{{ isRechargeDetail ? '支付路径' : '交易路径' }}</h3>
              <span>资金从哪来、经哪条通道</span>
            </div>
            <div class="tx-field-list">
              <div class="tx-field">
                <span>充值渠道</span>
                <strong>{{ channelLabel(detail.transaction.channel) }}</strong>
              </div>
              <div class="tx-field">
                <span>支付方式</span>
                <strong>{{ detail.transaction.methodType || '-' }}</strong>
              </div>
              <div class="tx-field">
                <span>路由 ID</span>
                <div class="tx-inline-value">
                  <code>{{ detail.transaction.routeId ?? '-' }}</code>
                  <el-button
                    v-if="detail.transaction.routeId != null"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(String(detail.transaction.routeId), '路由ID')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>商户</span>
                <strong>{{ detail.transaction.merchantName || '-' }}</strong>
              </div>
              <div class="tx-field">
                <span>服务商</span>
                <strong>{{ detail.transaction.providerCode || '-' }}</strong>
              </div>
              <div class="tx-field">
                <span>上游订单号</span>
                <div class="tx-inline-value">
                  <code>{{ detail.transaction.providerOrderNo || '-' }}</code>
                  <el-button
                    v-if="detail.transaction.providerOrderNo"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.providerOrderNo, '上游订单号')"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="tx-info-card">
            <div class="tx-info-card__header">
              <h3>订单核验</h3>
              <span>成功、失败或处理中都先核对这里</span>
            </div>
            <div class="tx-field-list">
              <div class="tx-field">
                <span>平台订单号</span>
                <div class="tx-inline-value">
                  <code>{{ detail.transaction.orderNo }}</code>
                  <el-button
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.orderNo, '订单号')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>请求号</span>
                <div class="tx-inline-value">
                  <code>{{ detail.transaction.requestId || '-' }}</code>
                  <el-button
                    v-if="detail.transaction.requestId"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.requestId, '请求号')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>发起时间</span>
                <strong>{{ fmtTransactionTime(detail.transaction.requestAt) }}</strong>
              </div>
              <div class="tx-field">
                <span>创建时间</span>
                <strong>{{ fmtTransactionTime(detail.transaction.createdAt) }}</strong>
              </div>
              <div class="tx-field">
                <span>完成时间</span>
                <strong>{{ fmtTransactionTime(detail.transaction.finishedAt) }}</strong>
              </div>
              <div class="tx-field">
                <span>最后更新</span>
                <strong>{{ fmtTransactionTime(detail.transaction.updatedAt) }}</strong>
              </div>
              <div v-if="detail.transaction.failCode" class="tx-field tx-field--danger">
                <span>失败类型</span>
                <strong>{{ detail.transaction.failCode }}</strong>
              </div>
            </div>
          </section>

          <section class="tx-info-card">
            <div class="tx-info-card__header">
              <h3>会员与资金去向</h3>
              <span>确认是谁的订单、钱记到了哪里</span>
            </div>
            <div class="tx-field-list">
              <div class="tx-field">
                <span>会员账号</span>
                <strong>{{ detail.transaction.account || detail.transaction.nickName || '-' }}</strong>
              </div>
              <div class="tx-field">
                <span>会员 UID</span>
                <div class="tx-inline-value">
                  <code>{{ detail.transaction.uid || '-' }}</code>
                  <el-button
                    v-if="detail.transaction.uid"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.uid, '会员UID')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>VIP 等级</span>
                <strong>VIP{{ detail.transaction.vipLevel ?? 0 }}</strong>
              </div>
              <div class="tx-field">
                <span>收款类型</span>
                <strong>{{ targetTypeLabel(detail.transaction.targetType) }}</strong>
              </div>
              <div class="tx-field">
                <span>收款平台</span>
                <strong>{{ targetPlatformText(detail.transaction) }}</strong>
              </div>
              <div v-if="detail.transaction.targetCode" class="tx-field">
                <span>收款编码</span>
                <strong>{{ detail.transaction.targetCode }}</strong>
              </div>
              <div class="tx-field">
                <span>收款账号/地址</span>
                <div class="tx-inline-value">
                  <code>{{ targetValue(detail.transaction) || detail.transaction.beneficiaryMask || detail.transaction.payerMask || '-' }}</code>
                  <el-button
                    v-if="targetValue(detail.transaction) || detail.transaction.beneficiaryNo"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(targetValue(detail.transaction) || detail.transaction.beneficiaryNo, '收款账号')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>收款户名</span>
                <strong>{{ detail.transaction.targetAccountName || detail.transaction.beneficiaryName || '-' }}</strong>
              </div>
              <div v-if="detail.transaction.voucherUrl" class="tx-field">
                <span>支付凭证</span>
                <el-link v-if="safeVoucherUrl" :href="safeVoucherUrl" target="_blank" type="primary">查看凭证</el-link>
                <strong v-else>{{ detail.transaction.voucherUrl }}</strong>
              </div>
              <div class="tx-field">
                <span>备注</span>
                <strong class="tx-field__multiline">{{ detail.transaction.remark || '-' }}</strong>
              </div>
            </div>
          </section>

          <section class="tx-info-card">
            <div class="tx-info-card__header">
              <h3>来源环境</h3>
              <span>用于风控与设备关联排查</span>
            </div>
            <div class="tx-field-list">
              <div class="tx-field">
                <span>提交 IP</span>
                <div class="tx-inline-value">
                  <span>{{ detail.transaction.clientIp || '-' }}</span>
                  <el-tag v-if="isLoopbackIp(detail.transaction.clientIp)" type="warning" size="small" effect="plain">
                    本地/代理
                  </el-tag>
                  <el-button
                    v-if="detail.transaction.clientIp"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.clientIp, 'IP')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>操作系统</span>
                <strong>{{ osLabel(detail.transaction) }}</strong>
              </div>
              <div class="tx-field">
                <span>浏览器</span>
                <strong>{{ browserLabel(detail.transaction) }}</strong>
              </div>
              <div class="tx-field">
                <span>设备指纹</span>
                <div class="tx-inline-value">
                  <code class="tx-device-fingerprint">{{ detail.transaction.deviceFingerprint || '-' }}</code>
                  <el-button
                    v-if="detail.transaction.deviceFingerprint"
                    link
                    type="primary"
                    icon="CopyDocument"
                    @click="copyTransactionText(detail.transaction.deviceFingerprint, '设备指纹')"
                  />
                </div>
              </div>
              <div class="tx-field">
                <span>APP 版本</span>
                <strong>{{ detail.transaction.appVersion || '-' }}</strong>
              </div>
              <div class="tx-field">
                <span>通知状态</span>
                <el-tag :type="notifyTagType(detail.transaction.notifyStatus)" size="small">
                  {{ notifyLabel(detail.transaction.notifyStatus) }}
                </el-tag>
              </div>
            </div>
          </section>
        </div>

        <section class="tx-timeline-card">
          <div class="tx-info-card__header">
            <h3>订单处理时间线</h3>
            <span>{{ detail.events?.length || 0 }} 个状态事件</span>
          </div>
          <el-timeline v-if="detail.events?.length" class="tx-timeline">
            <el-timeline-item
              v-for="event in detail.events"
              :key="String(event.eventId)"
              :timestamp="fmtTransactionTime(event.createdAt)"
              :type="eventTimelineType(event.toStatus)"
              placement="top"
            >
              <div class="tx-event-title">
                <strong>{{ eventTypeLabel(event.eventType) }}</strong>
                <el-tag size="small" :type="eventTimelineType(event.toStatus)" effect="plain">
                  {{ eventTransitionLabel(event) }}
                </el-tag>
              </div>
              <div class="tx-event-meta">操作人：{{ event.operatorId || 'system' }}</div>
              <div v-if="event.remark" class="tx-event-remark">{{ event.remark }}</div>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="tx-empty-inline">暂无状态事件</div>
        </section>

        <section class="tx-notification-card">
          <div class="tx-info-card__header">
            <div>
              <h3>通知与回调</h3>
              <span>{{ detailNotifySummary }}</span>
            </div>
            <el-tag v-if="detail.transaction.notifyStatus" :type="notifyTagType(detail.transaction.notifyStatus)">
              {{ notifyLabel(detail.transaction.notifyStatus) }}
            </el-tag>
          </div>
          <el-table v-if="detail.notifications?.length" :data="detail.notifications" size="small" border>
            <el-table-column label="方向" width="130">
              <template #default="{ row }">{{ directionLabel(row.direction) }}</template>
            </el-table-column>
            <el-table-column label="事件" prop="eventType" min-width="135" show-overflow-tooltip />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="notifyTagType(row.handleStatus)">{{ notifyLabel(row.handleStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结果" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.resultCode || '-' }} {{ row.resultMsg || '' }}</div>
                <div class="text-gray-400 text-sm">HTTP {{ row.httpStatus ?? '-' }} · 签名 {{ row.signOk === 1 ? '通过' : '失败' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="重试" width="70" align="center">
              <template #default="{ row }">{{ row.retryCount ?? 0 }}</template>
            </el-table-column>
            <el-table-column label="接收时间" prop="receivedAt" width="170" />
          </el-table>
          <div v-else class="tx-empty-inline">
            <strong>暂无通知或回调记录</strong>
            <span>后续回调产生后会显示在这里</span>
          </div>
        </section>

        <el-collapse v-model="detailRequestPanels" class="tx-request-collapse">
          <el-collapse-item title="原始请求快照（排障用）" name="request">
            <template #title>
              <div class="tx-request-title">
                <span>原始请求快照</span>
                <small>接口调试、三方对单时展开</small>
              </div>
            </template>
            <div class="tx-request-actions">
              <el-button size="small" icon="CopyDocument" @click="copyTransactionText(prettyJson(detail.request), '请求快照')">
                复制快照
              </el-button>
            </div>
            <pre class="request-preview">{{ prettyJson(detail.request) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-drawer>

    <el-dialog
      v-model="creditDialogVisible"
      title="充值订单入账"
      width="440px"
      destroy-on-close
      @closed="resetCreditDialog"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="入账后将按订单已冻结的到账金额增加会员钱包余额，且不可撤销。"
        class="mb-4"
      />
      <el-descriptions :column="1" border size="small" class="mb-4">
        <el-descriptions-item label="订单号">{{ creditOrder?.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="充值金额">
          {{ formatRechargeAmount(creditOrder?.amount, creditOrder?.currency) }}
        </el-descriptions-item>
        <el-descriptions-item label="到账金额">
          {{ formatPlatformAmount(creditOrder?.arriveAmount) }} 平台币
        </el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="当前后台登录密码" required>
          <el-input
            v-model="creditPassword"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入当前登录账号密码"
            @keyup.enter="submitCredit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="creditSubmitting" @click="creditDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="creditSubmitting" @click="submitCredit">确认入账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceTransactionCenter" lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import { formatMoney } from '@/utils/money';
import {
  financeTransactionAction,
  getFinanceTransactionDetail,
  getFinanceTransactionOptions,
  ignoreFinanceNotification,
  listFinanceNotifications,
  listFinanceTransactions,
  replayFinanceNotification,
  retryFinanceNotification
} from '@/api/finance/transaction';
import type {
  FinanceOrderEvent,
  FinanceNotificationQuery,
  FinanceNotificationVO,
  FinanceTransactionDetail,
  FinanceTransactionOptions,
  FinanceTransactionQuery,
  FinanceTransactionVO
} from '@/api/finance/transaction';

type FinanceTransactionTab = 'all' | 'recharge' | 'withdraw' | 'manual' | 'exchange' | 'notification';

const formatLocalDateTime = (value: Date) => {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} `
    + `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
};

function rechargeTodayRange(): [string, string] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [formatLocalDateTime(start), formatLocalDateTime(end)];
}

const props = withDefaults(
  defineProps<{
    initialTab?: FinanceTransactionTab;
    showTabs?: boolean;
  }>(),
  {
    showTabs: false
  }
);

const resolveTab = (value?: string): FinanceTransactionTab => {
  return ['all', 'recharge', 'withdraw', 'manual', 'exchange', 'notification'].includes(String(value))
    ? (value as FinanceTransactionTab)
    : 'all';
};

const route = useRoute();
const router = useRouter();

const memberTagItems = (row: FinanceTransactionVO) => {
  const names = String(row.memberTagNames || '').split(',').filter(Boolean);
  const colors = String(row.memberTagColor || '').split(',');
  return names.map((name, index) => ({ name, color: colors[index] || '#909399' }));
};

const memberUsersByIpHref = (ip?: string) =>
  router.resolve({ path: '/member/users', query: { loginIp: ip } }).href;
const memberUsersByDeviceHref = (device?: string) =>
  router.resolve({ path: '/member/users', query: { deviceFingerprint: device } }).href;
const navigateTo = (href: string) => window.location.assign(href);

const activeTab = ref<FinanceTransactionTab>(resolveTab(props.initialTab || String(route.query.tab || 'all')));
const loading = ref(false);
const notificationLoading = ref(false);
const rows = ref<FinanceTransactionVO[]>([]);
const total = ref(0);
const notifications = ref<FinanceNotificationVO[]>([]);
const notificationTotal = ref(0);
const detailVisible = ref(false);
const detail = ref<FinanceTransactionDetail>();
const detailRequestPanels = ref<string[]>([]);
const creditDialogVisible = ref(false);
const creditSubmitting = ref(false);
const creditOrder = ref<FinanceTransactionVO>();
const creditPassword = ref('');
const usesTodayRange = (tab: FinanceTransactionTab) => tab === 'recharge' || tab === 'withdraw';
const dateRange = ref<[string, string]>(
  usesTodayRange(activeTab.value) ? rechargeTodayRange() : undefined
);
const options = reactive<FinanceTransactionOptions>({
  sourceTypes: [],
  channels: [],
  methodTypes: [],
  currencies: [],
  withdrawTabs: [],
  withdrawMethodsByTab: {},
  merchants: [],
  statuses: []
});

const query = reactive<FinanceTransactionQuery>({
  pageNum: 1,
  pageSize: 20,
  sourceTypes: undefined,
  status: activeTab.value === 'withdraw' ? 'AUDITING' : undefined,
  statuses: undefined,
  channel: undefined,
  withdrawTabCode: undefined,
  methodType: undefined,
  merchantId: undefined,
  notifyStatus: undefined
});

const notificationQuery = reactive<FinanceNotificationQuery>({
  pageNum: 1,
  pageSize: 20,
  sourceType: undefined,
  orderNo: undefined,
  handleStatus: undefined,
  direction: undefined
});

const statusOptions = computed(() => options.statuses.length ? options.statuses : [
  'PENDING', 'AUDITING', 'PROCESSING', 'SUCCESS', 'REJECTED', 'CANCELLED', 'FAILED', 'UNKNOWN'
]);
const selectableStatusOptions = computed(() =>
  activeTab.value === 'withdraw'
    ? statusOptions.value.filter((status) => status !== 'AUDITING')
    : statusOptions.value
);
const fallbackWithdrawTabs = [
  { value: 'BANK', label: '银行' },
  { value: 'CRYPTO', label: '虚拟币' },
  { value: 'P2P', label: 'P2P' },
  { value: 'CARD', label: '卡' },
  { value: 'COIN12', label: 'Coin12' }
];
const withdrawTabs = computed(() => options.withdrawTabs.length ? options.withdrawTabs : fallbackWithdrawTabs);
const withdrawMethodOptions = computed(() => {
  if (query.withdrawTabCode) {
    return options.withdrawMethodsByTab[query.withdrawTabCode] || [];
  }
  return withdrawTabs.value.flatMap((tab) => options.withdrawMethodsByTab[tab.value] || []);
});

const isRechargeDetail = computed(() =>
  ['ONLINE_DEPOSIT', 'TRANSFER_DEPOSIT', 'CS_DEPOSIT'].includes(detail.value?.transaction.sourceType || '')
);
const detailDrawerTitle = computed(() => isRechargeDetail.value ? '充值订单详情' : '交易详情');
const detailStatusText = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction) return '-';
  return transaction.sourceType === 'WITHDRAW'
    ? withdrawStatusLabel(transaction.status)
    : statusLabel(transaction.status);
});
const detailStatusTone = computed(() => {
  const status = detail.value?.transaction.status;
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED' || status === 'REJECTED') return 'danger';
  if (status === 'PENDING' || status === 'AUDITING' || status === 'PROCESSING') return 'warning';
  return 'info';
});
const detailAmountLabel = computed(() => {
  const sourceType = detail.value?.transaction.sourceType;
  if (sourceType === 'WITHDRAW') return '申请金额';
  if (sourceType === 'EXCHANGE_OTC') return '法币金额';
  if (sourceType === 'TRANSFER_DEPOSIT' || sourceType === 'CS_DEPOSIT') return '充值金额';
  return '支付金额';
});
const detailArrivalLabel = computed(() => {
  if (isRechargeDetail.value) return '到账平台币';
  if (detail.value?.transaction.sourceType === 'WITHDRAW') return '实际出款';
  return '到账金额';
});
const transactionAmountDisplay = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction || transaction.amount == null) return '-';
  return `${formatMoney(transaction.amount)} ${transaction.currency || 'VND'}`;
});
const vndAmountDisplay = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction || transaction.vndAmount == null) return '-';
  return `${formatMoney(transaction.vndAmount)} VND`;
});
const platformCreditDisplay = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction || transaction.arriveAmount == null) return '-';
  return isRechargeDetail.value
    ? `${formatMoney(transaction.arriveAmount)} 平台币`
    : `${settlementCurrency(transaction)} ${formatMoney(transaction.arriveAmount)}`;
});
const detailOutcomeTitle = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction) return '';
  if (transaction.status === 'SUCCESS') return isRechargeDetail.value ? '充值已完成并入账' : '交易已完成';
  if (transaction.status === 'FAILED') return '订单处理失败';
  if (transaction.status === 'REJECTED') return '订单已驳回';
  if (transaction.status === 'CANCELLED') return '订单已取消';
  if (transaction.status === 'PROCESSING') return '订单处理中';
  return '订单待处理';
});
const detailOutcomeDescription = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction) return '';
  if (transaction.status === 'SUCCESS') {
    const finished = transaction.finishedAt ? `，完成于 ${fmtTransactionTime(transaction.finishedAt)}` : '';
    return `${platformCreditDisplay.value} 已入账${finished}`;
  }
  if (transaction.status === 'FAILED' || transaction.status === 'REJECTED') {
    return transaction.failCode
      ? `失败类型：${transaction.failCode}，请结合处理事件和通知结果排查`
      : '请结合处理事件和通知结果排查';
  }
  return `当前状态：${detailStatusText.value}，请关注后续状态变化`;
});
const detailActionAlert = computed(() => {
  const transaction = detail.value?.transaction;
  if (!transaction) return null;
  if (transaction.status === 'SUCCESS' && Number(transaction.arriveAmount ?? 0) <= 0) {
    return {
      type: 'error' as const,
      title: '订单成功，但到账金额为 0',
      description: `订单 ${transaction.orderNo} 状态为成功，但到账金额异常；请核对入账流水与钱包余额。`
    };
  }
  if (transaction.status === 'SUCCESS' && transaction.notifyStatus === 'FAILED') {
    return {
      type: 'error' as const,
      title: '资金已入账，但通知处理失败',
      description: '请查看通知与回调明细，必要时由具备权限的财务人员执行重试。'
    };
  }
  if (transaction.status === 'SUCCESS' && transaction.notifyStatus === 'PENDING') {
    return {
      type: 'warning' as const,
      title: '资金已入账，但通知仍待处理',
      description: '订单资金已经到账，三方通知尚未完成；请在“通知与回调”中确认后续处理结果。'
    };
  }
  return null;
});
const detailNotifySummary = computed(() => {
  const list = detail.value?.notifications ?? [];
  if (!list.length) return '当前订单暂无通知或回调记录';
  const latest = list[list.length - 1];
  return `共 ${list.length} 条，最近一次 ${fmtTransactionTime(latest.receivedAt)}`;
});
const safeVoucherUrl = computed(() => {
  const value = detail.value?.transaction.voucherUrl;
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
});

const tabTitle = computed(() => ({
  all: '全部交易',
  recharge: '充值订单',
  withdraw: '提现订单',
  manual: '手工充值',
  exchange: '交易所 OTC'
}[activeTab.value] || '全部交易'));
const targetColumnLabel = computed(() => {
  if (activeTab.value === 'recharge') return '平台收款信息';
  if (activeTab.value === 'withdraw') return '会员提现收款信息';
  return '收款信息';
});

const tabSourceTypes = (): string[] | undefined => {
  if (activeTab.value === 'recharge') return ['ONLINE_DEPOSIT', 'TRANSFER_DEPOSIT', 'CS_DEPOSIT'];
  if (activeTab.value === 'withdraw') return ['WITHDRAW'];
  if (activeTab.value === 'manual') return ['TRANSFER_DEPOSIT', 'CS_DEPOSIT'];
  if (activeTab.value === 'exchange') return ['EXCHANGE_OTC'];
  return undefined;
};

const applyRange = () => {
  query.params = dateRange.value
    ? { beginTime: dateRange.value[0], endTime: dateRange.value[1] }
    : undefined;
};

const loadOptions = async () => {
  const res = await getFinanceTransactionOptions();
  const data = (res as unknown as { data?: FinanceTransactionOptions }).data;
  if (data) Object.assign(options, data);
};

const loadTransactions = async () => {
  loading.value = true;
  try {
    applyRange();
    query.sourceTypes = tabSourceTypes() as FinanceTransactionQuery['sourceTypes'];
    const requestQuery: FinanceTransactionQuery = { ...query };
    if (activeTab.value === 'withdraw') {
      if (query.status === 'PENDING_GROUP') {
        requestQuery.status = undefined;
        requestQuery.statuses = ['AUDITING', 'PROCESSING'];
      } else if (query.status === 'ALL') {
        requestQuery.status = undefined;
        requestQuery.statuses = undefined;
      } else {
        requestQuery.statuses = undefined;
      }
    } else {
      requestQuery.statuses = undefined;
    }
    const res = await listFinanceTransactions(requestQuery);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const loadNotifications = async () => {
  notificationLoading.value = true;
  try {
    const res = await listFinanceNotifications(notificationQuery);
    notifications.value = res.data?.rows ?? [];
    notificationTotal.value = res.data?.total ?? 0;
  } finally {
    notificationLoading.value = false;
  }
};

const handleTabChange = () => {
  query.pageNum = 1;
  query.sourceType = undefined;
  if (activeTab.value === 'notification') {
    loadNotifications();
    return;
  }
  if (usesTodayRange(activeTab.value) && !dateRange.value) {
    dateRange.value = rechargeTodayRange();
  } else if (!usesTodayRange(activeTab.value)) {
    dateRange.value = undefined;
  }
  query.statuses = undefined;
  if (activeTab.value === 'withdraw') {
    query.status = 'AUDITING';
    if (!dateRange.value) dateRange.value = rechargeTodayRange();
  } else if (query.status === 'PENDING_GROUP' || query.status === 'ALL' || query.status === 'AUDITING') {
    query.status = undefined;
  }
  query.withdrawTabCode = undefined;
  query.channel = undefined;
  loadTransactions();
};

watch(
  () => props.initialTab,
  (tab) => {
    if (!tab) return;
    activeTab.value = resolveTab(tab);
    handleTabChange();
  }
);

watch(
  () => route.query.tab,
  (tab) => {
    if (props.initialTab) return;
    activeTab.value = resolveTab(String(tab || 'all'));
    handleTabChange();
  }
);

const handleQuery = () => {
  query.pageNum = 1;
  loadTransactions();
};

const handleWithdrawTabChange = () => {
  query.channel = undefined;
  query.pageNum = 1;
};

const resetQuery = () => {
  query.uid = undefined;
  query.keyword = undefined;
  query.orderNo = undefined;
  query.status = activeTab.value === 'withdraw' ? 'AUDITING' : undefined;
  query.statuses = undefined;
  query.channel = undefined;
  query.withdrawTabCode = undefined;
  query.methodType = undefined;
  query.merchantId = undefined;
  query.notifyStatus = undefined;
  dateRange.value = usesTodayRange(activeTab.value) ? rechargeTodayRange() : undefined;
  query.pageNum = 1;
  loadTransactions();
};

const resetNotificationQuery = () => {
  notificationQuery.sourceType = undefined;
  notificationQuery.orderNo = undefined;
  notificationQuery.handleStatus = undefined;
  notificationQuery.direction = undefined;
  notificationQuery.pageNum = 1;
  loadNotifications();
};

const openDetail = async (row: FinanceTransactionVO) => {
  detailRequestPanels.value = [];
  const res = await getFinanceTransactionDetail(row.sourceType, row.orderNo);
  detail.value = res.data;
  detailVisible.value = true;
};

const openDetailRow = (row: unknown) => openDetail(row as FinanceTransactionVO);

const openMemberDetail = (uid?: string) => {
  if (!uid) return;
  router.push({ path: '/member/detail', query: { uid } });
};

const hasAction = (row: FinanceTransactionVO, action: string) =>
  Boolean(row.availableActions?.includes(action));

/**
 * Element Plus MessageBox.prompt 返回 { value, action }。
 * 财务动作只接受纯文本，统一在这里取 value；取消时返回 null 以终止操作。
 */
const promptTransactionText = async (content: string): Promise<string | null> => {
  try {
    const result = await modal.prompt(content);
    return String(result?.value ?? '').trim();
  } catch {
    return null;
  }
};

const handleAction = async (row: FinanceTransactionVO, action: string) => {
  if (action === 'CREDIT') {
    creditOrder.value = row;
    creditPassword.value = '';
    creditDialogVisible.value = true;
    return;
  }
  let remark = '';
  let params: Record<string, unknown> | undefined;
  if (['REMARK', 'REJECT', 'AUDIT', 'PAY', 'RETRY'].includes(action)) {
    const label = action === 'REMARK'
      ? '请输入备注'
      : action === 'REJECT'
        ? '请输入驳回原因'
        : `${actionLabel(action)}（可填写备注）`;
    const input = await promptTransactionText(label);
    if (input === null) return;
    if (action === 'REJECT' && !input) {
      modal.msgWarning('请输入驳回原因');
      return;
    }
    remark = input;
  }
  if (action === 'PAY') {
    const merchant = await promptTransactionText('可指定代付商户编码（留空使用默认）');
    if (merchant === null) return;
    if (merchant) params = { ...params, payMerchantCode: merchant };
  }
  if (['REJECT', 'AUDIT', 'PAY', 'RETRY'].includes(action)) {
    try {
      await modal.confirm(`确认执行「${actionLabel(action)}」？`);
    } catch {
      return;
    }
  }
  await financeTransactionAction({
    sourceType: row.sourceType,
    orderNo: row.orderNo,
    action,
    remark: remark || undefined,
    params
  });
  modal.msgSuccess('操作成功');
  await loadTransactions();
};

const submitCredit = async () => {
  if (!creditOrder.value) return;
  if (!creditPassword.value.trim()) {
    modal.msgWarning('请输入当前后台登录密码');
    return;
  }
  creditSubmitting.value = true;
  try {
    await financeTransactionAction({
      sourceType: creditOrder.value.sourceType,
      orderNo: creditOrder.value.orderNo,
      action: 'CREDIT',
      params: { loginPassword: creditPassword.value }
    });
    modal.msgSuccess('充值订单入账成功');
    creditDialogVisible.value = false;
    await loadTransactions();
  } finally {
    creditSubmitting.value = false;
  }
};

const resetCreditDialog = () => {
  creditOrder.value = undefined;
  creditPassword.value = '';
  creditSubmitting.value = false;
};

const settlementCurrency = (row: FinanceTransactionVO) => row.settlementCurrency || row.currency || 'VND';
const targetTypeLabel = (value?: string) => ({
  BANK: '银行',
  CARD: '充值卡',
  EWALLET: '电子钱包',
  CRYPTO: '虚拟币',
  QUICK_PAY: '快捷支付',
  GIFT_CARD: '礼品卡',
  P2P: 'P2P',
  COIN12: 'Coin12'
}[value || ''] || value || '—');
const targetPlatformText = (row: FinanceTransactionVO) => {
  const value = row.targetPlatform || '';
  const known: Record<string, string> = {
    binance: 'Binance',
    houbi: 'HTX',
    htx: 'HTX',
    remitano: 'Remitano',
    coin12: 'Coin12',
    bybit: 'Bybit',
    okx: 'OKX'
  };
  return known[value.toLowerCase()] || value || '—';
};
const hasTargetInfo = (row: FinanceTransactionVO) =>
  Boolean(row.targetPlatform || row.targetCode || row.targetAccountNo || row.targetAccountName || row.targetAddress);
const targetValue = (row: FinanceTransactionVO) => row.targetAddress || row.targetAccountNo || row.beneficiaryNo || '';

const osLabel = (row: FinanceTransactionVO) => {
  const name = row.clientOs?.trim() || '';
  const version = row.clientOsVersion?.trim() || '';
  return [name, version].filter(Boolean).join(' ') || '-';
};

const browserLabel = (row: FinanceTransactionVO) => {
  const name = row.clientBrowser?.trim() || '';
  const version = row.clientBrowserVersion?.trim() || '';
  return [name, version].filter(Boolean).join(' ') || '-';
};

const clientSystemLabel = (row: FinanceTransactionVO) =>
  [osLabel(row), browserLabel(row)].filter((value) => value !== '-').join(' · ') || '-';

const formatRechargeAmount = (value?: number, currency?: string) => {
  if (value === null || value === undefined) return '-';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  const unit = (currency || 'VND').toUpperCase();
  const text = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === 'VND' ? 0 : 8
  });
  return `${text} ${unit}`;
};

const formatPlatformAmount = (value?: number) => {
  if (value === null || value === undefined) return '-';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })
    : String(value);
};

const fmtTransactionTime = (value?: string) =>
  value ? String(value).replace('T', ' ').slice(0, 19) : '-';

const isLoopbackIp = (value?: string) => {
  const ip = (value || '').trim().toLowerCase().replace(/^::ffff:/, '');
  return ip === '::1' || ip === 'localhost' || ip === '0.0.0.0' || ip.startsWith('127.');
};

const copyTransactionText = async (value?: string, label = '内容') => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  modal.msgSuccess(`${label}已复制`);
};

const eventTypeLabel = (value?: string) => ({
  CREATE: '创建订单',
  CREDIT: '订单入账',
  CREDIT_FAILED: '入账失败',
  AUDIT: '审核通过',
  REJECT: '订单驳回',
  PAY: '发起出款',
  RETRY: '重试处理',
  RETRY_NOTIFY: '重试通知',
  IGNORE_NOTIFY: '忽略通知',
  REMARK: '修改备注'
}[value || ''] || value || '状态变更');

const eventTimelineType = (status?: string): 'success' | 'warning' | 'danger' | 'primary' | 'info' => {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED' || status === 'REJECTED') return 'danger';
  if (status === 'PENDING' || status === 'AUDITING' || status === 'PROCESSING') return 'warning';
  return 'primary';
};

const eventTransitionLabel = (event: FinanceOrderEvent) => {
  const from = event.fromStatus ? statusLabel(event.fromStatus) : '';
  const to = event.toStatus ? statusLabel(event.toStatus) : '';
  return [from, to].filter(Boolean).join(' → ') || '状态变更';
};

const channelLabel = (value?: string) => ({
  BANKS: '银行转账',
  BANK: '银行转账',
  CARD: '充值卡',
  EWALLET: '电子钱包',
  CRYPTO: '数字货币',
  QUICK_PAY: '快捷充值',
  GIFTCODE: '礼品卡',
  GIFT_CARD: '礼品卡'
}[String(value || '').toUpperCase()] || value || '-');

const withdrawTabLabel = (value?: string) =>
  withdrawTabs.value.find((item) => item.value === value)?.label || value || '-';

const withdrawMethodLabel = (value?: string) => {
  for (const methods of Object.values(options.withdrawMethodsByTab)) {
    const matched = methods.find((item) => item.value === value);
    if (matched) return matched.label;
  }
  return value || '-';
};

const pendingAgeLabel = (row: FinanceTransactionVO) => {
  if (row.sourceType !== 'WITHDRAW' || row.status !== 'AUDITING' || !row.createdAt) return '';
  const started = new Date(row.createdAt).getTime();
  if (!Number.isFinite(started)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - started) / 60_000));
  if (minutes < 1) return '待审核 · 刚刚提交';
  if (minutes < 60) return `待审核 · 已等待 ${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `待审核 · 已等待 ${hours} 小时`;
  return `待审核 · 已等待 ${Math.floor(hours / 24)} 天`;
};

const handleNotification = async (row: FinanceNotificationVO, action: 'retry' | 'replay' | 'ignore') => {
  const input = await promptTransactionText(
    `请输入${action === 'retry' ? '重试' : action === 'replay' ? '重放' : '忽略'}说明`
  );
  if (input === null) return;
  if (action === 'retry') await retryFinanceNotification(row.notificationId, input || undefined);
  if (action === 'replay') await replayFinanceNotification(row.notificationId, input || undefined);
  if (action === 'ignore') await ignoreFinanceNotification(row.notificationId, input || undefined);
  modal.msgSuccess('操作成功');
  await loadNotifications();
};

const handleExport = () => {
  if (rows.value.length === 0) {
    modal.msgWarning('当前页没有可导出的数据');
    return;
  }
  const header = ['来源', '订单号', 'UID', '账号', '会员层级', '会员标签', '同IP账号数',
    '设备指纹', '同设备账号数', '提现大类', '方向', '申请金额', '实际到账', '手续费',
    '收款类型', '收款平台', '收款编码', '收款账号/地址', '收款户名',
    '累计提现金额', '累计提现次数', '最后提现时间', '渠道', '方式', '商户',
    '状态', '失败原因', '通知状态', '客户端IP', '创建时间', '完成时间'];
  const lines = rows.value.map((row) => [
    sourceLabel(row.sourceType), row.orderNo, row.uid, row.account, row.memberLevelName,
    row.memberTagNames, row.sameIpAccountCount, row.deviceFingerprint, row.sameDeviceAccountCount,
    row.withdrawTabCode,
    row.direction, row.amount, row.arriveAmount, row.feeAmount, targetTypeLabel(row.targetType),
    targetPlatformText(row), row.targetCode, targetValue(row), row.targetAccountName,
    row.cumulativeWithdrawAmount, row.cumulativeWithdrawCount, row.lastWithdrawAt,
    row.channel, row.methodType, row.merchantName, row.status, row.failMsg, row.notifyStatus,
    row.clientIp, row.createdAt, row.finishedAt
  ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob(['\ufeff' + header.join(',') + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `finance-transaction-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const sourceLabel = (value?: string) => ({
  ONLINE_DEPOSIT: '在线充值',
  RECHARGE: '在线充值',
  WITHDRAW: '提现',
  TRANSFER_DEPOSIT: '转账充值',
  CS_DEPOSIT: '客服代充',
  EXCHANGE_OTC: '交易所 OTC'
}[value || ''] || value || '-');

const sourceTagType = (value?: string) => {
  if (value === 'WITHDRAW') return 'warning';
  if (value === 'EXCHANGE_OTC') return 'info';
  if (value === 'CS_DEPOSIT' || value === 'TRANSFER_DEPOSIT') return 'primary';
  return 'success';
};

const statusLabel = (value?: string) => ({
  PENDING: '待支付', AUDITING: '待审核', PROCESSING: '处理中', SUCCESS: '成功',
  REJECTED: '已驳回', CANCELLED: '已取消', FAILED: '失败', UNKNOWN: '未知'
}[value || ''] || value || '-');

const withdrawStatusLabel = (value?: string) => ({
  AUDITING: '待审核',
  PROCESSING: '处理中',
  SUCCESS: '出款成功',
  FAILED: '出款失败',
  CANCELLED: '已取消'
}[value || ''] || value || '-');

const statusTagType = (value?: string) => {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED' || value === 'REJECTED') return 'danger';
  if (value === 'PENDING' || value === 'AUDITING') return 'warning';
  if (value === 'PROCESSING') return 'primary';
  return 'info';
};

const notifyLabel = (value?: string) => ({
  PENDING: '待处理', SUCCESS: '成功', FAILED: '失败', IGNORED: '已忽略'
}[value || ''] || value || '-');

const notifyTagType = (value?: string) => {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED') return 'danger';
  if (value === 'PENDING') return 'warning';
  return 'info';
};

const directionLabel = (value?: string) => ({
  INBOUND_CALLBACK: '入站回调',
  OUTBOUND_PROVIDER: '出站三方',
  OUTBOUND_CLIENT: '出站客户端'
}[value || ''] || value || '-');

const actionLabel = (value: string) => ({
  AUDIT: '审核通过', REJECT: '驳回', PAY: '转账', NO_AUDIT_PAY: '免审出款',
  RETRY: '重试', RE_PAY: '重试', TRANSFER_TO_RECHARGE: '提现转充值', LOCK: '锁定', UNLOCK: '解锁',
  REMARK: '备注', RETRY_NOTIFY: '重试通知', IGNORE_NOTIFY: '忽略通知', CREDIT: '入账'
}[value] || value);

const prettyJson = (value?: unknown) =>
  value ? JSON.stringify(value, null, 2) : '无请求快照';

onMounted(async () => {
  if (route.query.uid) query.uid = String(route.query.uid);
  if (route.query.status) query.status = String(route.query.status);
  else if (activeTab.value === 'withdraw') query.status = 'AUDITING';
  if (route.query.handleStatus) notificationQuery.handleStatus = String(route.query.handleStatus);
  if (usesTodayRange(activeTab.value) && !dateRange.value) {
    dateRange.value = rechargeTodayRange();
  }
  await loadOptions();
  if (activeTab.value === 'notification') await loadNotifications();
  else await loadTransactions();
});
</script>

<style scoped>
.withdraw-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.recharge-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  gap: 4px 8px;
}

.recharge-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.withdraw-beneficiary-cell,
.withdraw-beneficiary-masked {
  min-width: 0;
}

.withdraw-beneficiary-account,
.withdraw-beneficiary-masked {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.withdraw-beneficiary-account code,
.withdraw-beneficiary-masked code {
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.withdraw-beneficiary-account .el-button {
  margin-left: 0;
}

.withdraw-beneficiary-user {
  margin-top: 4px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.member-level-line,
.member-tag-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.member-tag-line {
  margin-top: 6px;
}

.link-count {
  margin-top: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.device-link {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.relation-link,
.device-link {
  color: var(--el-color-primary);
  text-decoration: none;
}
.relation-link:hover,
.device-link:hover {
  text-decoration: underline;
}

.target-platform-line {
  display: flex;
  align-items: center;
  gap: 7px;
}

.target-code {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.transaction-failure {
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-waiting {
  margin-top: 3px;
  color: var(--el-color-warning);
  font-size: 12px;
}

.request-preview {
  max-height: 280px;
  overflow: auto;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.tx-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2px 2px 24px;
}

.tx-hero {
  --tx-tone: var(--el-color-primary);
  padding: 20px 22px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: linear-gradient(110deg, var(--el-fill-color-extra-light), var(--el-bg-color) 58%);
  box-shadow: inset 4px 0 0 var(--tx-tone);
}

.tx-hero--success {
  --tx-tone: var(--el-color-success);
}

.tx-hero--danger {
  --tx-tone: var(--el-color-danger);
}

.tx-hero--warning {
  --tx-tone: var(--el-color-warning);
}

.tx-hero--info {
  --tx-tone: var(--el-text-color-secondary);
}

.tx-hero__main,
.tx-hero__status,
.tx-hero__eyebrow,
.tx-order-no,
.tx-inline-value,
.tx-event-title,
.tx-request-actions {
  display: flex;
  align-items: center;
}

.tx-hero__main {
  justify-content: space-between;
  gap: 28px;
}

.tx-hero__identity {
  min-width: 0;
}

.tx-hero__eyebrow {
  gap: 9px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tx-hero__identity h2 {
  margin: 12px 0 6px;
  color: var(--el-text-color-primary);
  font-size: 25px;
  line-height: 1.25;
}

.tx-hero__identity > p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tx-order-no {
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tx-order-no code,
.tx-inline-value code {
  color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.tx-hero__amount {
  flex: none;
  min-width: 210px;
  text-align: right;
}

.tx-hero__amount > span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tx-hero__amount > strong {
  display: block;
  margin: 6px 0;
  color: var(--tx-tone);
  font-size: clamp(22px, 2.5vw, 30px);
  line-height: 1.2;
}

.tx-hero__amount > small {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.tx-hero__status {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tx-action-alert {
  border-radius: 10px;
}

.tx-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.tx-kpi {
  min-width: 0;
  padding: 14px 15px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.tx-kpi > span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
}

.tx-kpi > strong {
  display: block;
  overflow: hidden;
  margin-top: 7px;
  color: var(--el-text-color-primary);
  font-size: clamp(16px, 1.7vw, 20px);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-kpi > small {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tx-info-card,
.tx-timeline-card,
.tx-notification-card,
.tx-request-collapse {
  padding: 17px 19px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.tx-info-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tx-info-card__header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.tx-info-card__header span {
  text-align: right;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.tx-field-list {
  display: flex;
  flex-direction: column;
}

.tx-field {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 38px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
}

.tx-field:last-child {
  border-bottom: 0;
}

.tx-field > span {
  color: var(--el-text-color-secondary);
}

.tx-field > strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-weight: 600;
  text-align: right;
}

.tx-field--danger > strong {
  color: var(--el-color-danger);
}

.tx-field__multiline {
  padding: 9px 0;
  line-height: 1.55;
}

.tx-inline-value {
  justify-content: flex-end;
  gap: 5px;
  min-width: 0;
}

.tx-inline-value .el-button {
  flex: none;
  margin-left: 0;
}

.tx-inline-value > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-device-fingerprint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-timeline {
  padding: 16px 4px 0 2px;
}

.tx-event-title {
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.tx-event-title strong {
  font-size: 13px;
}

.tx-event-meta,
.tx-event-remark {
  margin-top: 5px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.tx-notification-card :deep(.el-table) {
  margin-top: 12px;
}

.tx-empty-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  min-height: 68px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.tx-empty-inline strong {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.tx-request-collapse {
  padding-top: 0;
  padding-bottom: 4px;
}

.tx-request-collapse :deep(.el-collapse) {
  border: 0;
}

.tx-request-collapse :deep(.el-collapse-item__header),
.tx-request-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background: transparent;
}

.tx-request-title span {
  display: block;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.tx-request-title small {
  display: block;
  margin-top: 2px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.tx-request-actions {
  justify-content: flex-end;
  margin-bottom: 8px;
}

@media (width <= 900px) {
  .tx-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 720px) {
  .tx-hero__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .tx-hero__amount {
    min-width: 0;
    text-align: left;
  }

  .tx-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 460px) {
  .tx-kpi-grid {
    grid-template-columns: 1fr;
  }

  .tx-hero {
    padding: 17px;
  }

  .tx-info-card,
  .tx-timeline-card,
  .tx-notification-card,
  .tx-request-collapse {
    padding-right: 15px;
    padding-left: 15px;
  }

  .tx-field {
    grid-template-columns: 88px minmax(0, 1fr);
  }
}
</style>
