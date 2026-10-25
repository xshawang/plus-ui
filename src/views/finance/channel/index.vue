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
            <el-option label="数字货币" :value="4" />
            <el-option label="礼品卡" :value="5" />
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
              <span class="ml-3 text-gray-400 text-sm">通道 {{ (group.routes || []).length }} 条</span>
            </div>
          </template>
          <div class="group-actions">
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleEditGroup(group)">修改大类</el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleToggleGroup(group)">
              {{ group.status === 1 ? '停用大类' : '启用大类' }}
            </el-button>
            <el-button v-hasPermi="['finance:channel:edit']" link type="primary" @click="handleAddRoute(group)">新增通道</el-button>
          </div>
          <el-table :data="filterRoutes(group)" border size="small">
            <el-table-column label="通道编号" prop="routeCode" align="center" width="120" />
            <el-table-column label="通道名称" prop="channelName" align="left" min-width="150" show-overflow-tooltip />
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
            <el-table-column label="排序" prop="subSort" align="center" width="70" />
            <el-table-column label="所属商户" prop="merchantName" align="left" min-width="170" show-overflow-tooltip />
            <el-table-column label="平台" prop="platform" align="center" width="80" />
            <el-table-column label="方向" align="center" width="80">
              <template #default="{ row }">{{ row.direction === 2 ? '提现' : '充值' }}</template>
            </el-table-column>
            <el-table-column label="支付方式" align="center" width="110">
              <template #default="{ row }">{{ methodLabel(row.methodType) }}</template>
            </el-table-column>
            <el-table-column label="客户端标识" align="left" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ clientIdentity(row as FinanceChannelRouteVO) }}</template>
            </el-table-column>
            <el-table-column label="客户端下发值" align="left" min-width="230" show-overflow-tooltip>
              <template #default="{ row }">{{ clientDetailSummary(row as FinanceChannelRouteVO) }}</template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" align="center" width="80" />
            <el-table-column label="费率(%)" prop="feeRate" align="right" width="90" />
            <el-table-column label="成功率(%)" prop="successRate" align="right" width="100" />
            <el-table-column label="单笔限额" align="right" width="180">
              <template #default="{ row }">{{ formatMoneyRange(row.amountMin ?? 0, row.amountMax ?? 0) }}</template>
            </el-table-column>
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
            <el-table-column label="通道合并" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.mergeFlag"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleSwitch(row as FinanceChannelRouteVO, 'mergeFlag', val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="充值黑名单" align="center" width="110">
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
                <el-button v-hasPermi="['finance:channel:edit']" link type="danger" @click="handleDeleteRoute(row as FinanceChannelRouteVO)">删除</el-button>
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
            <el-option label="数字货币" :value="4" />
            <el-option label="礼品卡" :value="5" />
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
              <el-input v-model="routeForm.routeCode" placeholder="如 TRC20 / QR3 / Momo 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道名称" prop="channelName">
              <el-input v-model="routeForm.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台标识" prop="platform">
              <el-input v-model="routeForm.platform" placeholder="go88" />
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
          <el-col :span="12">
            <el-form-item label="客户端编码">
              <el-input v-model="routeForm.clientCode" placeholder="银行编码 / 卡品牌 / 币种 / 快捷前缀" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
              <el-form-item label="银行/渠道编码">
                <el-input v-model="routeForm.bankCode" placeholder="如 VCB / MOMO" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="银行/渠道名称">
                <el-input v-model="routeForm.bankName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="SmartPay编码">
                <el-input v-model="routeForm.smartpayCode" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款账号">
                <el-input v-model="routeForm.account" placeholder="客户端 account 字段" />
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
            <el-divider content-position="left">数字货币客户端明细</el-divider>
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
              <el-form-item label="虚拟币兑平台币">
                <el-input-number v-model="routeForm.platformRate" :min="0" controls-position="right" style="width: 100%" />
                <span class="field-hint">如 1 USDT = 1000 平台币</span>
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
              <el-form-item label="档位前缀">
                <el-input v-model="routeForm.prefix" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="充值金额">
                <el-input-number v-model="routeForm.fee" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="赠送金额">
                <el-input-number v-model="routeForm.bonusAmount" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款标识">
                <el-input v-model="routeForm.receiveNumber" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款账户名">
                <el-input v-model="routeForm.accountName" />
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

const methodOptions = [
  { label: '银行转账', value: 'BANKS' },
  { label: '充值卡', value: 'CARD' },
  { label: '电子钱包', value: 'EWALLET' },
  { label: '数字货币', value: 'CRYPTO' },
  { label: '快捷充值', value: 'QUICK_PAY' },
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
  jumpUrl: ''
});

const routeForm = reactive<FinanceChannelRouteForm>(emptyRouteForm());

const groupRules: FormRules = {
  groupCode: [{ required: true, message: '大类编码不能为空', trigger: 'blur' }],
  groupName: [{ required: true, message: '大类名称不能为空', trigger: 'blur' }]
};

const routeRules: FormRules = {
  groupId: [{ required: true, message: '所属大类不能为空', trigger: 'change' }],
  routeCode: [{ required: true, message: '通道编号不能为空', trigger: 'blur' }],
  channelName: [{ required: true, message: '通道名称不能为空', trigger: 'blur' }],
  methodType: [{ required: true, message: '客户端支付方式不能为空', trigger: 'change' }],
  platform: [{ required: true, message: '平台标识不能为空', trigger: 'blur' }]
};

/** 大类关键字过滤（后端已支持，前端再兜一层以便本地即时反馈） */
const filteredGroups = computed(() => groups.value);

const routeTotal = computed(() => groups.value.reduce((sum, group) => sum + (group.routes?.length ?? 0), 0));

/** 通道关键字过滤：作用于当前大类内的通道列表 */
const filterRoutes = (group: FinanceChannelGroupVO): FinanceChannelRouteVO[] => {
  const routes = group.routes ?? [];
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

const clientIdentity = (route: FinanceChannelRouteVO) => {
  if (route.methodType === 'BANKS' || route.methodType === 'EWALLET') {
    return [route.bankCode || route.clientCode, route.smartpayCode].filter(Boolean).join(' / ');
  }
  if (route.methodType === 'CARD') return route.cardBrand || route.clientCode || route.routeCode;
  if (route.methodType === 'CRYPTO') {
    return [route.coinName || route.clientCode, route.networkName || route.clientSubCode].filter(Boolean).join(' / ');
  }
  if (route.methodType === 'GIFT_CARD') return route.giftCode || route.routeCode;
  return [route.prefix || route.clientCode, route.clientSubCode].filter(Boolean).join(' / ');
};

const clientDetailSummary = (route: FinanceChannelRouteVO) => {
  if (route.methodType === 'BANKS' || route.methodType === 'EWALLET') {
    return [
      route.account ? `账号 ${route.account}` : '',
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
  if (route.methodType === 'GIFT_CARD') return [route.giftName, route.jumpUrl, route.account].filter(Boolean).join('；');
  return [route.fee != null ? `充值 ${route.fee}` : '', route.bonusAmount ? `赠送 ${route.bonusAmount}` : '', route.receiveNumber]
    .filter(Boolean)
    .join('；');
};

const getGroups = async () => {
  loading.value = true;
  try {
    const res = await listChannelGroups(queryParams);
    groups.value = res.data ?? [];
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
    groupId: group.groupId,
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
    modal.msgSuccess('保存成功');
    groupDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
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
    clientSubCode: ''
  });
  routeDialog.value = true;
};

const methodTypeForGroup = (group: FinanceChannelGroupVO) => {
  const code = (group.groupCode ?? '').toUpperCase();
  if (methodOptions.some((item) => item.value === code)) return code;
  return group.groupType === 4 ? 'CRYPTO' : 'BANKS';
};

const handleEditRoute = (route: FinanceChannelRouteVO) => {
  Object.assign(routeForm, {
    routeId: route.routeId,
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
    jumpUrl: route.jumpUrl ?? ''
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

const handleMethodTypeChange = () => {
  routeForm.configRefId = undefined;
  if (routeForm.methodType === 'CRYPTO') {
    routeForm.currency = routeForm.currency || 'USDT';
  }
};

const submitRoute = async () => {
  const valid = await routeFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await saveChannelRoute({ ...routeForm });
    modal.msgSuccess('保存成功');
    routeDialog.value = false;
    getGroups();
  } finally {
    submitting.value = false;
  }
};

const handleToggleGroup = async (group: FinanceChannelGroupVO) => {
  const next = group.status === 1 ? 0 : 1;
  await modal.confirm(`确认${next === 1 ? '启用' : '停用'}大类「${group.groupName}」？`);
  await changeChannelGroupStatus(group.groupId, next);
  modal.msgSuccess('操作成功');
  getGroups();
};

const handleSwitch = async (route: FinanceChannelRouteVO, field: string, value: number) => {
  await changeChannelRouteSwitch(route.routeId, field, value);
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
