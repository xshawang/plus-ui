<template>
  <div class="p-2 app-container finance-withdraw-channel-page">
    <el-card shadow="hover" class="search-panel">
      <el-alert
        title="加密货币配置已合并到提现通道"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      >
        <template #default>
          虚拟币平台与资金通道分开维护：Binance、HTX、Remitano 等平台管理图标和入口；
          USDT/BEP20、USDT/TRC20 等通道管理兑换比例、限额、运营时段和维护状态。充值卡直接读取 card_config。
        </template>
      </el-alert>
      <template #header>
        <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
          <h3>筛选条件</h3>
        </div>
      </template>
      <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="提现大类">
          <el-select v-model="queryParams.tabCode" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="tab in tabs" :key="tab.tabCode" :label="tab.displayName" :value="tab.tabCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="出款模式">
          <el-select v-model="queryParams.payoutMode" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="item in payoutModes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-input v-model="queryParams.platform" placeholder="go88" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="queryParams.channelKeyword" placeholder="编号/名称/商户" clearable style="width: 190px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadProfiles">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        提现渠道使用独立路由表，不读取充值大类或充值通道路由；加密货币不再单独维护，统一在 CRYPTO/COIN12 通道中配置。
        客户端可控制：标签顺序、显示/隐藏、NEW、维护状态。不可控制：标签文字、页面字段布局、新增任意标签类型、默认标签。
        NEW 图标使用独立索引，页面按 tabCode 分别生成隐藏数组与 NEW 数组。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>提现渠道维护</h3>
            <p>标签维护开关控制整类提现渠道，展开后每个具体通道的维护开关控制该渠道。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" icon="Edit" @click="openTabs">
              编辑标签顺序与标记
            </el-button>
            <el-button icon="View" @click="showManifest">查看客户端下发值</el-button>
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openAdd()">
              新增渠道配置
            </el-button>
            <el-button icon="Refresh" @click="loadAll">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="loadProfiles" />
          </div>
        </div>
      </template>
      <el-collapse v-loading="loading || tabsLoading" v-model="activeTabCodes">
        <el-collapse-item v-for="tab in tabs" :key="tab.tabCode" :name="tab.tabCode">
          <template #title>
            <div class="group-title">
              <span class="group-name">{{ tab.displayName }}</span>
              <el-tag size="small" class="ml-2">{{ tab.tabCode }}</el-tag>
              <el-tag size="small" :type="tab.status === 1 ? 'success' : 'danger'" class="ml-2">
                {{ tab.status === 1 ? '启用' : '维护中' }}
              </el-tag>
              <el-tag size="small" :type="tab.visible === 1 ? 'primary' : 'info'" class="ml-2">
                {{ tab.visible === 1 ? '客户端显示' : '客户端隐藏' }}
              </el-tag>
              <el-tag v-if="tab.newTag === 1" size="small" type="danger" class="ml-2">NEW</el-tag>
              <span class="ml-3 text-gray-400 text-sm">排序 {{ tab.sortNo }}</span>
              <span class="ml-3 text-gray-400 text-sm">
                <template v-if="tab.tabCode === 'CRYPTO'">
                  币种 {{ clientCurrenciesByTab(tab.tabCode).length }} · 通道
                  {{ visibleChannelsByTab(tab.tabCode).length }} · 平台 {{ cryptoPlatforms.length }}
                </template>
                <template v-else-if="tab.tabCode === 'CARD'">充值卡 {{ cardConfigs.length }} 张</template>
                <template v-else>通道 {{ visibleChannelsByTab(tab.tabCode).length }} 条</template>
              </span>
              <span class="ml-4 maintenance-switch" @click.stop>
                <span class="text-gray-500 text-sm">维护开关</span>
                <el-switch
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  :model-value="tab.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(value: number) => toggleTabStatus(tab as WithdrawTabVO, value)"
                />
              </span>
            </div>
          </template>
          <div class="group-actions">
            <el-button v-hasPermi="['finance:withdrawchannel:edit']" link type="primary" @click="openTabs">
              编辑标签顺序与标记
            </el-button>
            <el-button
              v-if="tab.tabCode === 'CARD'"
              v-hasPermi="['finance:withdrawchannel:edit']"
              link
              type="primary"
              @click="openCardAdd"
            >
              新增充值卡
            </el-button>
            <el-button
              v-else
              v-hasPermi="['finance:withdrawchannel:edit']"
              link
              type="primary"
              @click="openAdd(tab.tabCode)"
            >
              {{ tab.tabCode === 'CRYPTO' ? '新增虚拟币通道' : '新增该标签渠道' }}
            </el-button>
          </div>
          <div v-if="tab.tabCode === 'CRYPTO'" class="crypto-overview">
            <div class="crypto-overview-item">
              <span class="crypto-overview-label">客户端币种</span>
              <el-tag
                v-for="currency in clientCurrenciesByTab(tab.tabCode)"
                :key="`${currency.coin}-${currency.network}`"
                type="success"
                effect="plain"
              >
                {{ currency.coin }} / {{ currency.network }}
              </el-tag>
              <span v-if="clientCurrenciesByTab(tab.tabCode).length === 0" class="text-gray-400">未配置</span>
            </div>
            <div class="crypto-overview-item">
              <span class="crypto-overview-label">虚拟币平台</span>
              <div class="platform-chip-list">
                <el-tag
                  v-for="platform in cryptoPlatforms"
                  :key="platform.name"
                  :type="platform.active ? 'success' : 'info'"
                  effect="plain"
                >
                  {{ platformMark(platform) }} {{ platform.label }} · {{ platform.name }}
                </el-tag>
                <span v-if="cryptoPlatforms.length === 0" class="text-gray-400">未配置</span>
              </div>
            </div>
          </div>
          <div v-if="tab.tabCode === 'CRYPTO'" class="platform-admin-block">
            <div class="platform-admin-heading">
              <div>
                <strong>虚拟币平台</strong>
                <span>平台仅决定客户端图标和跳转入口，不参与资金出款选路。</span>
              </div>
              <el-button
                v-hasPermi="['finance:withdrawchannel:edit']"
                type="primary"
                link
                icon="Plus"
                @click="openPlatformAdd"
              >
                新增平台
              </el-button>
            </div>
            <el-table :data="cryptoPlatforms" border size="small">
              <el-table-column label="图标 / 平台" min-width="220">
                <template #default="{ row }">
                  <div class="channel-identity">
                    <span class="channel-brand" :class="platformBrandClass(row as WithdrawCryptoPlatformVO)">
                      {{ platformMark(row as WithdrawCryptoPlatformVO) }}
                    </span>
                    <div class="channel-identity-text">
                      <div class="channel-name">{{ row.label }}</div>
                      <code>{{ row.name }}</code>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="客户端图标资源" prop="iconArt" min-width="170" show-overflow-tooltip />
              <el-table-column label="平台入口" prop="url" min-width="280" show-overflow-tooltip />
              <el-table-column label="排序" prop="sortNo" width="80" align="center" />
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.active ? 'success' : 'info'" size="small">
                    {{ row.active ? '启用' : '停用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90" align="center">
                <template #default="{ row }">
                  <el-button
                    v-hasPermi="['finance:withdrawchannel:edit']"
                    link
                    type="primary"
                    @click="openPlatformEdit(row as WithdrawCryptoPlatformVO)"
                  >
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-table
            v-if="tab.tabCode !== 'CARD'"
            border
            size="small"
            :data="visibleChannelsByTab(tab.tabCode)"
            class="data-table"
          >
            <el-table-column label="图标 / 编码 / 名称" min-width="245" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="channel-identity">
                  <span class="channel-brand" :class="brandClass(row as WithdrawChannelProfileVO)">
                    {{ brandMark(row as WithdrawChannelProfileVO) }}
                  </span>
                  <div class="channel-identity-text">
                    <div class="channel-name">{{ row.channelName }}</div>
                    <code>{{ row.channelCode }}</code>
                    <span v-if="isCryptoLikeTab(tab.tabCode) && row.clientCode" class="platform-code">
                      · {{ row.clientCode }} / {{ row.clientSubCode }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isCryptoLikeTab(tab.tabCode)"
              label="币种 / 网络"
              min-width="145"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ [row.clientCode, row.clientSubCode].filter(Boolean).join(' / ') || '未配置' }}
              </template>
            </el-table-column>
            <el-table-column v-else label="客户端标识" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                {{ [row.clientCode, row.clientSubCode].filter(Boolean).join(' / ') || '-' }}
              </template>
            </el-table-column>
            <el-table-column v-if="!isCryptoLikeTab(tab.tabCode)" label="平台入口" prop="platformKey" width="120" show-overflow-tooltip />
            <el-table-column label="商户" prop="merchantName" min-width="150" show-overflow-tooltip />
            <el-table-column label="出款模式" width="130">
              <template #default="{ row }">{{ optionLabel(payoutModes, row.payoutMode) }}</template>
            </el-table-column>
            <el-table-column label="兑换比例" width="170" align="right">
              <template #default="{ row }">
                <div v-if="isCryptoLikeTab(tab.tabCode)" class="rate-cell">
                  <div>{{ formatRateValue(row.rateFrom ?? 1) }} {{ row.currency || 'VND' }} = {{ formatRateValue(row.rateTo ?? row.clientPrice) }} {{ row.settlementCurrency }}</div>
                  <div class="text-gray-400 text-sm">{{ cryptoRateHint(row as WithdrawChannelProfileVO) }}</div>
                </div>
                <template v-else>
                  {{ formatMoney(row.rateFrom ?? 1) }} {{ row.currency || 'VND' }}
                  :
                  {{ formatMoney(row.rateTo ?? row.clientPrice) }} {{ row.settlementCurrency }}
                </template>
              </template>
            </el-table-column>
            <el-table-column label="运营时段" width="150" align="center">
              <template #default="{ row }">{{ row.openTimeStart || '00:00' }} - {{ row.openTimeEnd || '23:59' }}</template>
            </el-table-column>
            <el-table-column label="单笔限额" width="190" align="right">
              <template #default="{ row }">{{ formatMoneyRange(row.amountMin ?? 0, row.amountMax ?? 0) }}</template>
            </el-table-column>
            <el-table-column label="每日限额" width="130" align="right">
              <template #default="{ row }">{{ row.dailyLimit ? formatMoney(row.dailyLimit) : '不限' }}</template>
            </el-table-column>
            <el-table-column label="维护码" prop="maintenanceCode" width="140" />
            <el-table-column label="维护开关" width="110" align="center">
              <template #default="{ row }">
                <el-switch
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(value: number) => toggleStatus(row as WithdrawChannelProfileVO, value)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  link
                  type="primary"
                  @click="openEdit(row as WithdrawChannelProfileVO)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-table v-else :data="cardConfigs" border size="small" class="data-table">
            <el-table-column label="平台" prop="platform" width="110" />
            <el-table-column label="通道名称 / Label" min-width="210">
              <template #default="{ row }">
                <div class="channel-name">{{ row.cardLabel }}</div>
                <code>{{ row.cardBrand }}</code>
              </template>
            </el-table-column>
            <el-table-column label="面值" min-width="260">
              <template #default="{ row }">
                <div class="denomination-list">
                  <el-tag v-for="amount in parseCardDenominations(row.denominations)" :key="amount" size="small" effect="plain">
                    {{ formatMoney(amount) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="费率" width="100" align="right">
              <template #default="{ row }">{{ row.rate == null ? '—' : `${(Number(row.rate) * 100).toFixed(2)}%` }}</template>
            </el-table-column>
            <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(value: number) => toggleCardStatus(row as WithdrawCardConfigVO, value)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button
                  v-hasPermi="['finance:withdrawchannel:edit']"
                  link
                  type="primary"
                  @click="openCardEdit(row as WithdrawCardConfigVO)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog v-model="tabsDialog" title="提现标签顺序与客户端标记" width="880px" append-to-body>
      <el-alert
        title="标签文字、页面字段布局、默认标签不可由接口控制；tabsWithdrawToHide 与 tabsWithNewTagWithdraw 使用不同索引。"
        type="warning"
        :closable="false"
        class="mb-3"
      />
      <el-table :data="tabForms" border>
        <el-table-column label="标签" prop="displayName" min-width="130">
          <template #default="{ row }">
            <el-input v-model="row.displayName" />
          </template>
        </el-table-column>
        <el-table-column label="编码" prop="tabCode" width="100" />
        <el-table-column label="排序" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.sortNo" :min="1" :max="99" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="显示" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.visible" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="NEW" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.newTag" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="tabsDialog = false">取消</el-button>
        <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" :loading="submitting" @click="submitTabs">
          保存并生成下发值
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="profileDialog" :title="profileForm.withdrawChannelId ? '编辑提现渠道' : '新增提现渠道'" width="900px" append-to-body>
      <el-form ref="profileFormRef" :model="profileForm" :rules="rules" label-width="140px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="渠道编码" prop="channelCode">
              <el-input v-model="profileForm.channelCode" placeholder="唯一编码，如 BANK_VCB_01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input v-model="profileForm.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提现标签" prop="tabCode">
              <el-select v-model="profileForm.tabCode" style="width: 100%" @change="handleProfileTabChange">
                <el-option
                  v-for="tab in tabs.filter((item) => item.tabCode !== 'CARD')"
                  :key="tab.tabCode"
                  :label="tab.displayName"
                  :value="tab.tabCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台标识" prop="platform">
              <el-input v-model="profileForm.platform" placeholder="go88" />
            </el-form-item>
          </el-col>
          <el-col v-if="isCryptoLike" :span="24">
            <el-divider content-position="left">加密货币配置</el-divider>
          </el-col>
          <template v-if="isCryptoLike">
            <el-col :span="12">
              <el-form-item label="币种" prop="clientCode">
                <el-select
                  v-model="profileForm.clientCode"
                  filterable
                  allow-create
                  default-first-option
                  placeholder="如 USDT"
                  style="width: 100%"
                >
                  <el-option v-for="coin in coinOptions" :key="coin" :label="coin" :value="coin" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="网络" prop="clientSubCode">
                <el-select
                  v-model="profileForm.clientSubCode"
                  filterable
                  allow-create
                  default-first-option
                  placeholder="如 TRC20 / BEP20"
                  style="width: 100%"
                >
                  <el-option v-for="network in networkOptions" :key="network" :label="network" :value="network" />
                </el-select>
              </el-form-item>
            </el-col>
          </template>
          <template v-if="profileForm.tabCode === 'P2P'">
            <el-col :span="24">
              <el-divider content-position="left">P2P 平台自营交易配置</el-divider>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户端渠道标识" prop="clientCode">
                <el-input v-model="profileForm.clientCode" placeholder="唯一值，如 P2P_PLATFORM" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="P2P 资产">
                <el-input v-model="p2pConfig.assetName" placeholder="KDG" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成交价（VND/资产）">
                <el-input-number v-model="p2pConfig.price" :min="0.00000001" :precision="8" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="支付超时（分钟）">
                <el-input-number v-model="p2pConfig.paymentTimeLimit" :min="1" :max="1440" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易对手用户名">
                <el-input v-model="p2pConfig.makerUserName" placeholder="P2P-Platform" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易对手显示名">
                <el-input v-model="p2pConfig.makerDisplayName" placeholder="P2P 平台" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最低累计充值">
                <el-input-number v-model="p2pConfig.minTotalDeposit" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="自动回复">
                <el-input v-model="p2pConfig.autoReplyText" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="挂单备注">
                <el-input v-model="p2pConfig.note" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-alert
                title="平台作为交易对手。客户端读取的挂单价格取“成交价”，资金扣款按 KCoin 数量 × 成交价换算为 VND；上方兑换比例只用于提现结算快照。"
                type="info"
                :closable="false"
                show-icon
              />
            </el-col>
          </template>
          <template v-if="profileForm.tabCode === 'COIN12'">
            <el-col :span="24">
              <el-divider content-position="left">Coin12 客户端展示配置</el-divider>
            </el-col>
            <el-col :span="24">
              <el-form-item label="横幅图片">
                <el-input v-model="coin12Config.bannerUrl" placeholder="/banner/Coin12_bannerRUT_4.png" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="横幅跳转地址">
                <el-input v-model="coin12Config.urlOpenBanner" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开户引导地址">
                <el-input v-model="coin12Config.urlHelpCreateAcc" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="充值引导地址">
                <el-input v-model="coin12Config.urlHelpDeposit" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="提现引导地址">
                <el-input v-model="coin12Config.urlHelpWithdraw" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-alert
                title="上方单笔最低/最高会同步到客户端 Coin12 限额；钱包地址由会员本人提交，不在渠道中保存。客户端币种符号和 1:1 文案由当前预制体固定。"
                type="info"
                :closable="false"
                show-icon
              />
            </el-col>
          </template>
          <el-col v-if="profileForm.tabCode === 'BANK'" :span="24">
            <el-form-item label="支持银行">
              <el-select
                v-model="profileForm.supportedBankCodes"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入银行编码后回车"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出款模式" prop="payoutMode">
              <el-select v-model="profileForm.payoutMode" style="width: 100%">
                <el-option v-for="item in payoutModes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算币种" prop="settlementCurrency">
              <el-input
                v-model="profileForm.settlementCurrency"
                :disabled="isCryptoLike"
                placeholder="VND / USDT / COIN12"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="兑换比例（平台币→结算币）" prop="rateTo">
              <div class="flex items-center gap-2">
                <el-input-number v-model="profileForm.rateFrom" :min="0.00000001" :precision="8" />
                <span>{{ profileForm.currency || '平台币' }} =</span>
                <el-input-number v-model="profileForm.rateTo" :min="0.00000001" :precision="8" />
                <span>{{ profileForm.settlementCurrency || 'USDT' }}</span>
              </div>
              <div v-if="isCryptoLike && ratePreview" class="rate-preview">{{ ratePreview }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最低">
              <el-input-number v-model="profileForm.amountMin" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最高（0不限）">
              <el-input-number v-model="profileForm.amountMax" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日限额（0不限）">
              <el-input-number v-model="profileForm.dailyLimit" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col v-if="profileForm.tabCode === 'P2P'" :span="24">
            <el-form-item label="P2P 收款信息">
              <el-input v-model="profileForm.beneficiaryAddress" placeholder="P2P 渠道收款信息" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营开始时间">
              <el-time-picker
                v-model="profileForm.openTimeStart"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营结束时间">
              <el-time-picker
                v-model="profileForm.openTimeEnd"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费模式" prop="feeMode">
              <el-select v-model="profileForm.feeMode" style="width: 100%">
                <el-option v-for="item in feeModes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费比例(%)" prop="feeRate">
              <el-input-number v-model="profileForm.feeRate" :min="0" :precision="6" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费币种" prop="feeCurrency">
              <el-input v-model="profileForm.feeCurrency" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款类型" prop="beneficiaryType">
              <el-select v-model="profileForm.beneficiaryType" style="width: 100%">
                <el-option
                  v-for="item in beneficiaryTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="profileForm.priorityNo" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="profileForm.sortNo" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="profileForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="profileDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="platformDialog" :title="platformForm.originalName ? '编辑虚拟币平台' : '新增虚拟币平台'" width="620px" append-to-body>
      <el-form :model="platformForm" label-width="130px">
        <el-form-item label="平台编码" required>
          <el-input v-model="platformForm.name" placeholder="如 binance / houbi / remitano" :disabled="Boolean(platformForm.originalName)" />
        </el-form-item>
        <el-form-item label="显示名称" required>
          <el-input v-model="platformForm.label" placeholder="如 Binance / HTX / Remitano" />
        </el-form-item>
        <el-form-item label="客户端图标资源">
          <el-select v-model="platformForm.iconArt" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="icon in cryptoIconOptions" :key="icon" :label="icon" :value="icon" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台入口">
          <el-input v-model="platformForm.url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="platformForm.sortNo" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="platformForm.active" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="platformDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPlatforms">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cardDialog" :title="cardForm.id ? '编辑充值卡' : '新增充值卡'" width="680px" append-to-body>
      <el-form :model="cardForm" label-width="120px">
        <el-form-item label="平台" required>
          <el-input v-model="cardForm.platform" placeholder="go88" />
        </el-form-item>
        <el-form-item label="通道编码" required>
          <el-input v-model="cardForm.cardBrand" placeholder="如 VIETTEL / MOBIFONE" />
        </el-form-item>
        <el-form-item label="Label" required>
          <el-input v-model="cardForm.cardLabel" placeholder="如 Thẻ Viettel" />
        </el-form-item>
        <el-form-item label="面值 JSON" required>
          <el-input v-model="cardForm.denominations" placeholder="[50000,100000,200000]" />
        </el-form-item>
        <el-form-item label="费率">
          <el-input-number v-model="cardForm.rate" :min="0" :max="1" :precision="2" :step="0.01" style="width: 100%" />
          <div class="text-gray-400 text-sm">0.86 表示按面值的 86% 计价。</div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="cardForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="cardForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cardDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCard">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="manifestDialog" title="客户端提现配置下发值" width="720px" append-to-body>
      <el-input :model-value="manifestText" type="textarea" :rows="20" readonly />
    </el-dialog>
  </div>
</template>

<script setup name="FinanceWithdrawChannel" lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import type {
  WithdrawCardConfigForm,
  WithdrawCardConfigVO,
  WithdrawChannelProfileForm,
  WithdrawChannelProfileVO,
  WithdrawChannelQuery,
  WithdrawCryptoPlatformForm,
  WithdrawCryptoPlatformVO,
  WithdrawTabForm,
  WithdrawTabVO
} from '@/api/finance/withdraw-channel/types';
import {
  changeWithdrawTabStatus,
  changeWithdrawChannelStatus,
  getWithdrawClientManifest,
  listWithdrawCardConfigs,
  listWithdrawChannelProfiles,
  listWithdrawCryptoPlatforms,
  listWithdrawTabs,
  saveWithdrawCardConfig,
  saveWithdrawChannelProfile,
  saveWithdrawCryptoPlatforms,
  saveWithdrawTabs
} from '@/api/finance/withdraw-channel';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { formatMoney, formatMoneyRange } from '@/utils/money';

const payoutModes = [
  { label: '人工出款', value: 'MANUAL' },
  { label: '三方代付', value: 'THIRD_PARTY' },
  { label: 'P2P 交易所', value: 'P2P' },
  { label: '币商/Coin12', value: 'COIN_EXCHANGE' }
];
const rateModes = [
  { label: '不需要', value: 'NONE' },
  { label: '固定汇率', value: 'FIXED' },
  { label: '实时汇率', value: 'REALTIME' },
  { label: '三方报价', value: 'PROVIDER_QUOTE' }
];
const feeModes = [
  { label: '无手续费', value: 'NONE' },
  { label: '按比例', value: 'RATE' }
];
const beneficiaryTypes = [
  { label: '银行账户', value: 'BANK' },
  { label: '充值卡', value: 'CARD' },
  { label: '链上地址', value: 'CRYPTO_ADDRESS' },
  { label: 'P2P 银行账户', value: 'P2P_BANK' }
];

const tabs = ref<WithdrawTabVO[]>([]);
const tabForms = ref<WithdrawTabForm[]>([]);
const profiles = ref<WithdrawChannelProfileVO[]>([]);
const cryptoPlatforms = ref<WithdrawCryptoPlatformVO[]>([]);
const cardConfigs = ref<WithdrawCardConfigVO[]>([]);
const activeTabCodes = ref<string[]>([]);
const tabsDialog = ref(false);
const profileDialog = ref(false);
const platformDialog = ref(false);
const cardDialog = ref(false);
const manifestDialog = ref(false);
const manifestText = ref('');
const submitting = ref(false);
const tabsLoading = ref(false);
const profileFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();

const defaultP2pConfig = () => ({
  assetName: 'KDG',
  price: 1000,
  paymentTimeLimit: 10,
  makerUserName: 'P2P-Platform',
  makerDisplayName: 'P2P 平台',
  minTotalDeposit: 1000000,
  note: '',
  autoReplyText: ''
});

const defaultCoin12Config = () => ({
  bannerUrl: '/banner/Coin12_bannerRUT_4.png',
  urlOpenBanner: 'https://coin12.com',
  urlHelpCreateAcc: 'https://coin12.com',
  urlHelpDeposit: 'https://coin12.com',
  urlHelpWithdraw: 'https://coin12.com'
});

const p2pConfig = reactive(defaultP2pConfig());
const coin12Config = reactive(defaultCoin12Config());
const channelConfigRoot = ref<Record<string, unknown>>({});

const defaultPlatformForm = (): WithdrawCryptoPlatformForm & { originalName?: string } => ({
  originalName: undefined,
  name: '',
  label: '',
  iconArt: '',
  url: '',
  active: true,
  sortNo: 1
});
const platformForm = reactive(defaultPlatformForm());

const defaultCardForm = (): WithdrawCardConfigForm => ({
  id: undefined,
  platform: 'go88',
  cardBrand: '',
  cardLabel: '',
  denominations: '[]',
  rate: 1,
  sortOrder: 0,
  status: 1
});
const cardForm = reactive(defaultCardForm());

const defaultProfile = (): WithdrawChannelProfileForm => ({
  channelCode: '',
  channelName: '',
  platformKey: '',
  platformUrl: '',
  iconArt: '',
  tabCode: 'BANK',
  platform: 'go88',
  payoutMode: 'MANUAL',
  merchantId: undefined,
  clientCode: '',
  clientSubCode: '',
  supportedBankCodes: [],
  currency: 'VND',
  settlementCurrency: 'VND',
  rateFrom: 1,
  rateTo: 1,
  clientPrice: 1,
  beneficiaryAddress: '',
  amountMin: 0,
  amountMax: 0,
  dailyLimit: 0,
  maintenanceCode: '',
  openTimeStart: '00:00',
  openTimeEnd: '23:59',
  rateMode: 'NONE',
  exchangeRate: 1,
  feeMode: 'NONE',
  feeRate: 0,
  feeFixed: 0,
  feeCurrency: 'VND',
  beneficiaryType: 'BANK',
  accountPattern: '',
  clientFieldSchemaJson: '{}',
  channelConfigJson: '{}',
  priorityNo: 0,
  sortNo: 0,
  status: 1,
  frontEnable: 1,
  remark: ''
});

const queryParams = reactive<WithdrawChannelQuery>({
  tabCode: undefined,
  platform: undefined,
  payoutMode: undefined,
  channelKeyword: ''
});
const profileForm = reactive<WithdrawChannelProfileForm>(defaultProfile());
const rules: FormRules = {
  channelCode: [{ required: true, message: '请输入渠道编码', trigger: 'blur' }],
  channelName: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  tabCode: [{ required: true, message: '请选择提现标签', trigger: 'change' }],
  platform: [{ required: true, message: '请输入平台标识', trigger: 'blur' }],
  payoutMode: [{ required: true, message: '请选择出款模式', trigger: 'change' }],
  currency: [{ required: true, message: '请输入原始币种', trigger: 'blur' }],
  settlementCurrency: [{ required: true, message: '请输入结算币种', trigger: 'blur' }],
  clientPrice: [
    { required: true, message: '请输入兑换比例', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) <= 0) callback(new Error('兑换比例必须大于 0'));
        else callback();
      },
      trigger: 'blur'
    }
  ],
  clientCode: [
    {
      validator: (_rule, value, callback) => {
        if (isCryptoLike.value && profileForm.tabCode === 'CRYPTO' && !String(value || '').trim()) {
          callback(new Error('请输入币种'));
        } else if (profileForm.tabCode === 'P2P' && !String(value || '').trim()) {
          callback(new Error('请输入客户端渠道标识'));
        } else callback();
      },
      trigger: 'change'
    }
  ],
  clientSubCode: [
    {
      validator: (_rule, value, callback) => {
        if (isCryptoLike.value && profileForm.tabCode === 'CRYPTO' && !String(value || '').trim()) {
          callback(new Error('请输入网络'));
        } else callback();
      },
      trigger: 'change'
    }
  ],
  rateTo: [
    {
      validator: (_rule, _value, callback) => {
        if (Number(profileForm.rateFrom) <= 0 || Number(profileForm.rateTo) <= 0) {
          callback(new Error('兑换比例左右值必须大于 0'));
        } else callback();
      },
      trigger: 'change'
    }
  ],
  rateMode: [{ required: true, message: '请选择汇率模式', trigger: 'change' }],
  feeMode: [{ required: true, message: '请选择手续费模式', trigger: 'change' }],
  beneficiaryType: [{ required: true, message: '请选择收款类型', trigger: 'change' }]
};

const optionLabel = (options: Array<{ label: string; value: string }>, value: string) =>
  options.find((item) => item.value === value)?.label ?? value;
const formatRateValue = (value: unknown) =>
  Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 8 });

const isCryptoLikeTab = (tabCode?: string) => tabCode === 'CRYPTO' || tabCode === 'COIN12';
const isCryptoLike = computed(() => isCryptoLikeTab(profileForm.tabCode));
const cryptoIconOptions = ['Icon_Binance', 'Icon_Houbi', 'Icon_Remitano', 'Icon_Coin12', 'Icon_Bybit', 'Icon_OKX'];
const coinOptions = computed(() =>
  [...new Set(['USDT', ...profiles.value
    .filter((profile) => isCryptoLikeTab(profile.tabCode))
    .map((profile) => profile.clientCode)
    .filter((value): value is string => Boolean(value))])]
);
const networkOptions = computed(() =>
  [...new Set(['TRC20', 'BEP20', ...profiles.value
    .filter((profile) => isCryptoLikeTab(profile.tabCode))
    .map((profile) => profile.clientSubCode)
    .filter((value): value is string => Boolean(value))])]
);
const ratePreview = computed(() => {
  const rateFrom = Number(profileForm.rateFrom);
  const rateTo = Number(profileForm.rateTo);
  if (rateFrom <= 0 || rateTo <= 0) return '';
  const platformAmount = rateFrom / rateTo;
  const settlement = (profileForm.settlementCurrency || profileForm.clientCode || '结算币').toUpperCase();
  const platformCurrency = (profileForm.currency || 'VND').toUpperCase();
  return `1 ${settlement} ≈ ${formatMoney(platformAmount)} ${platformCurrency}`;
});

const loadTabs = async () => {
  tabsLoading.value = true;
  try {
    const res = await listWithdrawTabs();
    tabs.value = res.data ?? [];
    if (activeTabCodes.value.length === 0) {
      activeTabCodes.value = tabs.value.slice(0, 2).map((tab) => tab.tabCode);
    }
  } finally {
    tabsLoading.value = false;
  }
};

const loadProfiles = async () => {
  await withLoading(async () => {
    const res = await listWithdrawChannelProfiles({ ...queryParams });
    profiles.value = res.data ?? [];
  });
};

const loadCryptoPlatforms = async () => {
  const res = await listWithdrawCryptoPlatforms();
  cryptoPlatforms.value = res.data ?? [];
};

const loadCardConfigs = async () => {
  const res = await listWithdrawCardConfigs('go88');
  cardConfigs.value = res.data ?? [];
};

const loadAll = async () => {
  await Promise.all([loadTabs(), loadProfiles(), loadCryptoPlatforms(), loadCardConfigs()]);
};

const resetQuery = () => {
  queryParams.tabCode = undefined;
  queryParams.payoutMode = undefined;
  queryParams.platform = undefined;
  queryParams.channelKeyword = '';
  loadProfiles();
};

const openTabs = () => {
  tabForms.value = tabs.value.map((tab) => ({
    tabId: tab.tabId,
    tabCode: tab.tabCode,
    displayName: tab.displayName,
    sortNo: tab.sortNo,
    visible: tab.visible,
    newTag: tab.newTag,
    isDefault: tab.isDefault,
    remark: tab.remark
  }));
  tabsDialog.value = true;
};

const submitTabs = async () => {
  submitting.value = true;
  try {
    const res = await saveWithdrawTabs(tabForms.value);
    manifestText.value = JSON.stringify(res.data, null, 2);
    modal.msgSuccess('标签配置已保存');
    tabsDialog.value = false;
    await loadTabs();
  } finally {
    submitting.value = false;
  }
};

const showManifest = async () => {
  const res = await getWithdrawClientManifest();
  manifestText.value = JSON.stringify(res.data, null, 2);
  manifestDialog.value = true;
};

const channelsByTab = (tabCode: string) =>
  profiles.value.filter((profile) => profile.tabCode === tabCode);
const visibleChannelsByTab = (tabCode: string) => {
  const rows = channelsByTab(tabCode);
  if (tabCode === 'CARD') return [];
  if (tabCode === 'CRYPTO') {
    return rows.filter((profile) => Boolean(profile.clientCode) && !profile.platformKey);
  }
  return rows;
};
const clientCurrenciesByTab = (tabCode: string) => {
  const unique = new Map<string, { coin: string; network: string }>();
  for (const profile of visibleChannelsByTab(tabCode)) {
    const coin = profile.clientCode || profile.settlementCurrency || '';
    const network = profile.clientSubCode || '';
    if (!coin) continue;
    unique.set(`${coin}/${network}`, { coin, network });
  }
  return [...unique.values()];
};
const brandMark = (profile: WithdrawChannelProfileVO) => {
  if (profile.tabCode === 'CRYPTO' && profile.clientCode) {
    return profile.clientCode.toUpperCase() === 'USDT' ? '₮' : profile.clientCode.slice(0, 1).toUpperCase();
  }
  return (profile.channelName || profile.channelCode || '?').slice(0, 1).toUpperCase();
};
const platformMark = (platform: WithdrawCryptoPlatformVO) => {
  const key = `${platform.iconArt || ''} ${platform.name || ''}`.toLowerCase();
  if (key.includes('binance')) return '◆';
  if (key.includes('houbi') || key.includes('htx')) return 'H';
  if (key.includes('remitano')) return 'R';
  if (key.includes('coin12')) return '12';
  if (key.includes('bybit')) return 'B';
  if (key.includes('okx')) return 'O';
  return (platform.label || platform.name || '?').slice(0, 1).toUpperCase();
};
const brandClass = (profile: WithdrawChannelProfileVO) => {
  if (profile.tabCode === 'CRYPTO') return profile.clientCode?.toUpperCase() === 'USDT' ? 'brand-usdt' : 'brand-default';
  const key = `${profile.iconArt || ''} ${profile.platformKey || ''}`.toLowerCase();
  if (key.includes('binance')) return 'brand-binance';
  if (key.includes('houbi') || key.includes('htx')) return 'brand-htx';
  if (key.includes('remitano')) return 'brand-remitano';
  if (key.includes('coin12')) return 'brand-coin12';
  if (key.includes('bybit')) return 'brand-bybit';
  return 'brand-default';
};
const platformBrandClass = (platform: WithdrawCryptoPlatformVO) => {
  const key = `${platform.iconArt || ''} ${platform.name || ''}`.toLowerCase();
  if (key.includes('binance')) return 'brand-binance';
  if (key.includes('houbi') || key.includes('htx')) return 'brand-htx';
  if (key.includes('remitano')) return 'brand-remitano';
  if (key.includes('coin12')) return 'brand-coin12';
  if (key.includes('bybit')) return 'brand-bybit';
  return 'brand-default';
};
const cryptoRateHint = (profile: WithdrawChannelProfileVO) => {
  const from = Number(profile.rateFrom ?? 0);
  const to = Number(profile.rateTo ?? profile.clientPrice ?? 0);
  if (from <= 0 || to <= 0) return '比例未配置';
  return `1 ${profile.settlementCurrency || profile.clientCode || 'USDT'} ≈ ${formatMoney(from / to)} ${profile.currency || 'VND'}`;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const resetChannelExtras = () => {
  Object.assign(p2pConfig, defaultP2pConfig());
  Object.assign(coin12Config, defaultCoin12Config());
  channelConfigRoot.value = {};
};

const loadChannelExtras = (json?: string) => {
  resetChannelExtras();
  try {
    const root = asRecord(JSON.parse(json || '{}'));
    channelConfigRoot.value = root;
    Object.assign(p2pConfig, defaultP2pConfig(), asRecord(root.p2p));
    Object.assign(coin12Config, defaultCoin12Config(), asRecord(root.coin12));
  } catch {
    resetChannelExtras();
  }
};

const buildChannelConfigJson = () =>
  JSON.stringify({
    ...channelConfigRoot.value,
    p2p: { ...p2pConfig },
    coin12: { ...coin12Config }
  });

const openAdd = (tabCode?: string) => {
  Object.assign(profileForm, defaultProfile());
  resetChannelExtras();
  if (tabCode) {
    profileForm.tabCode = tabCode;
    if (tabCode === 'CRYPTO') {
      Object.assign(profileForm, {
        clientCode: 'USDT',
        clientSubCode: 'TRC20',
        settlementCurrency: 'USDT',
        beneficiaryType: 'CRYPTO_ADDRESS',
        channelCode: 'CRYPTO_USDT_TRC20',
        channelName: 'USDT-TRC20'
      });
    } else if (tabCode === 'COIN12') {
      Object.assign(profileForm, {
        clientCode: 'COIN12',
        clientSubCode: '',
        settlementCurrency: 'COIN12',
        beneficiaryType: 'CRYPTO_ADDRESS',
        rateFrom: 1000,
        rateTo: 1,
        amountMin: 200000,
        amountMax: 1000000000
      });
    } else if (tabCode === 'P2P') {
      Object.assign(profileForm, {
        clientCode: 'P2P_PLATFORM',
        settlementCurrency: 'VND',
        payoutMode: 'P2P',
        beneficiaryType: 'P2P_BANK',
        rateFrom: 1,
        rateTo: 1
      });
    }
  }
  profileDialog.value = true;
};

const openEdit = (row: WithdrawChannelProfileVO) => {
  loadChannelExtras(row.channelConfigJson);
  Object.assign(profileForm, {
    withdrawChannelId: row.withdrawChannelId,
    channelCode: row.channelCode,
    channelName: row.channelName,
    platformKey: row.platformKey ?? '',
    platformUrl: row.platformUrl ?? '',
    iconArt: row.iconArt ?? '',
    tabCode: row.tabCode,
    platform: row.platform,
    payoutMode: row.payoutMode,
    merchantId: row.merchantId,
    clientCode: row.clientCode ?? '',
    clientSubCode: row.clientSubCode ?? '',
    supportedBankCodes: row.supportedBankCodes
      ? row.supportedBankCodes
          .split(',')
          .map((code) => code.trim())
          .filter(Boolean)
      : [],
    currency: row.currency,
    settlementCurrency: row.settlementCurrency,
    rateFrom: Number(row.rateFrom ?? 1),
    rateTo: Number(row.rateTo ?? row.exchangeRate ?? row.clientPrice),
    clientPrice: Number(row.clientPrice ?? 0),
    beneficiaryAddress: row.beneficiaryAddress ?? '',
    amountMin: row.amountMin ?? 0,
    amountMax: row.amountMax ?? 0,
    dailyLimit: row.dailyLimit ?? 0,
    maintenanceCode: row.maintenanceCode ?? '',
    openTimeStart: row.openTimeStart || '00:00',
    openTimeEnd: row.openTimeEnd || '23:59',
    rateMode: row.rateMode,
    exchangeRate: Number(row.exchangeRate),
    feeMode: row.feeMode,
    feeRate: Number(row.feeRate),
    feeFixed: Number(row.feeFixed),
    feeCurrency: row.settlementCurrency,
    beneficiaryType: row.beneficiaryType,
    accountPattern: row.accountPattern ?? '',
    clientFieldSchemaJson: row.clientFieldSchemaJson ?? '{}',
    channelConfigJson: row.channelConfigJson ?? '{}',
    priorityNo: row.priorityNo ?? 0,
    sortNo: row.sortNo ?? 0,
    status: row.status,
    frontEnable: row.frontEnable,
    remark: row.remark ?? ''
  });
  profileDialog.value = true;
};

const submitProfile = async () => {
  const rateFrom = Number(profileForm.rateFrom);
  const rateTo = Number(profileForm.rateTo);
  profileForm.clientPrice = rateFrom > 0 && rateTo > 0 ? rateTo / rateFrom : 0;
  profileForm.exchangeRate = profileForm.clientPrice;
  profileForm.frontEnable = profileForm.status;
  if (isCryptoLike.value) {
    profileForm.clientCode = String(profileForm.clientCode || '').trim().toUpperCase();
    profileForm.clientSubCode = String(profileForm.clientSubCode || '').trim().toUpperCase();
    profileForm.platformKey = '';
    profileForm.platformUrl = '';
    profileForm.iconArt = '';
  }
  profileForm.clientCode = String(profileForm.clientCode || '').trim().toUpperCase();
  if (profileForm.tabCode === 'P2P' && Number(p2pConfig.price) <= 0) {
    modal.msgError('P2P 成交价必须大于 0');
    return;
  }
  const valid = await profileFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    await saveWithdrawChannelProfile({
      ...profileForm,
      channelConfigJson: buildChannelConfigJson()
    });
    modal.msgSuccess('提现渠道配置已保存');
    profileDialog.value = false;
    await loadProfiles();
  } finally {
    submitting.value = false;
  }
};

const handleProfileTabChange = (tabCode: string) => {
  if (tabCode === 'CRYPTO') {
    profileForm.beneficiaryType = 'CRYPTO_ADDRESS';
    if (!profileForm.clientCode) profileForm.clientCode = 'USDT';
    if (!profileForm.clientSubCode) profileForm.clientSubCode = 'TRC20';
    if (!profileForm.settlementCurrency || profileForm.settlementCurrency === 'VND') {
      profileForm.settlementCurrency = 'USDT';
    }
  } else if (tabCode === 'COIN12') {
    profileForm.beneficiaryType = 'CRYPTO_ADDRESS';
    profileForm.clientCode = profileForm.clientCode || 'COIN12';
    profileForm.settlementCurrency = 'COIN12';
    profileForm.rateFrom = profileForm.rateFrom || 1000;
    profileForm.rateTo = profileForm.rateTo || 1;
  } else if (tabCode === 'BANK') {
    profileForm.beneficiaryType = 'BANK';
  } else if (tabCode === 'CARD') {
    profileForm.beneficiaryType = 'CARD';
  } else if (tabCode === 'P2P') {
    profileForm.clientCode = profileForm.clientCode || 'P2P_PLATFORM';
    profileForm.beneficiaryType = 'P2P_BANK';
    profileForm.settlementCurrency = 'VND';
    profileForm.payoutMode = 'P2P';
  }
};

watch(
  () => profileForm.settlementCurrency,
  (value) => {
    profileForm.feeCurrency = (value || 'VND').toUpperCase();
  }
);

const toggleStatus = async (row: WithdrawChannelProfileVO, status: number) => {
  await changeWithdrawChannelStatus(row.withdrawChannelId, status);
  modal.msgSuccess(status === 1 ? '渠道维护已解除' : '渠道已进入维护');
  await loadProfiles();
};

const toggleTabStatus = async (tab: WithdrawTabVO, status: number) => {
  await changeWithdrawTabStatus(tab.tabId, status);
  modal.msgSuccess(status === 1 ? '提现标签维护已解除' : '提现标签已进入维护');
  await loadAll();
};

const openPlatformAdd = () => {
  Object.assign(platformForm, defaultPlatformForm(), {
    sortNo: cryptoPlatforms.value.length + 1
  });
  platformDialog.value = true;
};

const openPlatformEdit = (row: WithdrawCryptoPlatformVO) => {
  Object.assign(platformForm, {
    originalName: row.name,
    name: row.name,
    label: row.label,
    iconArt: row.iconArt ?? '',
    url: row.url ?? '',
    active: row.active,
    sortNo: row.sortNo
  });
  platformDialog.value = true;
};

const submitPlatforms = async () => {
  const name = String(platformForm.name || '').trim().toLowerCase();
  const label = String(platformForm.label || '').trim();
  if (!name || !label) {
    modal.msgWarning('平台编码和显示名称不能为空');
    return;
  }
  const values = cryptoPlatforms.value.map((row) => ({ ...row }));
  const payload: WithdrawCryptoPlatformForm = {
    name,
    label,
    iconArt: String(platformForm.iconArt || '').trim(),
    url: String(platformForm.url || '').trim(),
    active: platformForm.active,
    sortNo: Number(platformForm.sortNo || 1)
  };
  if (platformForm.originalName) {
    const index = values.findIndex((row) => row.name === platformForm.originalName);
    if (index < 0) {
      modal.msgWarning('平台配置不存在，请刷新后重试');
      return;
    }
    values[index] = payload;
  } else {
    if (values.some((row) => row.name === name)) {
      modal.msgWarning('平台编码已存在');
      return;
    }
    values.push(payload);
  }
  submitting.value = true;
  try {
    const res = await saveWithdrawCryptoPlatforms(values);
    cryptoPlatforms.value = res.data ?? [];
    platformDialog.value = false;
    modal.msgSuccess('虚拟币平台配置已保存');
  } finally {
    submitting.value = false;
  }
};

const parseCardDenominations = (value?: string): number[] => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter((amount) => Number.isFinite(amount)) : [];
  } catch {
    return [];
  }
};

const openCardAdd = () => {
  Object.assign(cardForm, defaultCardForm(), {
    sortOrder: cardConfigs.value.length + 1
  });
  cardDialog.value = true;
};

const openCardEdit = (row: WithdrawCardConfigVO) => {
  Object.assign(cardForm, {
    id: row.id,
    platform: row.platform,
    cardBrand: row.cardBrand,
    cardLabel: row.cardLabel,
    denominations: row.denominations || '[]',
    rate: Number(row.rate ?? 1),
    sortOrder: row.sortOrder ?? 0,
    status: row.status
  });
  cardDialog.value = true;
};

const submitCard = async () => {
  const cardBrand = String(cardForm.cardBrand || '').trim().toUpperCase();
  const cardLabel = String(cardForm.cardLabel || '').trim();
  const denominations = parseCardDenominations(cardForm.denominations);
  if (!cardBrand || !cardLabel || denominations.length === 0) {
    modal.msgWarning('请完整填写通道编码、Label 和面值');
    return;
  }
  submitting.value = true;
  try {
    await saveWithdrawCardConfig({
      ...cardForm,
      platform: String(cardForm.platform || 'go88').trim(),
      cardBrand,
      cardLabel,
      denominations: JSON.stringify(denominations)
    });
    cardDialog.value = false;
    modal.msgSuccess('充值卡配置已保存');
    await loadCardConfigs();
  } finally {
    submitting.value = false;
  }
};

const toggleCardStatus = async (row: WithdrawCardConfigVO, status: number) => {
  await saveWithdrawCardConfig({ ...row, status });
  modal.msgSuccess(status === 1 ? '充值卡已启用' : '充值卡已停用');
  await loadCardConfigs();
};

loadAll();
</script>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.group-name {
  font-weight: 600;
}

.group-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.maintenance-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.crypto-address {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.rate-preview {
  margin-top: 6px;
  color: var(--el-color-primary);
  font-size: 12px;
}

.crypto-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
}

.crypto-overview-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.crypto-overview-label {
  color: var(--el-text-color-secondary);
}

.platform-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.platform-admin-block {
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.platform-admin-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.platform-admin-heading div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.platform-admin-heading strong {
  color: var(--el-text-color-primary);
}

.denomination-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.channel-identity {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.channel-identity-text {
  min-width: 0;
  line-height: 1.45;
}

.channel-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-identity code,
.platform-code {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.channel-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 2px 6px rgb(0 0 0 / 12%);
}

.brand-binance {
  background: #f3ba2f;
  color: #111;
}

.brand-htx {
  background: linear-gradient(145deg, #1677ff, #18b6e7);
}

.brand-remitano {
  background: #8c4dff;
}

.brand-coin12 {
  background: #f58a22;
}

.brand-bybit {
  background: #f7a600;
  color: #111;
}

.brand-default {
  background: var(--el-color-info);
}

.brand-usdt {
  background: #26a17b;
}

.rate-cell {
  line-height: 1.45;
}
</style>
