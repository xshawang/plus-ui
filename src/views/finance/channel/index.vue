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
            <el-option label="加密货币" :value="4" />
            <el-option label="礼品卡" :value="5" />
            <el-option label="P2P 充值" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="queryParams.methodType" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="queryParams.direction" placeholder="全部" clearable style="width: 120px">
            <el-option label="充值" :value="1" />
            <el-option label="提现" :value="2" />
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
      <el-alert
        title="加密货币配置已合并到充值通道"
        type="info"
        :closable="false"
        show-icon
        class="mt-3"
      >
        <template #default>
          CRYPTO 通道的币种、网络、平台价格、收款地址和二维码直接读写
          <code>crypto_config</code>；保存后充值接口实时查表，无需单独进入“加密货币配置”页面。
        </template>
      </el-alert>
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
              <span class="ml-3 text-gray-400 text-sm">
                通道 {{ isQuickPayGroup(group) ? quickPayRoutes(group).length : (group.routes || []).length }} 条
              </span>
            </div>
          </template>
          <div class="group-actions">
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleEditGroup(group)">修改大类</el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleToggleGroup(group)">
              {{ group.status === 1 ? '停用大类' : '启用大类' }}
            </el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleAddRoute(group)">新增通道</el-button>
          </div>
          <el-alert
            v-if="isQuickPayGroup(group)"
            :title="quickPayMatchTitle(group)"
            :type="quickPayMatched(group) ? 'success' : 'warning'"
            :closable="false"
            show-icon
            class="client-contract-alert"
          >
            <template #default>
              客户端固定展示 4 个快捷充值平台：FastPay、SNAP QR、1PAY、TAP SCAN。
              后台只能启用与客户端匹配的这 4 条通道，平台图标、名称和编码均可在“修改”中维护。
            </template>
          </el-alert>
          <el-alert
            v-if="isEwalletGroup(group)"
            title="电子钱包按 Viettel Money、MoMo、ZaloPay 分别下发"
            type="info"
            :closable="false"
            show-icon
            class="client-contract-alert"
          >
            <template #default>
              每一行独立维护客户端编码、渠道名称、图标、收款账号、收款户名、限额、在线时段和超时分钟；
              “Nội Dung”及 QR 倒计时来自实际订单，不由静态配置写死。
            </template>
          </el-alert>
          <el-alert
            v-if="isP2pGroup(group)"
            title="P2P 使用独立渠道配置，充值订单仍需支付确认后才可入账"
            type="warning"
            :closable="false"
            show-icon
            class="client-contract-alert"
          >
            <template #default>
              P2P 交易对手、成交价、支付超时、挂单文案及平台收款信息保存在
              <code>finance_withdraw_channel</code>；本页编辑不会伪造充值成功，充值记录先以“待支付/处理中”展示。
            </template>
          </el-alert>
          <el-table :data="filterRoutes(group)" border size="small">
            <el-table-column label="通道编号" prop="routeCode" align="center" width="120" />
            <el-table-column label="通道名称" prop="channelName" align="left" min-width="150" show-overflow-tooltip />
            <el-table-column label="支付方式" align="center" width="110">
              <template #default="{ row }">{{ methodLabel(row.methodType) }}</template>
            </el-table-column>
            <el-table-column label="运行平台" prop="platform" align="center" width="90" />
            <el-table-column v-if="isQuickPayGroup(group)" label="客户端平台标识" align="left" min-width="150">
              <template #default="{ row }">
                <el-tag :type="quickPayPlatformMatches(row as FinanceChannelRouteVO) ? 'success' : 'danger'">
                  {{ quickPayPlatformCode(row as FinanceChannelRouteVO) }}
                </el-tag>
                <span v-if="!quickPayPlatformMatches(row as FinanceChannelRouteVO)" class="text-xs text-red-500 ml-2">
                  应为 {{ row.routeCode }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="方向" align="center" width="80">
              <template #default="{ row }">{{ row.direction === 2 ? '提现' : '充值' }}</template>
            </el-table-column>
            <el-table-column label="所属商户" prop="merchantName" align="left" min-width="170" show-overflow-tooltip />
            <el-table-column label="图标" align="center" width="72">
              <template #default="{ row }">
                <el-image
                  v-if="row.channelIcon || row.iconUrl"
                  :src="row.channelIcon || row.iconUrl"
                  :preview-src-list="[row.channelIcon || row.iconUrl]"
                  fit="contain"
                  class="channel-icon"
                />
                <span v-else class="text-gray-400">-</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isCryptoGroup(group)"
              label="币种 / 网络"
              align="left"
              min-width="145"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ [row.coinName || row.clientCode, row.networkName || row.clientSubCode].filter(Boolean).join(' / ') || '未配置' }}
              </template>
            </el-table-column>
            <el-table-column
              v-else-if="!isQuickPayGroup(group)"
              label="客户端标识"
              align="left"
              min-width="180"
              show-overflow-tooltip
            >
              <template #default="{ row }">{{ clientIdentity(row as FinanceChannelRouteVO) }}</template>
            </el-table-column>
            <el-table-column
              v-if="showsAccountColumns(group)"
              label="收款账户号"
              align="left"
              min-width="170"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <code v-if="accountNumber(row as FinanceChannelRouteVO)" class="account-value">
                  {{ accountNumber(row as FinanceChannelRouteVO) }}
                </code>
                <span v-else class="text-red-500">未配置</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="showsAccountColumns(group)"
              label="收款账户名"
              align="left"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span v-if="row.accountName">{{ row.accountName }}</span>
                <span v-else class="text-red-500">未配置</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isCryptoGroup(group)"
              label="平台收款地址"
              align="left"
              min-width="220"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <code v-if="row.address" class="crypto-address">{{ row.address }}</code>
                <span v-else class="text-gray-400">未配置</span>
              </template>
            </el-table-column>
            <el-table-column label="客户端下发值" align="left" min-width="230" show-overflow-tooltip>
              <template #default="{ row }">{{ clientDetailSummary(row as FinanceChannelRouteVO) }}</template>
            </el-table-column>
            <el-table-column label="单笔限额" align="right" width="180">
              <template #default="{ row }">{{ formatMoneyRange(row.amountMin ?? 0, row.amountMax ?? 0) }}</template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" align="center" width="80" />
            <el-table-column label="开放时段" align="center" width="125">
              <template #default="{ row }">{{ row.openTimeStart || '00:00' }} - {{ row.openTimeEnd || '23:59' }}</template>
            </el-table-column>
            <el-table-column
              label="推荐金额"
              prop="recommendAmounts"
              align="left"
              min-width="200"
              show-overflow-tooltip
              :formatter="moneyListColumnFormatter"
            />
            <el-table-column label="费率(%)" prop="feeRate" align="right" width="90" />
            <el-table-column label="成功率(%)" prop="successRate" align="right" width="100" />
            <el-table-column label="排序" prop="subSort" align="center" width="70" />
            <el-table-column label="维护开关" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'status', val)"
                />
              </template>
            </el-table-column>
            <el-table-column v-if="!isP2pGroup(group)" label="通道合并" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.mergeFlag"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'mergeFlag', val)"
                />
              </template>
            </el-table-column>
            <el-table-column v-if="!isP2pGroup(group)" label="充值黑名单" align="center" width="110">
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
                <el-button
                  v-if="!isP2pGroup(group)"
                  v-hasPermi="['finance:channel:edit']"
                  link
                  type="danger"
                  @click="handleDeleteRoute(row as FinanceChannelRouteVO)"
                >
                  删除
                </el-button>
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
            <el-option label="加密货币" :value="4" />
            <el-option label="礼品卡" :value="5" />
            <el-option label="P2P 充值" :value="6" />
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

    <el-dialog v-model="routeDialog" :title="routeForm.routeId ? '修改充值通道' : '新增充值通道'" width="920px" append-to-body>
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
              <el-input
                v-model="routeForm.routeCode"
                placeholder="如 FASTPAY / TRC20 / MOMO"
                @input="syncQuickPayIdentity"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道名称" prop="channelName">
              <el-input v-model="routeForm.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运行平台" prop="platform">
              <el-input v-model="routeForm.platform" placeholder="部署环境，通常为 go88" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资金方向" prop="direction">
              <el-select v-model="routeForm.direction" style="width: 100%">
                <el-option label="充值" :value="1" />
                <el-option label="提现" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户端支付方式" prop="methodType">
              <el-select v-model="routeForm.methodType" style="width: 100%" @change="handleMethodTypeChange">
                <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维护码">
              <el-input v-model="routeForm.maintenanceCode" placeholder="如 dep / despib / withdrib" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属商户">
              <el-select v-model="routeForm.merchantId" clearable placeholder="自有(不选)" style="width: 100%">
                <el-option v-for="merchant in merchants" :key="merchant.merchantId" :label="merchant.merchantName" :value="merchant.merchantId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="渠道图标">
              <div class="qr-config">
                <image-upload v-model="routeForm.channelIcon" value-mode="url" :limit="1" />
                <el-input v-model="routeForm.channelIcon" placeholder="客户端渠道图标 URL" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开放开始">
              <el-input v-model="routeForm.openTimeStart" placeholder="08:00" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开放结束">
              <el-input v-model="routeForm.openTimeEnd" placeholder="23:59" />
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
            <el-form-item label="单笔最低">
              <el-input-number v-model="routeForm.amountMin" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最高">
              <el-input-number v-model="routeForm.amountMax" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="推荐金额">
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
            <el-form-item label="通道合并">
              <el-switch v-model="routeForm.mergeFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="充值黑名单">
              <el-switch v-model="routeForm.blacklistEnable" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col v-if="routeForm.methodType !== 'QUICK_PAY'" :span="12">
            <el-form-item label="客户端编码">
              <el-input v-model="routeForm.clientCode" placeholder="银行编码 / 卡品牌 / 币种 / 快捷前缀" />
            </el-form-item>
          </el-col>
          <el-col v-if="routeForm.methodType !== 'QUICK_PAY'" :span="12">
            <el-form-item label="客户端子编码">
              <el-input v-model="routeForm.clientSubCode" placeholder="网络（如 BEP20 / TRC20）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日限额">
              <el-input-number v-model="routeForm.dailyLimit" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="旧地址展示">
              <div class="switch-pair">
                <span>V1</span>
                <el-switch v-model="routeForm.addressV1Enabled" :active-value="1" :inactive-value="0" />
                <span>V3</span>
                <el-switch v-model="routeForm.addressV3Enabled" :active-value="1" :inactive-value="0" />
              </div>
            </el-form-item>
          </el-col>

          <el-col v-if="routeForm.methodType === 'BANKS' || routeForm.methodType === 'EWALLET'" :span="24">
            <el-divider content-position="left">银行 / 电子钱包客户端明细</el-divider>
          </el-col>
          <template v-if="routeForm.methodType === 'BANKS' || routeForm.methodType === 'EWALLET'">
            <el-col :span="12">
              <el-form-item label="收款账号">
                <el-input v-model="routeForm.account" placeholder="客户端 account_no / SĐT" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款户名">
                <el-input v-model="routeForm.accountName" placeholder="客户端 account_name / Tên TK" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户端通道编码">
                <el-input v-model="routeForm.bankCode" placeholder="如 VCB / MOMO" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户端通道名称">
                <el-input v-model="routeForm.bankName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="SmartPay编码">
                <el-input v-model="routeForm.smartpayCode" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="在线时段">
                <el-input v-model="routeForm.statementTime" placeholder="如 08:00-22:00" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="超时分钟">
                <el-input-number v-model="routeForm.timeLimit" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户端排序">
                <el-input-number v-model="routeForm.orderNavigate" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="固定手续费">
                <el-input-number v-model="routeForm.fee" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="固定赠送">
                <el-input-number v-model="routeForm.bonusAmount" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="第三方参数">
                <el-input v-model="routeForm.thirdPartyParams" type="textarea" :rows="2" placeholder="JSON 扩展参数" />
              </el-form-item>
            </el-col>
          </template>

          <template v-if="routeForm.methodType === 'P2P'">
            <el-col :span="24">
              <el-divider content-position="left">P2P 充值平台与客户端展示</el-divider>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易对手用户名">
                <el-input v-model="routeForm.p2pMakerUserName" placeholder="p2p-6585612" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易对手显示名">
                <el-input v-model="routeForm.p2pMakerDisplayName" placeholder="P2P Platform" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成交价（VND/币）">
                <el-input-number
                  v-model="routeForm.p2pPrice"
                  :min="0.00000001"
                  :precision="8"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="P2P 资产名称">
                <el-input v-model="routeForm.p2pAssetName" placeholder="KDG" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="支付超时（分钟）">
                <el-input-number
                  v-model="routeForm.p2pPaymentTimeLimit"
                  :min="1"
                  :max="1440"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最低累计充值">
                <el-input-number
                  v-model="routeForm.p2pMinTotalDeposit"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台收款银行编码">
                <el-input v-model="routeForm.p2pDepositBankCode" placeholder="客户端 toBankCode" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台收款账号">
                <el-input v-model="routeForm.p2pDepositAccountNo" placeholder="客户端 toAccountNo" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台收款户名">
                <el-input v-model="routeForm.p2pDepositAccountName" placeholder="客户端 toAccountName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="转账内容模板">
                <el-input v-model="routeForm.p2pDepositContent" placeholder="如 P2P-{orderNo}" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="挂单自动回复">
                <el-input v-model="routeForm.p2pAutoReplyText" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="挂单备注">
                <el-input v-model="routeForm.p2pNote" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </template>

          <el-col v-if="routeForm.methodType === 'CARD'" :span="24">
            <el-divider content-position="left">充值卡客户端明细</el-divider>
          </el-col>
          <template v-if="routeForm.methodType === 'CARD'">
            <el-col :span="12">
              <el-form-item label="卡品牌">
                <el-input v-model="routeForm.cardBrand" placeholder="VIETTEL / MOBIFONE" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="卡片标签">
                <el-input v-model="routeForm.cardLabel" placeholder="Thẻ Viettel" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="兑换率">
                <el-input-number v-model="routeForm.rate" :min="0" :max="1" :step="0.01" :precision="4" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="可选面额">
                <el-input v-model="routeForm.denominations" placeholder="JSON数组，如 [50000,100000,200000]" />
              </el-form-item>
            </el-col>
          </template>

          <el-col v-if="routeForm.methodType === 'CRYPTO'" :span="24">
            <el-divider content-position="left">加密货币配置（crypto_config）</el-divider>
          </el-col>
          <template v-if="routeForm.methodType === 'CRYPTO'">
            <el-col :span="12">
              <el-form-item label="币种">
                <el-input v-model="routeForm.coinName" placeholder="USDT" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="网络">
                <el-input v-model="routeForm.networkName" placeholder="BEP20 / TRC20" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台价格（平台币/币）">
                <el-input-number v-model="routeForm.platformRate" :min="0" controls-position="right" style="width: 100%" />
                <span class="field-hint">同时写入 crypto_config.price 和 platform_rate</span>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="收款地址">
                <el-input v-model="routeForm.address" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="二维码图片">
                <div class="qr-config">
                  <image-upload v-model="routeForm.qrData" value-mode="url" :limit="1" />
                  <el-input v-model="routeForm.qrData" placeholder="也可直接填写图片URL，如 http://play.g318.com/imgs/xxx.png" />
                </div>
              </el-form-item>
            </el-col>
          </template>

          <el-col v-if="routeForm.methodType === 'QUICK_PAY'" :span="24">
            <el-divider content-position="left">快捷充值档位明细</el-divider>
          </el-col>
          <template v-if="routeForm.methodType === 'QUICK_PAY'">
            <el-col :span="12">
              <el-form-item label="客户端平台标识" prop="clientCode">
                <el-input v-model="routeForm.clientCode" placeholder="FASTPAY / SNAPQR / 1PAY / TAPSCAN" />
                <span class="field-hint">下发字段 bankcode，必须与通道编号一致</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="档位前缀" prop="prefix">
                <el-input v-model="routeForm.prefix" placeholder="通常与通道编号一致" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款账户号" prop="receiveNumber">
                <el-input v-model="routeForm.receiveNumber" placeholder="客户端显示为 Số TK，不是户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款账户名" prop="accountName">
                <el-input v-model="routeForm.accountName" placeholder="客户端显示为 Tên TK" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="充值金额（分）">
                <el-input-number v-model="routeForm.fee" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="赠送金额（分）">
                <el-input-number v-model="routeForm.bonusAmount" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="档位内容">
                <el-input v-model="routeForm.content" />
              </el-form-item>
            </el-col>
          </template>

          <template v-if="routeForm.methodType === 'GIFT_CARD'">
            <el-col :span="24">
              <el-divider content-position="left">礼品卡客户端明细</el-divider>
            </el-col>
            <el-col :span="12">
              <el-form-item label="礼品卡编码">
                <el-input v-model="routeForm.giftCode" placeholder="FACEBOOK" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="礼品卡名称">
                <el-input v-model="routeForm.giftName" placeholder="Facebook Gift Card" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="礼品卡图标">
                <image-upload v-model="routeForm.iconUrl" value-mode="url" :limit="1" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="跳转地址">
                <el-input v-model="routeForm.jumpUrl" placeholder="https://..." />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="礼品卡账户">
                <el-input v-model="routeForm.account" />
              </el-form-item>
            </el-col>
          </template>

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
import {
  changeWithdrawChannelStatus,
  changeWithdrawTabStatus,
  listWithdrawChannelProfiles,
  listWithdrawTabs,
  saveWithdrawChannelProfile
} from '@/api/finance/withdraw-channel';
import type {
  WithdrawChannelProfileForm,
  WithdrawChannelProfileVO,
  WithdrawTabVO
} from '@/api/finance/withdraw-channel/types';
import { formatMoneyRange, moneyListColumnFormatter } from '@/utils/money';

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
const p2pProfiles = ref<WithdrawChannelProfileVO[]>([]);
const withdrawTabs = ref<WithdrawTabVO[]>([]);
const p2pOriginalProfile = ref<WithdrawChannelProfileVO>();
const activeGroups = ref<number[]>([]);
const groupDialog = ref(false);
const routeDialog = ref(false);
const groupFormRef = ref<FormInstance>();
const routeFormRef = ref<FormInstance>();

const queryParams = reactive<FinanceChannelQuery>({
  groupKeyword: '',
  routeKeyword: '',
  groupType: undefined,
  methodType: undefined,
  direction: undefined
});

const P2P_GROUP_CODE = 'P2P';
const P2P_GROUP_TYPE = 6;
const QUICK_PAY_CLIENT_CODES = ['FASTPAY', 'SNAPQR', '1PAY', 'TAPSCAN'];

const methodOptions = [
  { label: '银行转账', value: 'BANKS' },
  { label: '充值卡', value: 'CARD' },
  { label: '电子钱包', value: 'EWALLET' },
  { label: '加密货币', value: 'CRYPTO' },
  { label: '快捷充值', value: 'QUICK_PAY' },
  { label: 'P2P 充值', value: 'P2P' },
  { label: '礼品卡', value: 'GIFT_CARD' }
];

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

const emptyRouteForm = (): FinanceChannelRouteForm => ({
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
  blacklistEnable: 0,
  platform: 'go88',
  direction: 1,
  methodType: 'BANKS',
  clientCode: '',
  clientSubCode: '',
  dailyLimit: 0,
  maintenanceCode: '',
  addressV1Enabled: 1,
  addressV3Enabled: 1,
  channelIcon: '',
  openTimeStart: '00:00',
  openTimeEnd: '23:59',
  bankCode: '',
  bankName: '',
  smartpayCode: '',
  account: '',
  receiveNumber: '',
  statementTime: '',
  timeLimit: 0,
  orderNavigate: 0,
  cardBrand: '',
  cardLabel: '',
  denominations: '[]',
  rate: 0,
  coinName: '',
  networkName: '',
  address: '',
  qrData: '',
  price: 0,
  platformRate: 0,
  prefix: '',
  fee: 0,
  bonusAmount: 0,
  content: '',
  accountName: '',
  minAmount: 0,
  maxAmount: 0,
  thirdPartyParams: '',
  giftCode: '',
  giftName: '',
  iconUrl: '',
  jumpUrl: '',
  payoutMode: 'MANUAL',
  beneficiaryAddress: '',
  rateMode: 'NONE',
  exchangeRate: 1,
  feeMode: 'NONE',
  feeFixed: 0,
  feeCurrency: 'VND',
  beneficiaryType: 'BANK',
  accountPattern: '',
  clientFieldSchemaJson: '{}',
  channelConfigJson: '{}',
  priorityNo: 0,
  p2pAssetName: 'KDG',
  p2pPrice: 1000,
  p2pPaymentTimeLimit: 10,
  p2pMakerUserName: 'P2P-Platform',
  p2pMakerDisplayName: 'P2P Platform',
  p2pMinTotalDeposit: 1000000,
  p2pAutoReplyText: '',
  p2pNote: '',
  p2pDepositBankCode: '',
  p2pDepositAccountNo: '',
  p2pDepositAccountName: '',
  p2pDepositContent: ''
});

const routeForm = reactive<FinanceChannelRouteForm>(emptyRouteForm());

const groupRules: FormRules = {
  groupCode: [{ required: true, message: '大类编码不能为空', trigger: 'blur' }],
  groupName: [{ required: true, message: '大类名称不能为空', trigger: 'blur' }]
};

const requiredForQuickPay = (message: string) => (
  _rule: unknown,
  value: unknown,
  callback: (error?: Error) => void
) => {
  if (routeForm.methodType !== 'QUICK_PAY') {
    callback();
    return;
  }
  if (!String(value ?? '').trim()) {
    callback(new Error(message));
    return;
  }
  callback();
};

const validateQuickPayPlatform = (
  _rule: unknown,
  value: unknown,
  callback: (error?: Error) => void
) => {
  if (routeForm.methodType !== 'QUICK_PAY') {
    callback();
    return;
  }
  const platformCode = String(value ?? '').trim().toUpperCase();
  const routeCode = String(routeForm.routeCode ?? '').trim().toUpperCase();
  if (!platformCode) {
    callback(new Error('客户端平台标识不能为空'));
    return;
  }
  if (routeCode && platformCode !== routeCode) {
    callback(new Error('客户端平台标识必须与通道编号一致'));
    return;
  }
  callback();
};

const routeRules: FormRules = {
  groupId: [{ required: true, message: '所属大类不能为空', trigger: 'change' }],
  routeCode: [{ required: true, message: '通道编号不能为空', trigger: 'blur' }],
  channelName: [{ required: true, message: '通道名称不能为空', trigger: 'blur' }],
  methodType: [{ required: true, message: '客户端支付方式不能为空', trigger: 'change' }],
  platform: [{ required: true, message: '运行平台不能为空', trigger: 'blur' }],
  clientCode: [{ validator: validateQuickPayPlatform, trigger: 'blur' }],
  prefix: [{ validator: requiredForQuickPay('档位前缀不能为空'), trigger: 'blur' }],
  receiveNumber: [{ validator: requiredForQuickPay('收款账户号不能为空'), trigger: 'blur' }],
  accountName: [{ validator: requiredForQuickPay('收款账户名不能为空'), trigger: 'blur' }]
};

/** 大类关键字过滤（后端已支持，前端再兜一层以便本地即时反馈） */
const filteredGroups = computed(() => groups.value);

const routeTotal = computed(() => groups.value.reduce((sum, group) => sum + (group.routes?.length ?? 0), 0));

/** 通道关键字过滤：作用于当前大类内的通道列表 */
const filterRoutes = (group: FinanceChannelGroupVO): FinanceChannelRouteVO[] => {
  const sourceRoutes = group.routes ?? [];
  const routes = isQuickPayGroup(group)
    ? sourceRoutes.filter((route) =>
        QUICK_PAY_CLIENT_CODES.includes((route.routeCode || route.clientCode || '').toUpperCase())
      )
    : sourceRoutes;
  const kw = (queryParams.routeKeyword ?? '').trim().toLowerCase();
  if (!kw) {
    return routes.filter(
      (route) =>
        (!queryParams.methodType || route.methodType === queryParams.methodType) &&
        (!queryParams.direction || route.direction === queryParams.direction)
    );
  }
  return routes.filter(
    (route) =>
      (!queryParams.methodType || route.methodType === queryParams.methodType) &&
      (!queryParams.direction || route.direction === queryParams.direction) &&
      (route.channelName.toLowerCase().includes(kw) ||
        route.routeCode.toLowerCase().includes(kw) ||
        (route.merchantName ?? '').toLowerCase().includes(kw))
  );
};

const methodLabel = (method?: string) => methodOptions.find((item) => item.value === method)?.label ?? method ?? '未配置';
const isCryptoGroup = (group: FinanceChannelGroupVO) =>
  group.groupCode === 'CRYPTO' || group.groupType === 4;
const isQuickPayGroup = (group: FinanceChannelGroupVO) =>
  group.groupCode.toUpperCase() === 'QUICK_PAY';
const isEwalletGroup = (group: FinanceChannelGroupVO) =>
  group.groupCode.toUpperCase() === 'EWALLET';
const isBankGroup = (group: FinanceChannelGroupVO) =>
  ['BANK', 'BANKS'].includes(group.groupCode.toUpperCase());
const showsAccountColumns = (group: FinanceChannelGroupVO) =>
  isQuickPayGroup(group) || isEwalletGroup(group) || isBankGroup(group);
const isP2pGroup = (group: FinanceChannelGroupVO) =>
  group.groupCode.toUpperCase() === P2P_GROUP_CODE || group.groupType === P2P_GROUP_TYPE;

const accountNumber = (route: FinanceChannelRouteVO) =>
  String(route.receiveNumber || route.account || '').trim();
const quickPayPlatformCode = (route: FinanceChannelRouteVO) =>
  String(route.clientCode || route.prefix || route.routeCode || '').trim().toUpperCase();
const quickPayPlatformMatches = (route: FinanceChannelRouteVO) =>
  quickPayPlatformCode(route) === String(route.routeCode || '').trim().toUpperCase();

const quickPayRoutes = (group: FinanceChannelGroupVO) =>
  (group.routes ?? []).filter(
    (route) =>
      route.methodType === 'QUICK_PAY' &&
      route.status === 1 &&
      route.frontEnable === 1
  );
const quickPayMatched = (group: FinanceChannelGroupVO) => {
  const codes = quickPayRoutes(group)
    .map((route) => (route.routeCode || route.clientCode || '').toUpperCase())
    .toSorted();
  return (
    codes.length === QUICK_PAY_CLIENT_CODES.length &&
    QUICK_PAY_CLIENT_CODES.every((code) => codes.includes(code))
  );
};
const quickPayMatchTitle = (group: FinanceChannelGroupVO) => {
  if (quickPayMatched(group)) {
    return `已与客户端 4 个快捷平台一一匹配（${quickPayRoutes(group).length} 条启用）`;
  }
  const actual = quickPayRoutes(group).map((route) => route.routeCode.toUpperCase());
  const missing = QUICK_PAY_CLIENT_CODES.filter((code) => !actual.includes(code));
  const extra = actual.filter((code) => !QUICK_PAY_CLIENT_CODES.includes(code));
  return [
    `当前启用 ${actual.length} 条，客户端固定 4 条`,
    missing.length ? `缺少：${missing.join('、')}` : '',
    extra.length ? `客户端不支持：${extra.join('、')}` : ''
  ].filter(Boolean).join('；');
};

const parseChannelConfig = (json?: string): Record<string, any> => {
  try {
    const root = JSON.parse(json || '{}');
    return root && typeof root === 'object' && !Array.isArray(root) ? root : {};
  } catch {
    return {};
  }
};

const p2pRouteFromProfile = (
  profile: WithdrawChannelProfileVO,
  groupId: number
): FinanceChannelRouteVO => {
  const p2p = parseChannelConfig(profile.channelConfigJson).p2p ?? {};
  return {
    routeId: profile.withdrawChannelId,
    withdrawChannelId: profile.withdrawChannelId,
    groupId,
    routeCode: profile.channelCode,
    channelName: profile.channelName,
    subSort: profile.priorityNo ?? profile.sortNo ?? 0,
    merchantId: profile.merchantId,
    merchantName: profile.merchantName,
    currency: profile.currency,
    currencyRate: '',
    amountMin: profile.amountMin ?? 0,
    amountMax: profile.amountMax ?? 0,
    recommendAmounts: '',
    feeRate: Number(profile.feeRate ?? 0),
    successRate: 0,
    channelRemark: profile.remark ?? '',
    status: profile.status,
    mergeFlag: 0,
    frontEnable: profile.frontEnable,
    blacklistEnable: 0,
    platform: profile.platform,
    direction: 1,
    methodType: 'P2P',
    clientCode: profile.clientCode ?? '',
    clientSubCode: profile.clientSubCode ?? '',
    dailyLimit: profile.dailyLimit ?? 0,
    maintenanceCode: profile.maintenanceCode ?? '',
    addressV1Enabled: 1,
    addressV3Enabled: 1,
    channelIcon: profile.iconArt ?? '',
    openTimeStart: profile.openTimeStart,
    openTimeEnd: profile.openTimeEnd,
    account: profile.beneficiaryAddress ?? '',
    payoutMode: profile.payoutMode,
    platformKey: profile.platformKey,
    platformUrl: profile.platformUrl,
    beneficiaryAddress: profile.beneficiaryAddress,
    rateMode: profile.rateMode,
    exchangeRate: Number(profile.exchangeRate ?? 1),
    feeMode: profile.feeMode,
    feeFixed: Number(profile.feeFixed ?? 0),
    feeCurrency: profile.feeCurrency,
    beneficiaryType: profile.beneficiaryType,
    accountPattern: profile.accountPattern,
    clientFieldSchemaJson: profile.clientFieldSchemaJson,
    channelConfigJson: profile.channelConfigJson,
    priorityNo: profile.priorityNo,
    p2pAssetName: String(p2p.assetName || profile.clientCode || 'KDG'),
    p2pPrice: Number(p2p.price || 1000),
    p2pPaymentTimeLimit: Number(p2p.paymentTimeLimit || 10),
    p2pMakerUserName: String(p2p.makerUserName || 'P2P-Platform'),
    p2pMakerDisplayName: String(p2p.makerDisplayName || profile.channelName || 'P2P Platform'),
    p2pMinTotalDeposit: Number(p2p.minTotalDeposit || 0),
    p2pAutoReplyText: String(p2p.autoReplyText || ''),
    p2pNote: String(p2p.note || ''),
    p2pDepositBankCode: String(p2p.depositBankCode || ''),
    p2pDepositAccountNo: String(p2p.depositAccountNo || ''),
    p2pDepositAccountName: String(p2p.depositAccountName || ''),
    p2pDepositContent: String(p2p.depositContent || '')
  };
};

const clientIdentity = (route: FinanceChannelRouteVO) => {
  if (route.methodType === 'BANKS' || route.methodType === 'EWALLET') {
    return [route.bankCode || route.clientCode, route.smartpayCode].filter(Boolean).join(' / ');
  }
  if (route.methodType === 'CARD') return route.cardBrand || route.clientCode || route.routeCode;
  if (route.methodType === 'CRYPTO') {
    return [route.coinName || route.clientCode, route.networkName || route.clientSubCode].filter(Boolean).join(' / ');
  }
  if (route.methodType === 'GIFT_CARD') return route.giftCode || route.routeCode;
  if (route.methodType === 'P2P') {
    return [
      route.clientCode || route.routeCode,
      route.p2pMakerUserName || route.channelName
    ].filter(Boolean).join(' / ');
  }
  return [route.prefix || route.clientCode, route.clientSubCode].filter(Boolean).join(' / ');
};

const clientDetailSummary = (route: FinanceChannelRouteVO) => {
  if (route.methodType === 'BANKS' || route.methodType === 'EWALLET') {
    return [
      route.statementTime ? `时段 ${route.statementTime}` : '',
      route.timeLimit ? `超时 ${route.timeLimit} 分钟` : ''
    ].filter(Boolean).join('；');
  }
  if (route.methodType === 'CARD') {
    return [route.cardLabel, route.rate != null ? `兑换率 ${route.rate}` : '', route.denominations].filter(Boolean).join('；');
  }
  if (route.methodType === 'CRYPTO') {
    return [route.address, route.platformRate ? `1:${route.platformRate}` : '', route.qrData ? '已配置二维码' : '未配置二维码'].filter(Boolean).join('；');
  }
  if (route.methodType === 'P2P') {
    return [
      route.p2pPrice ? `成交价 ${route.p2pPrice} VND/${route.p2pAssetName || '币'}` : '',
      route.p2pPaymentTimeLimit ? `支付超时 ${route.p2pPaymentTimeLimit} 分钟` : '',
      route.p2pDepositAccountNo ? `收款 ${route.p2pDepositAccountName || ''} ${route.p2pDepositAccountNo}` : '未配置平台收款信息'
    ].filter(Boolean).join('；');
  }
  if (route.methodType === 'GIFT_CARD') return [route.giftName, route.jumpUrl, route.account].filter(Boolean).join('；');
  if (route.methodType === 'QUICK_PAY') {
    return [
      route.prefix ? `档位前缀 ${route.prefix}` : '',
      route.fee != null ? `充值金额 ${route.fee}` : '',
      route.bonusAmount ? `赠送金额 ${route.bonusAmount}` : '',
      route.content
    ].filter(Boolean).join('；');
  }
  return [
    route.prefix ? `平台 ${route.prefix}` : '',
    route.fee != null ? `充值 ${route.fee}` : '',
    route.bonusAmount ? `赠送 ${route.bonusAmount}` : '',
    route.accountName ? `户名 ${route.accountName}` : '',
    route.receiveNumber ? `收款 ${route.receiveNumber}` : '',
    route.content
  ]
    .filter(Boolean)
    .join('；');
};

const getGroups = async () => {
  loading.value = true;
  try {
    const [res, p2pRes, tabRes] = await Promise.all([
      listChannelGroups(queryParams),
      listWithdrawChannelProfiles({ tabCode: P2P_GROUP_CODE, platform: 'go88' }).catch(() => ({ data: [] })),
      listWithdrawTabs().catch(() => ({ data: [] }))
    ]);
    p2pProfiles.value = p2pRes.data ?? [];
    withdrawTabs.value = tabRes.data ?? [];
    const loadedGroups = [...(res.data ?? [])];
    let p2pGroup = loadedGroups.find((group) => isP2pGroup(group));
    const p2pTab = withdrawTabs.value.find((tab) => tab.tabCode === P2P_GROUP_CODE);
    if (!p2pGroup) {
      p2pGroup = {
        groupId: -1,
        groupCode: P2P_GROUP_CODE,
        groupName: 'P2P 充值',
        groupType: P2P_GROUP_TYPE,
        sortNo: 99,
        status: p2pTab?.status ?? 1,
        remark: '客户端 P2P 充值',
        routes: []
      };
      loadedGroups.push(p2pGroup);
    } else if (p2pTab) {
      p2pGroup.status = p2pTab.status;
    }
    p2pGroup.routes = p2pProfiles.value.map((profile) =>
      p2pRouteFromProfile(profile, p2pGroup!.groupId)
    );
    groups.value = loadedGroups;
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
  queryParams.methodType = undefined;
  queryParams.direction = undefined;
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
    groupId: group.groupId > 0 ? group.groupId : undefined,
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
    if (groupForm.groupCode.toUpperCase() === P2P_GROUP_CODE) {
      await syncP2pTabStatus(groupForm.status ?? 1);
    }
    modal.msgSuccess('保存成功');
    groupDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
};

const syncP2pTabStatus = async (status: number) => {
  const p2pTab = withdrawTabs.value.find((tab) => tab.tabCode === P2P_GROUP_CODE);
  if (!p2pTab || p2pTab.status === status) {
    return;
  }
  await changeWithdrawTabStatus(p2pTab.tabId, status);
  p2pTab.status = status;
};

const handleAddRoute = (group: FinanceChannelGroupVO) => {
  const methodType = methodTypeForGroup(group);
  Object.assign(routeForm, {
    ...emptyRouteForm(),
    groupId: group.groupId,
    currency: group.groupType === 4 ? 'USDT' : 'VND',
    currencyRate: group.groupType === 4 ? '' : 'VND1000:1',
    methodType,
    clientCode: '',
    clientSubCode: '',
    payoutMode: methodType === 'P2P' ? 'P2P' : 'MANUAL',
    beneficiaryType: methodType === 'P2P' ? 'P2P_BANK' : methodType === 'EWALLET' ? 'EWALLET' : 'BANK',
    platform: 'go88'
  });
  p2pOriginalProfile.value = undefined;
  routeDialog.value = true;
};

const methodTypeForGroup = (group: FinanceChannelGroupVO) => {
  const code = (group.groupCode ?? '').toUpperCase();
  if (methodOptions.some((item) => item.value === code)) return code;
  if (group.groupType === P2P_GROUP_TYPE) return 'P2P';
  return group.groupType === 4 ? 'CRYPTO' : 'BANKS';
};

const handleEditRoute = (route: FinanceChannelRouteVO) => {
  p2pOriginalProfile.value = route.methodType === 'P2P'
    ? p2pProfiles.value.find((profile) => profile.withdrawChannelId === route.withdrawChannelId)
    : undefined;
  Object.assign(routeForm, {
    routeId: route.routeId,
    withdrawChannelId: route.withdrawChannelId,
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
    blacklistEnable: route.blacklistEnable ?? 0,
    platform: route.platform ?? 'go88',
    direction: route.direction ?? 1,
    methodType: route.methodType || inferMethodType(route),
    clientCode: route.clientCode ?? '',
    clientSubCode: route.clientSubCode ?? '',
    dailyLimit: route.dailyLimit ?? 0,
    maintenanceCode: route.maintenanceCode ?? '',
    addressV1Enabled: route.addressV1Enabled ?? 1,
    addressV3Enabled: route.addressV3Enabled ?? 1,
    channelIcon: route.channelIcon ?? '',
    openTimeStart: route.openTimeStart ?? '00:00',
    openTimeEnd: route.openTimeEnd ?? '23:59',
    bankCode: route.bankCode ?? route.clientCode ?? route.routeCode,
    bankName: route.bankName ?? route.channelName,
    smartpayCode: route.smartpayCode ?? '',
    account: route.account ?? route.receiveNumber ?? '',
    receiveNumber: route.receiveNumber ?? route.account ?? '',
    accountName: route.accountName ?? '',
    statementTime: route.statementTime ?? '',
    timeLimit: route.timeLimit ?? 0,
    orderNavigate: route.orderNavigate ?? route.subSort ?? 0,
    cardBrand: route.cardBrand ?? route.clientCode ?? route.routeCode,
    cardLabel: route.cardLabel ?? route.channelName,
    denominations: route.denominations ?? '[]',
    rate: route.rate ?? 0,
    coinName: route.coinName ?? route.clientCode ?? '',
    networkName: route.networkName ?? route.clientSubCode ?? '',
    address: route.address ?? '',
    qrData: route.qrData ?? '',
    price: route.price ?? 0,
    platformRate: route.platformRate ?? route.price ?? 0,
    prefix: route.prefix ?? route.clientCode ?? route.routeCode,
    fee: route.fee ?? 0,
    bonusAmount: route.bonusAmount ?? 0,
    content: route.content ?? '',
    minAmount: route.minAmount ?? route.amountMin ?? 0,
    maxAmount: route.maxAmount ?? route.amountMax ?? 0,
    thirdPartyParams: route.thirdPartyParams ?? '',
    giftCode: route.giftCode ?? '',
    giftName: route.giftName ?? '',
    iconUrl: route.iconUrl ?? '',
    jumpUrl: route.jumpUrl ?? '',
    payoutMode: route.payoutMode ?? 'MANUAL',
    beneficiaryAddress: route.beneficiaryAddress ?? route.account ?? '',
    rateMode: route.rateMode ?? 'NONE',
    exchangeRate: route.exchangeRate ?? 1,
    feeMode: route.feeMode ?? 'NONE',
    feeFixed: route.feeFixed ?? 0,
    feeCurrency: route.feeCurrency ?? route.currency ?? 'VND',
    beneficiaryType: route.beneficiaryType ?? (route.methodType === 'P2P' ? 'P2P_BANK' : 'BANK'),
    accountPattern: route.accountPattern ?? '',
    clientFieldSchemaJson: route.clientFieldSchemaJson ?? '{}',
    channelConfigJson: route.channelConfigJson ?? '{}',
    priorityNo: route.priorityNo ?? route.subSort ?? 0,
    p2pAssetName: route.p2pAssetName ?? 'KDG',
    p2pPrice: route.p2pPrice ?? 1000,
    p2pPaymentTimeLimit: route.p2pPaymentTimeLimit ?? 10,
    p2pMakerUserName: route.p2pMakerUserName ?? 'P2P-Platform',
    p2pMakerDisplayName: route.p2pMakerDisplayName ?? route.channelName,
    p2pMinTotalDeposit: route.p2pMinTotalDeposit ?? 0,
    p2pAutoReplyText: route.p2pAutoReplyText ?? '',
    p2pNote: route.p2pNote ?? '',
    p2pDepositBankCode: route.p2pDepositBankCode ?? '',
    p2pDepositAccountNo: route.p2pDepositAccountNo ?? '',
    p2pDepositAccountName: route.p2pDepositAccountName ?? '',
    p2pDepositContent: route.p2pDepositContent ?? ''
  });
  routeDialog.value = true;
};

const inferMethodType = (route: FinanceChannelRouteVO) => {
  if (route.methodType) return route.methodType;
  if (route.qrData || route.coinName) return 'CRYPTO';
  if (route.cardBrand) return 'CARD';
  if (route.giftCode) return 'GIFT_CARD';
  if (route.prefix) return 'QUICK_PAY';
  return 'BANKS';
};

const syncQuickPayIdentity = () => {
  if (routeForm.methodType !== 'QUICK_PAY') {
    return;
  }
  const routeCode = String(routeForm.routeCode ?? '').trim().toUpperCase();
  routeForm.clientCode = routeCode;
  if (!String(routeForm.prefix ?? '').trim()) {
    routeForm.prefix = routeCode;
  }
};

const handleMethodTypeChange = () => {
  routeForm.configRefId = undefined;
  if (routeForm.methodType === 'CRYPTO') {
    routeForm.currency = routeForm.currency || 'USDT';
  } else if (routeForm.methodType === 'QUICK_PAY') {
    syncQuickPayIdentity();
  } else if (routeForm.methodType === 'P2P') {
    routeForm.payoutMode = 'P2P';
    routeForm.beneficiaryType = 'P2P_BANK';
    routeForm.currency = 'VND';
    routeForm.p2pPrice = routeForm.p2pPrice || 1000;
    routeForm.p2pPaymentTimeLimit = routeForm.p2pPaymentTimeLimit || 10;
  }
};

const submitRoute = async () => {
  const valid = await routeFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    if (routeForm.methodType === 'P2P') {
      await submitP2pRoute();
    } else {
      await saveChannelRoute({ ...routeForm });
    }
    modal.msgSuccess('保存成功');
    routeDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
};

const submitP2pRoute = async () => {
  const original = p2pOriginalProfile.value;
  const configRoot = parseChannelConfig(routeForm.channelConfigJson);
  const p2p = {
    ...configRoot.p2p,
    assetName: String(routeForm.p2pAssetName || 'KDG').trim(),
    price: Number(routeForm.p2pPrice || 0),
    paymentTimeLimit: Number(routeForm.p2pPaymentTimeLimit || 10),
    makerUserName: String(routeForm.p2pMakerUserName || '').trim(),
    makerDisplayName: String(routeForm.p2pMakerDisplayName || '').trim(),
    minTotalDeposit: Number(routeForm.p2pMinTotalDeposit || 0),
    autoReplyText: String(routeForm.p2pAutoReplyText || '').trim(),
    note: String(routeForm.p2pNote || '').trim(),
    depositBankCode: String(routeForm.p2pDepositBankCode || '').trim(),
    depositAccountNo: String(routeForm.p2pDepositAccountNo || '').trim(),
    depositAccountName: String(routeForm.p2pDepositAccountName || '').trim(),
    depositContent: String(routeForm.p2pDepositContent || '').trim()
  };
  const rateValue = Number(routeForm.exchangeRate || 1);
  const payload: WithdrawChannelProfileForm = {
    withdrawChannelId: original?.withdrawChannelId,
    channelCode: String(routeForm.routeCode || '').trim(),
    channelName: String(routeForm.channelName || '').trim(),
    platformKey: original?.platformKey ?? '',
    platformUrl: original?.platformUrl ?? '',
    iconArt: original?.iconArt ?? routeForm.channelIcon ?? '',
    tabCode: P2P_GROUP_CODE,
    platform: String(routeForm.platform || 'go88').trim(),
    payoutMode: 'P2P',
    merchantId: routeForm.merchantId,
    clientCode: String(routeForm.clientCode || routeForm.routeCode || '').trim(),
    clientSubCode: String(routeForm.clientSubCode || '').trim(),
    supportedBankCodes: original?.supportedBankCodes
      ? original.supportedBankCodes.split(',').map((code) => code.trim()).filter(Boolean)
      : [],
    currency: String(routeForm.currency || 'VND').trim(),
    settlementCurrency: original?.settlementCurrency || 'VND',
    rateFrom: Number(original?.rateFrom || rateValue),
    rateTo: Number(original?.rateTo || rateValue),
    clientPrice: Number(original?.clientPrice || rateValue),
    beneficiaryAddress: String(routeForm.account || routeForm.beneficiaryAddress || '').trim(),
    amountMin: Number(routeForm.amountMin || 0),
    amountMax: Number(routeForm.amountMax || 0),
    dailyLimit: Number(routeForm.dailyLimit || 0),
    maintenanceCode: String(routeForm.maintenanceCode || '').trim(),
    openTimeStart: routeForm.openTimeStart || '00:00',
    openTimeEnd: routeForm.openTimeEnd || '23:59',
    rateMode: original?.rateMode || 'REALTIME',
    exchangeRate: rateValue,
    feeMode: original?.feeMode || 'NONE',
    feeRate: Number(routeForm.feeRate || 0),
    feeFixed: Number(original?.feeFixed || 0),
    feeCurrency: original?.feeCurrency || 'VND',
    beneficiaryType: 'P2P_BANK',
    accountPattern: original?.accountPattern ?? '',
    clientFieldSchemaJson: original?.clientFieldSchemaJson ?? '{}',
    channelConfigJson: JSON.stringify({ ...configRoot, p2p }),
    priorityNo: Number(routeForm.priorityNo ?? routeForm.subSort ?? 0),
    sortNo: Number(routeForm.subSort || 0),
    status: Number(routeForm.status ?? 1),
    frontEnable: Number(routeForm.status ?? 1),
    remark: String(routeForm.channelRemark || '').trim()
  };
  await saveWithdrawChannelProfile(payload);
};

const handleToggleGroup = async (group: FinanceChannelGroupVO) => {
  const next = group.status === 1 ? 0 : 1;
  await modal.confirm(`确认${next === 1 ? '启用' : '停用'}大类「${group.groupName}」？`);
  if (isP2pGroup(group) && group.groupId <= 0) {
    await saveChannelGroup({
      groupCode: P2P_GROUP_CODE,
      groupName: group.groupName,
      groupType: P2P_GROUP_TYPE,
      sortNo: group.sortNo,
      status: next,
      remark: group.remark
    });
  } else {
    await changeChannelGroupStatus(group.groupId, next);
  }
  if (isP2pGroup(group)) {
    await syncP2pTabStatus(next);
  }
  modal.msgSuccess('操作成功');
  getGroups();
};

const handleSwitch = async (route: FinanceChannelRouteVO, field: string, value: number) => {
  if (route.methodType === 'P2P') {
    if (field !== 'status') {
      return;
    }
    await changeWithdrawChannelStatus(route.withdrawChannelId ?? route.routeId, value);
  } else {
    await changeChannelRouteSwitch(route.routeId, field, value);
  }
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

.client-contract-alert {
  margin-bottom: 10px;
}

.switch-pair {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-regular);
}

.qr-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.crypto-address {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.channel-icon {
  width: 32px;
  height: 32px;
}

.field-hint {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
