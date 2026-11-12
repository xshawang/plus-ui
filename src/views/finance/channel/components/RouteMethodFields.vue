<template>
  <!-- 按客户端支付方式切换的明细字段（从原 index.vue 子通道弹窗拆出，字段与落库逻辑不变）；单根节点为项目 check-transition 约定 -->
  <el-row :gutter="12">
  <template v-if="form.methodType === 'BANKS' || form.methodType === 'EWALLET'">
    <el-col :span="24"><el-divider content-position="left">银行 / 电子钱包客户端明细</el-divider></el-col>
    <el-col :span="12"><el-form-item label="收款账号"><el-input v-model="form.account" placeholder="客户端 account_no / SĐT" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="收款户名"><el-input v-model="form.accountName" placeholder="客户端 account_name / Tên TK" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="客户端通道编码"><el-input v-model="form.bankCode" placeholder="如 VCB / MOMO" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="客户端通道名称"><el-input v-model="form.bankName" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="SmartPay编码"><el-input v-model="form.smartpayCode" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="在线时段"><el-input v-model="form.statementTime" placeholder="如 08:00-22:00" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="超时分钟"><el-input-number v-model="form.timeLimit" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="客户端排序"><el-input-number v-model="form.orderNavigate" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="固定手续费"><el-input-number v-model="form.fee" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="固定赠送"><el-input-number v-model="form.bonusAmount" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="24">
      <el-form-item label="第三方参数"><el-input v-model="form.thirdPartyParams" type="textarea" :rows="2" placeholder="JSON 扩展参数" /></el-form-item>
    </el-col>
  </template>

  <template v-if="form.methodType === 'P2P'">
    <el-col :span="24"><el-divider content-position="left">P2P 充值平台与客户端展示</el-divider></el-col>
    <el-col :span="12"><el-form-item label="交易对手用户名"><el-input v-model="form.p2pMakerUserName" placeholder="p2p-6585612" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="交易对手显示名"><el-input v-model="form.p2pMakerDisplayName" placeholder="P2P Platform" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="成交价（VND/币）">
        <el-input-number v-model="form.p2pPrice" :min="0.00000001" :precision="8" controls-position="right" class="w-full" />
      </el-form-item>
    </el-col>
    <el-col :span="12"><el-form-item label="P2P 资产名称"><el-input v-model="form.p2pAssetName" placeholder="KDG" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="支付超时（分钟）">
        <el-input-number v-model="form.p2pPaymentTimeLimit" :min="1" :max="1440" controls-position="right" class="w-full" />
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="最低累计充值"><el-input-number v-model="form.p2pMinTotalDeposit" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="12"><el-form-item label="平台收款银行编码"><el-input v-model="form.p2pDepositBankCode" placeholder="客户端 toBankCode" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="平台收款账号"><el-input v-model="form.p2pDepositAccountNo" placeholder="客户端 toAccountNo" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="平台收款户名"><el-input v-model="form.p2pDepositAccountName" placeholder="客户端 toAccountName" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="转账内容模板"><el-input v-model="form.p2pDepositContent" placeholder="如 P2P-{orderNo}" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="挂单自动回复"><el-input v-model="form.p2pAutoReplyText" /></el-form-item></el-col>
    <el-col :span="24"><el-form-item label="挂单备注"><el-input v-model="form.p2pNote" type="textarea" :rows="2" /></el-form-item></el-col>
  </template>

  <template v-if="form.methodType === 'CARD'">
    <el-col :span="24"><el-divider content-position="left">充值卡客户端明细</el-divider></el-col>
    <el-col :span="12"><el-form-item label="卡品牌"><el-input v-model="form.cardBrand" placeholder="VIETTEL / MOBIFONE" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="卡片标签"><el-input v-model="form.cardLabel" placeholder="Thẻ Viettel" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="兑换率">
        <el-input-number v-model="form.rate" :min="0" :max="1" :step="0.01" :precision="4" controls-position="right" class="w-full" />
      </el-form-item>
    </el-col>
    <el-col :span="24">
      <el-form-item label="可选面额"><el-input v-model="form.denominations" placeholder="JSON数组，如 [50000,100000,200000]" /></el-form-item>
    </el-col>
  </template>

  <template v-if="form.methodType === 'CRYPTO'">
    <el-col :span="24"><el-divider content-position="left">加密货币配置（crypto_config）</el-divider></el-col>
    <el-col :span="12"><el-form-item label="币种"><el-input v-model="form.coinName" placeholder="USDT" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="网络"><el-input v-model="form.networkName" placeholder="BEP20 / TRC20" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="平台价格（平台币/币）">
        <el-input-number v-model="form.platformRate" :min="0" controls-position="right" class="w-full" />
        <span class="field-hint">同时写入 crypto_config.price 和 platform_rate</span>
      </el-form-item>
    </el-col>
    <el-col :span="24"><el-form-item label="收款地址"><el-input v-model="form.address" /></el-form-item></el-col>
    <el-col :span="24">
      <el-form-item label="二维码图片">
        <div class="stack">
          <image-upload v-model="form.qrData" value-mode="url" :limit="1" />
          <el-input v-model="form.qrData" placeholder="也可直接填写图片URL" />
        </div>
      </el-form-item>
    </el-col>
  </template>

  <template v-if="form.methodType === 'QUICK_PAY'">
    <el-col :span="24"><el-divider content-position="left">快捷充值档位明细</el-divider></el-col>
    <el-col :span="12">
      <el-form-item label="客户端平台标识" prop="clientCode">
        <el-input v-model="form.clientCode" placeholder="FASTPAY / SNAPQR / 1PAY / TAPSCAN" />
        <span class="field-hint">下发字段 bankcode，必须与通道编码一致</span>
      </el-form-item>
    </el-col>
    <el-col :span="12"><el-form-item label="档位前缀" prop="prefix"><el-input v-model="form.prefix" placeholder="通常与通道编码一致" /></el-form-item></el-col>
    <el-col :span="12">
      <el-form-item label="收款账户号" prop="receiveNumber"><el-input v-model="form.receiveNumber" placeholder="客户端显示为 Số TK，不是户名" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="收款账户名" prop="accountName"><el-input v-model="form.accountName" placeholder="客户端显示为 Tên TK" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="充值金额（VND）"><el-input-number v-model="form.fee" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="赠送金额（VND）"><el-input-number v-model="form.bonusAmount" :min="0" controls-position="right" class="w-full" /></el-form-item>
    </el-col>
    <el-col :span="24"><el-form-item label="档位内容"><el-input v-model="form.content" /></el-form-item></el-col>
  </template>

  <template v-if="form.methodType === 'GIFT_CARD'">
    <el-col :span="24"><el-divider content-position="left">礼品卡客户端明细</el-divider></el-col>
    <el-col :span="12"><el-form-item label="礼品卡编码"><el-input v-model="form.giftCode" placeholder="FACEBOOK" /></el-form-item></el-col>
    <el-col :span="12"><el-form-item label="礼品卡名称"><el-input v-model="form.giftName" placeholder="Facebook Gift Card" /></el-form-item></el-col>
    <el-col :span="24"><el-form-item label="礼品卡图标"><image-upload v-model="form.iconUrl" value-mode="url" :limit="1" /></el-form-item></el-col>
    <el-col :span="24"><el-form-item label="跳转地址"><el-input v-model="form.jumpUrl" placeholder="https://..." /></el-form-item></el-col>
    <el-col :span="24"><el-form-item label="礼品卡账户"><el-input v-model="form.account" /></el-form-item></el-col>
  </template>
  </el-row>
</template>

<script setup lang="ts">
import type { FinanceChannelRouteForm } from '@/api/finance/channel/types';

/** 父组件传入 reactive 表单对象，本组件只编辑其字段 */
const form = defineModel<FinanceChannelRouteForm>({ required: true });
</script>

<style scoped>
.w-full {
  width: 100%;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.field-hint {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
