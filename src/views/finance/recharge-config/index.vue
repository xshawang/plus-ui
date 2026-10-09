<template>
  <div class="p-2 app-container finance-recharge-config-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>充值设置</h3>
            <p>充值页优惠展示 / 页面展示 / 通知 / 填写信息 / 提示弹窗 / 数字货币充值 / 在线充值 / 转账充值 / 提现设置</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:recharge-config:edit']" type="primary" :loading="saving" @click="handleSave">
              保存当前分组
            </el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeGroup" tab-position="left" class="h-full" @tab-change="handleTabChange">
        <el-tab-pane v-for="group in groups" :key="group.key" :label="group.label" :name="group.key">
          <el-alert :title="group.tip" type="info" :closable="false" class="mb-3" />
          <el-form v-loading="loading" label-width="240px">
            <el-form-item v-for="control in group.controls" :key="control.key" :label="control.label">
              <el-switch
                v-if="control.type === 'switch'"
                v-model="values[control.key] as number"
                :active-value="1"
                :inactive-value="0"
              />
              <el-input-number
                v-else-if="control.type === 'number'"
                v-model="values[control.key] as number"
                :min="0"
                :max="1000000000"
                controls-position="right"
                style="width: 220px"
              />
              <el-radio-group v-else-if="control.type === 'radio'" v-model="values[control.key] as string">
                <el-radio v-for="option in control.options || []" :key="option.value" :value="option.value">
                  {{ option.label }}
                </el-radio>
              </el-radio-group>
              <el-select v-else-if="control.type === 'select'" v-model="values[control.key] as string" style="width: 340px">
                <el-option
                  v-for="option in control.options || []"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <RechargeTabsEditor v-else-if="control.type === 'tabs'" v-model="values[control.key] as string" />
              <el-input
                v-else
                v-model="values[control.key] as string"
                :style="{ width: control.wide ? '460px' : '340px' }"
              />
              <span v-if="control.suffix" class="ml-2 text-gray-400 text-sm">{{ currencySuffix }}</span>
              <span class="ml-2 text-gray-400 text-sm">{{ descMap[control.key] }}</span>
            </el-form-item>
          </el-form>
          <!-- 按汇率转为数字货币充值：币种 × 数字货币 勾选矩阵（专用读写端点，不参与上方键值表单保存） -->
          <CryptoConvertMatrix v-if="group.key === 'finance-recharge-crypto'" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="FinanceRechargeConfig" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import RechargeTabsEditor from '../components/RechargeTabsEditor.vue';
import CryptoConvertMatrix from '../components/CryptoConvertMatrix.vue';
import {
  listCryptoConfig,
  listFormConfig,
  listNotifyConfig,
  listPageDisplayConfig,
  listPopupConfig,
  listPromoConfig,
  getCryptoMatrixOptions,
  listRechargeSettingConfig,
  listTransferSettingConfig,
  listWithdrawSettingConfig,
  saveCryptoConfig,
  saveFormConfig,
  saveNotifyConfig,
  savePageDisplayConfig,
  savePopupConfig,
  savePromoConfig,
  saveRechargeSettingConfig,
  saveTransferSettingConfig,
  saveWithdrawSettingConfig
} from '@/api/finance/recharge-config';
import type { ConfigBatchForm, ConfigItemVO } from '@/api/member/config/types';

/**
 * 财务-充值设置页（需求文档 2_财务/01、06、07、11）。
 *
 * 背景：九个设置分组结构一致（键值 + 中文说明），差异只在控件形态；
 * （「客服代充-设置」已按需求迁到 客服代充 → 代充配置 页签的工具条入口，见 CsChannelConfigPanel.vue）
 * 值口径与 SQL 种子保持一致——开关存 "0"/"1"，枚举/文本存原始字符串，数值存十进制字符串。
 *
 * 2026-10-09 按运营后台参照页补齐差异：新增 radio/tabs 控件形态，
 * 补「弹窗频率/充值默认选项/充值页签/首充·充值最低金额」，数字货币页签换成勾选矩阵子组件。
 */
type ControlType = 'switch' | 'select' | 'radio' | 'number' | 'text' | 'tabs';

interface Control {
  key: string;
  label: string;
  type: ControlType;
  wide?: boolean;
  /** 数值后缀提示（如最低金额后面跟会员币种比例 VND1000:1） */
  suffix?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface Group {
  key: string;
  label: string;
  tip: string;
  loader: () => Promise<unknown>;
  saver: (data: ConfigBatchForm) => Promise<unknown>;
  controls: Control[];
}

const groups: Group[] = [
  {
    key: 'finance-recharge-promo',
    label: '充值页优惠活动展示设置',
    tip: '控制玩家端充值页优惠赠送面板、优惠展示规则与优惠面板位置。',
    loader: listPromoConfig,
    saver: savePromoConfig,
    controls: [
      { key: 'promo_panel_enabled', label: '显示优惠赠送面板', type: 'switch' },
      { key: 'promo_recommend_bonus', label: '推荐金额显示赠送', type: 'switch' },
      { key: 'promo_input_bonus', label: '金额输入框下显示赠送', type: 'switch' },
      {
        key: 'promo_rule',
        label: '充值优惠展示规则',
        type: 'select',
        options: [
          { label: '按活动', value: 'ACTIVITY' },
          { label: '按阶梯', value: 'TIER' }
        ]
      },
      {
        key: 'promo_option_style',
        label: '充值优惠选项样式',
        type: 'select',
        options: [
          { label: '菜单栏', value: 'MENU' },
          { label: '迷你下拉', value: 'MINI_DROP' },
          { label: '平铺', value: 'FLAT' },
          { label: '底部浮窗', value: 'BOTTOM_FLOAT' }
        ]
      },
      {
        key: 'promo_panel_position',
        label: '优惠面板显示位置',
        type: 'select',
        options: [
          { label: '金额输入框下方', value: 'BELOW' },
          { label: '金额输入框上方', value: 'ABOVE' }
        ]
      },
      {
        key: 'promo_detail_show',
        label: '充值详情页展示优惠',
        type: 'select',
        options: [
          { label: '展示', value: 'SHOW' },
          { label: '隐藏', value: 'HIDE' }
        ]
      }
    ]
  },
  {
    key: 'finance-recharge-page',
    label: '充值页面展示设置',
    tip: '控制充值通道分配依据、气泡展示值、按钮形态、布局行数与金额填写顺序。',
    loader: listPageDisplayConfig,
    saver: savePageDisplayConfig,
    controls: [
      {
        key: 'channel_assign_type',
        label: '充值通道分配',
        type: 'select',
        options: [
          { label: '按会员层级分配', value: 'MEMBER_LEVEL' },
          { label: '按VIP等级分配', value: 'VIP' },
          { label: '按会员标签分配', value: 'TAG' }
        ]
      },
      {
        key: 'bubble_show_value',
        label: '充值气泡展示值',
        type: 'select',
        options: [
          { label: '通道赠送+推荐加赠', value: 'CHANNEL_AND_RECOMMEND' },
          { label: '只展示通道赠送', value: 'CHANNEL' },
          { label: '只展示推荐加赠', value: 'RECOMMEND' },
          { label: '只展示理论最高值', value: 'MAX' }
        ]
      },
      {
        key: 'recharge_button_display',
        label: '充值按钮展示',
        type: 'select',
        options: [
          { label: '吸底展示', value: 'STICKY' },
          { label: '平铺展示', value: 'FLAT' }
        ]
      },
      {
        key: 'scroll_bottom_button',
        label: '一键滚动底部按钮',
        type: 'select',
        options: [
          { label: '显示悬浮按钮', value: 'SHOW' },
          { label: '隐藏悬浮按钮', value: 'HIDE' }
        ]
      },
      {
        key: 'recharge_button_light',
        label: '充值按钮点亮状态',
        type: 'select',
        options: [
          { label: '输入金额后点亮', value: 'INPUT_AMOUNT' },
          { label: '始终点亮', value: 'ALWAYS' }
        ]
      },
      {
        key: 'recharge_page_form',
        label: '充值页面形式',
        type: 'select',
        options: [
          { label: '浮动弹窗', value: 'FLOAT_POPUP' },
          { label: '全屏页面', value: 'FULL_PAGE' }
        ]
      },
      {
        key: 'recharge_page_style',
        label: '充值页样式',
        type: 'select',
        options: [
          { label: '平铺(默认)', value: 'FLAT' },
          { label: '下拉', value: 'DROP' }
        ]
      },
      {
        key: 'group_layout',
        label: '大类通道布局',
        type: 'select',
        options: [
          { label: '长方形布局', value: 'RECT' },
          { label: '正方形布局', value: 'SQUARE' }
        ]
      },
      { key: 'default_group_rows', label: '默认大类/通道行数', type: 'number' },
      {
        key: 'group_expand',
        label: '大类展开收起',
        type: 'select',
        options: [
          { label: '默认收起', value: 'COLLAPSE' },
          { label: '默认展开', value: 'EXPAND' }
        ]
      },
      {
        key: 'channel_expand',
        label: '通道展开收起',
        type: 'select',
        options: [
          { label: '默认收起', value: 'COLLAPSE' },
          { label: '默认展开', value: 'EXPAND' }
        ]
      },
      {
        key: 'amount_input_order',
        label: '填写金额设置',
        type: 'select',
        options: [
          { label: '先填金额后选通道(推荐)', value: 'AMOUNT_FIRST' },
          { label: '先选通道后填金额', value: 'CHANNEL_FIRST' }
        ]
      },
      {
        key: 'recommend_amount_position',
        label: '推荐金额位置',
        type: 'select',
        options: [
          { label: '推荐金额在金额输入框下方', value: 'BELOW' },
          { label: '推荐金额在金额输入框上方', value: 'ABOVE' }
        ]
      },
      // 参照页「充值默认选项」：上次使用通道 / 第一个推荐
      {
        key: 'recharge_default_option',
        label: '充值默认选项',
        type: 'radio',
        options: [
          { label: '上次使用通道', value: 'LAST_CHANNEL' },
          { label: '第一个推荐', value: 'FIRST_RECOMMEND' }
        ]
      },
      // 参照页「充值页签」：可勾选启用 + 可改名 + 可排序（存 JSON 数组）
      { key: 'recharge_tabs', label: '充值页签', type: 'tabs' }
    ]
  },
  {
    key: 'finance-recharge-notify',
    label: '充值通知设置',
    tip: '控制充值通知弹窗样式与充值成功极光推送（需先配置推送模板，开启后才生效）。',
    loader: listNotifyConfig,
    saver: saveNotifyConfig,
    controls: [
      {
        key: 'notify_style',
        label: '充值通知弹窗样式',
        type: 'select',
        options: [
          { label: '顶部悬浮窗', value: 'TOP_FLOAT' },
          { label: '弹窗(需手动关闭)', value: 'POPUP' }
        ]
      },
      { key: 'notify_style_duration', label: '顶部悬浮窗自动消失(秒)', type: 'number' },
      { key: 'notify_update_enabled', label: '充值通知更新通知', type: 'switch' },
      { key: 'aurora_push_enabled', label: '充值成功极光推送开关', type: 'switch' },
      { key: 'aurora_template_code', label: '极光推送模板编码', type: 'text', wide: true }
    ]
  },
  {
    key: 'finance-recharge-form',
    label: '会员充值填写信息设置',
    tip: '控制会员充值过程中可放弃优惠、实名信息填充以及付款人钱包地址/转账凭证采集。',
    loader: listFormConfig,
    saver: saveFormConfig,
    controls: [
      { key: 'allow_give_up_promo', label: '是否允许会员放弃优惠', type: 'switch' },
      {
        key: 'realname_limit',
        label: '真实姓名/身份证限制',
        type: 'select',
        options: [
          { label: '自动填充历史充值姓名且可修改', value: 'HISTORY_EDITABLE' },
          { label: '自动填充本人姓名且不可修改(合规)', value: 'SELF_LOCKED' }
        ]
      },
      // 参照图6：合规最低金额（后缀展示会员币种比例，如 VND1000:1）
      { key: 'min_first_recharge_amount', label: '首充最低金额(合规)', type: 'number', suffix: true },
      { key: 'min_recharge_amount', label: '充值最低金额(合规)', type: 'number', suffix: true },
      { key: 'form_payer_wallet', label: '付款人钱包地址填写(0/1/2)', type: 'number' },
      { key: 'form_transfer_voucher', label: '上传转账凭证填写(0/1/2)', type: 'number' }
    ]
  },
  {
    key: 'finance-recharge-popup',
    label: '充值提示弹窗设置',
    tip: '控制进入充值页/创建订单/充值失败时的提示弹窗。',
    loader: listPopupConfig,
    saver: savePopupConfig,
    controls: [
      // 参照图2：把"是否弹窗 + 频率"合并成一个五选一；保存时由频率反推 popup_enabled（NEVER=0，其余=1）
      {
        key: 'popup_freq',
        label: '弹窗提示',
        type: 'radio',
        options: [
          { label: '不弹窗', value: 'NEVER' },
          { label: '首次弹一次', value: 'FIRST_ONCE' },
          { label: '每天首次弹一次', value: 'DAILY_FIRST' },
          { label: '每次都弹一次', value: 'EVERY_TIME' },
          { label: '每隔N天提示一次', value: 'EVERY_N_DAYS' }
        ]
      },
      { key: 'popup_interval_days', label: '每隔天数(N)', type: 'number' },
      {
        key: 'popup_scene',
        label: '充值提示弹窗场景',
        type: 'select',
        options: [
          { label: '进入充值页前', value: 'BEFORE_RECHARGE' },
          { label: '创建订单后', value: 'AFTER_CREATE' },
          { label: '充值失败', value: 'ON_FAIL' }
        ]
      },
      { key: 'popup_content', label: '充值提示弹窗文案', type: 'text', wide: true }
    ]
  },
  {
    key: 'finance-recharge-crypto',
    label: '按汇率转为数字货币充值',
    tip: '控制数字货币充值入口与汇率来源（汇率明细见"汇率与银行管理"）。',
    loader: listCryptoConfig,
    saver: saveCryptoConfig,
    controls: [
      { key: 'crypto_enabled', label: '数字货币充值总开关', type: 'switch' },
      { key: 'crypto_show_rate', label: '展示汇率', type: 'switch' },
      { key: 'crypto_default_currency', label: '默认币种代码', type: 'text' },
      {
        key: 'crypto_rate_source',
        label: '汇率来源',
        type: 'select',
        options: [
          { label: '手工维护', value: 'MANUAL' },
          { label: '自动同步', value: 'AUTO' }
        ]
      }
    ]
  },
  {
    key: 'finance-recharge-setting',
    label: '在线充值-充值设置',
    tip: '在线充值全局风控：订单超时、频控、并行笔数、三方回调异常策略、大额上分拦截与每日加赠上限。',
    loader: listRechargeSettingConfig,
    saver: saveRechargeSettingConfig,
    controls: [
      { key: 'order_expire_minutes', label: '订单有效时间(分钟)', type: 'number' },
      { key: 'front_bonus_badge', label: '前台赠送角标开关', type: 'switch' },
      { key: 'apply_freq_minutes', label: '充值申请频率-时间窗口(分钟)', type: 'number' },
      { key: 'apply_freq_times', label: '充值申请频率-最大次数', type: 'number' },
      { key: 'parallel_order_limit', label: '可同时并行充值笔数(0=不限)', type: 'number' },
      { key: 'payer_wallet_show', label: '付款人地址开启前台展示', type: 'switch' },
      { key: 'payer_wallet_required', label: '付款人地址强制填写', type: 'switch' },
      {
        key: 'callback_after_expire',
        label: '订单超时后三方回调',
        type: 'select',
        options: [
          { label: '不再接收三方回调', value: 'REJECT' },
          { label: '接收三方回调', value: 'RECEIVE' }
        ]
      },
      {
        key: 'callback_low_amount',
        label: '回调金额偏低',
        type: 'select',
        options: [
          { label: '自动按实际金额上分', value: 'AUTO_CREDIT' },
          { label: '超过比例不自动上分', value: 'MANUAL' }
        ]
      },
      {
        key: 'callback_high_amount',
        label: '回调金额偏高',
        type: 'select',
        options: [
          { label: '自动按实际金额上分', value: 'AUTO_CREDIT' },
          { label: '超过比例不自动上分', value: 'MANUAL' }
        ]
      },
      { key: 'credit_limit_amount', label: '上分金额超限门槛', type: 'number' },
      { key: 'daily_bonus_limit', label: '每日充值赠送上限', type: 'number' },
      { key: 'turnover_default_principal', label: '默认层级-本金稽核倍数', type: 'text' },
      { key: 'turnover_default_bonus', label: '默认层级-奖金稽核倍数', type: 'text' },
      { key: 'manual_adjust_audit_enabled', label: '人工加扣款走二级审核', type: 'switch' },
      { key: 'manual_adjust_audit_amount', label: '人工加扣款审核门槛', type: 'number' }
    ]
  },
  {
    key: 'finance-transfer-setting',
    label: '转账充值-充值设置',
    tip: '人工转账充值全局参数：稽核倍数、订单有效期、频控/并发、付款人地址与凭证、倒计时、语音通知、锁定审核与每日赠送上限。',
    loader: listTransferSettingConfig,
    saver: saveTransferSettingConfig,
    controls: [
      { key: 'turnover_default_principal', label: '默认层级-本金稽核倍数', type: 'text' },
      { key: 'turnover_default_bonus', label: '默认层级-奖金稽核倍数', type: 'text' },
      { key: 'order_expire_minutes', label: '订单有效时间(分钟)', type: 'number' },
      { key: 'front_bonus_badge', label: '前台赠送角标开关', type: 'switch' },
      { key: 'apply_freq_minutes', label: '充值申请频率-时间窗口(分钟)', type: 'number' },
      { key: 'apply_freq_times', label: '充值申请频率-最大次数', type: 'number' },
      { key: 'parallel_order_limit', label: '可同时并行充值笔数(0=不限)', type: 'number' },
      { key: 'payer_wallet_show', label: '付款人钱包地址开启前台展示', type: 'switch' },
      { key: 'payer_wallet_required', label: '付款人钱包地址强制填写', type: 'switch' },
      { key: 'voucher_show', label: '上传转账凭证开启前台展示', type: 'switch' },
      { key: 'voucher_required', label: '会员必须上传转账凭证', type: 'switch' },
      { key: 'transfer_countdown_seconds', label: '会员转账倒计时(秒)', type: 'number' },
      { key: 'audit_voice_notify', label: '转账审核语音通知', type: 'switch' },
      { key: 'backend_lock_order', label: '后台锁定转账订单', type: 'switch' },
      { key: 'remark_switch', label: '转账附言开关', type: 'switch' },
      { key: 'daily_bonus_limit', label: '每日充值赠送上限', type: 'number' }
    ]
  },
  {
    key: 'finance-withdraw-setting',
    label: '提现设置',
    tip: '提现风控自动审核、免审出款、每日提现次数、手续费、三方代付开关与大额提现告警门槛。',
    loader: listWithdrawSettingConfig,
    saver: saveWithdrawSettingConfig,
    controls: [
      { key: 'auto_audit_enabled', label: '风控自动审核开关', type: 'switch' },
      { key: 'auto_audit_amount', label: '风控自动审核金额门槛', type: 'number' },
      { key: 'no_audit_amount', label: '免审出款金额上限', type: 'number' },
      { key: 'day_withdraw_times', label: '每日提现次数上限(0=不限)', type: 'number' },
      { key: 'withdraw_fee_rate', label: '提现手续费率(%)', type: 'text' },
      { key: 'withdraw_fee_min', label: '提现手续费最低', type: 'number' },
      { key: 'order_expire_minutes', label: '订单有效时间(分钟)', type: 'number' },
      { key: 'payee_third_enabled', label: '三方代付开关', type: 'switch' },
      { key: 'large_amount_threshold', label: '大额提现告警门槛', type: 'number' },
      { key: 'withdraw_to_recharge_enabled', label: '提现转充值开关', type: 'switch' }
    ]
  }
];

const activeGroup = ref(groups[0].key);
const loading = ref(false);
const saving = ref(false);
/** 会员币种比例后缀（如 VND1000:1）：取平台默认启用币种，用于「首充/充值最低金额」右侧提示 */
const currencySuffix = ref('');
const values = reactive<Record<string, number | string>>({});
const descMap = reactive<Record<string, string>>({});

const currentGroup = () => groups.find((group) => group.key === activeGroup.value) as Group;

/** 加载当前分组：后端返回原始字符串，开关归一化为 0/1，其余保持原值。 */
const load = async () => {
  const group = currentGroup();
  loading.value = true;
  try {
    const res = (await group.loader()) as { data?: ConfigItemVO[] };
    const byKey = new Map((res.data ?? []).map((item) => [item.configKey, item]));
    group.controls.forEach((control) => {
      const item = byKey.get(control.key);
      descMap[control.key] = item?.configDesc ?? '';
      const raw = item?.configValue ?? '';
      if (control.type === 'switch') {
        values[control.key] = Number(raw) === 1 ? 1 : 0;
      } else if (control.type === 'number') {
        values[control.key] = Number(raw || 0);
      } else {
        values[control.key] = raw;
      }
    });
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const group = currentGroup();
  const items = group.controls.map((control) => ({
    configKey: control.key,
    configValue: String(values[control.key] ?? '')
  }));
  // 弹窗频率与总开关联动：不做成两个开关，保存时按频率反推 popup_enabled（NEVER=不弹窗=0，其余=1），
  // 这样老的 popup_enabled 键仍然准确，客户端只需读一个总开关即可短路。
  if (group.key === 'finance-recharge-popup') {
    items.push({ configKey: 'popup_enabled', configValue: values.popup_freq === 'NEVER' ? '0' : '1' });
  }
  saving.value = true;
  try {
    await group.saver({ items });
    modal.msgSuccess('保存成功');
    await load();
  } finally {
    saving.value = false;
  }
};

const handleTabChange = () => {
  load();
};

load();

/**
 * 取会员币种比例后缀（参照页在最低金额右侧展示「VND1000:1」）。
 *
 * 为什么复用数字货币矩阵的数据源：币种清单与比例来自 sys_currency_config，
 * 矩阵端点已经把它和字典一起返回，无需再新增一个只读接口。
 */
onMounted(async () => {
  try {
    const res = await getCryptoMatrixOptions();
    const currencies = res.data?.currencies ?? [];
    const preferred = currencies.find((item) => item.masterSwitch === 1) ?? currencies.find((item) => item.code === 'VND') ?? currencies[0];
    currencySuffix.value = preferred ? `${preferred.code}${preferred.ratio ?? ''}` : '';
  } catch {
    currencySuffix.value = '';
  }
});
</script>
