<template>
  <div>
    <!-- 站点维护 -->
    <el-dialog v-model="maintain.visible" title="站点维护" width="520px" append-to-body destroy-on-close>
      <el-form :model="maintain.form" label-width="130px">
        <el-form-item label="站点">
          <span>{{ maintain.form.siteName || maintain.form.siteId }}</span>
        </el-form-item>
        <el-form-item label="站点维护费(U)">
          <el-input-number v-model="maintain.form.maintainFee" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="站点状态">
          <el-radio-group v-model="maintain.form.siteStatus">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitMaintain">确 定</el-button>
        <el-button @click="maintain.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 修改安全码 -->
    <el-dialog v-model="security.visible" title="修改安全码" width="480px" append-to-body destroy-on-close>
      <el-form :model="security" label-width="110px">
        <el-form-item label="站点">
          <span>{{ security.siteName }}</span>
        </el-form-item>
        <el-form-item label="新安全码">
          <el-input v-model="security.securityCode" placeholder="不少于 6 位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitSecurity">确 定</el-button>
        <el-button @click="security.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 充币 -->
    <el-dialog v-model="recharge.visible" title="站点充币" width="520px" append-to-body destroy-on-close>
      <el-form :model="recharge.form" label-width="120px">
        <el-form-item label="站点">
          <span>{{ recharge.siteName }}</span>
        </el-form-item>
        <el-form-item label="充币币种">
          <el-select v-model="recharge.form.currency" style="width: 100%">
            <el-option label="USDT" value="USDT" />
            <el-option v-for="item in options.currencies" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="充币数量">
          <el-input-number v-model="recharge.form.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="充币方式">
          <el-radio-group v-model="recharge.form.payType">
            <el-radio value="链上">链上</el-radio>
            <el-radio value="人工">人工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="链上/三方单号">
          <el-input v-model="recharge.form.thirdOrderNo" maxlength="64" />
        </el-form-item>
        <el-form-item label="幂等单号">
          <el-input v-model="recharge.form.orderNo" placeholder="留空由服务端生成；同单号只生效一次" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitRecharge">确 定</el-button>
        <el-button @click="recharge.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 提现审核模式 -->
    <el-dialog v-model="withdrawMode.visible" title="提现审核模式设置" width="480px" append-to-body destroy-on-close>
      <el-form label-width="120px">
        <el-form-item label="站点">
          <span>{{ withdrawMode.siteName }}</span>
        </el-form-item>
        <el-form-item label="审核模式">
          <el-radio-group v-model="withdrawMode.mode">
            <el-radio :value="1">人工审核</el-radio>
            <el-radio :value="2">自动审核</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitWithdrawMode">确 定</el-button>
        <el-button @click="withdrawMode.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 站点额度 -->
    <el-dialog v-model="quota.visible" title="站点额度配置" width="520px" append-to-body destroy-on-close>
      <el-form :model="quota.form" label-width="120px">
        <el-form-item label="站点">
          <span>{{ quota.siteName }}</span>
        </el-form-item>
        <el-form-item label="额度类型">
          <el-select v-model="quota.form.quotaType" style="width: 100%">
            <el-option label="授信额度" :value="1" />
            <el-option label="三方额度" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="quota.form.currency" />
        </el-form-item>
        <el-form-item label="额度总额">
          <el-input-number v-model="quota.form.quotaAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="已用额度">
          <el-input-number v-model="quota.form.usedAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitQuota">确 定</el-button>
        <el-button @click="quota.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 金额和三方额度 -->
    <el-dialog v-model="credit.visible" title="金额和三方额度" width="560px" append-to-body destroy-on-close>
      <el-form :model="credit.form" label-width="120px">
        <el-form-item label="站点">
          <span>{{ credit.siteName }}</span>
        </el-form-item>
        <el-form-item label="三方ID">
          <el-input v-model="credit.form.thirdId" placeholder="如 vndlirapay" />
        </el-form-item>
        <el-form-item label="三方名称">
          <el-input v-model="credit.form.thirdName" />
        </el-form-item>
        <el-form-item label="支持功能">
          <el-radio-group v-model="credit.form.supportFunc">
            <el-radio value="支付">支付</el-radio>
            <el-radio value="代付">代付</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="额度金额">
          <el-input-number v-model="credit.form.creditAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="已用金额">
          <el-input-number v-model="credit.form.usedCredit" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结算周期">
          <el-input v-model="credit.form.settleCycle" placeholder="如 T+1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCredit">确 定</el-button>
        <el-button @click="credit.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 站点收费标准 -->
    <el-dialog v-model="fee.visible" title="站点收费标准" width="560px" append-to-body destroy-on-close>
      <el-form :model="fee.form" label-width="120px">
        <el-form-item label="站点">
          <span>{{ fee.siteName }}</span>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="fee.form.feeType" style="width: 100%">
            <el-option label="线路维护费" :value="1" />
            <el-option label="开站费" :value="2" />
            <el-option label="提现审核费/三方优惠" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用名称">
          <el-input v-model="fee.form.feeName" />
        </el-form-item>
        <el-form-item label="计量单位">
          <el-radio-group v-model="fee.form.feeUnit">
            <el-radio :value="1">U</el-radio>
            <el-radio :value="2">百分比</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="费用值">
          <el-input-number v-model="fee.form.feeValue" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="fee.form.currency" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitFee">确 定</el-button>
        <el-button @click="fee.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 开站记录 -->
    <el-dialog v-model="openRecord.visible" title="新增开站记录" width="520px" append-to-body destroy-on-close>
      <el-form :model="openRecord.form" label-width="120px">
        <el-form-item label="站点">
          <span>{{ openRecord.siteName }}</span>
        </el-form-item>
        <el-form-item label="开站类型">
          <el-radio-group v-model="openRecord.form.openType">
            <el-radio :value="1">主站开站</el-radio>
            <el-radio :value="2">子品牌开站</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开站费用(U)">
          <el-input-number v-model="openRecord.form.openFee" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="openRecord.form.currency" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="openRecord.form.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitOpenRecord">确 定</el-button>
        <el-button @click="openRecord.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 生成账单 -->
    <el-dialog v-model="billGenerate.visible" title="生成账单" width="480px" append-to-body destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="站点">
          <span>{{ billGenerate.siteName }}</span>
        </el-form-item>
        <el-form-item label="账单月份">
          <el-date-picker v-model="billGenerate.billMonth" type="month" value-format="YYYY-MM" style="width: 100%" />
        </el-form-item>
        <el-form-item label="账单类型">
          <el-select v-model="billGenerate.billType" style="width: 100%">
            <el-option label="线路维护费" :value="1" />
            <el-option label="开站费" :value="2" />
            <el-option label="提现审核费/三方优惠" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitBillGenerate">确 定</el-button>
        <el-button @click="billGenerate.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import modal from '@/plugins/modal';
import {
  changeSiteSecurityCode,
  generateSiteBill,
  maintainSite,
  rechargeSite,
  saveSiteCredit,
  saveSiteFee,
  saveSiteOpen,
  saveSiteQuota,
  setWithdrawReviewMode
} from '@/api/system/site';
import type { SiteOptions } from '@/api/system/site/types';

/**
 * 站点行级/顶部动作弹窗集合（维护 / 安全码 / 充币 / 提现审核模式 / 额度 / 三方额度 / 收费标准 / 开站 / 生成账单）。
 *
 * 为什么收在一个组件里：这些弹窗都是「针对单个站点的一次性动作」，各自只有 2~6 个字段，
 * 拆成 9 个文件会显著增加维护成本；但表单与提交逻辑按动作分块，保持互不影响。
 */
defineProps<{ options: SiteOptions }>();
const emit = defineEmits<{ saved: [] }>();

const maintain = reactive({ visible: false, form: {} as Record<string, any>, siteName: '' });
const security = reactive({ visible: false, siteId: '', siteName: '', securityCode: '' });
const recharge = reactive({ visible: false, siteName: '', form: {} as Record<string, any> });
const withdrawMode = reactive({ visible: false, siteId: '', siteName: '', mode: 1 });
const quota = reactive({ visible: false, siteName: '', form: {} as Record<string, any> });
const credit = reactive({ visible: false, siteName: '', form: {} as Record<string, any> });
const fee = reactive({ visible: false, siteName: '', form: {} as Record<string, any> });
const openRecord = reactive({ visible: false, siteName: '', form: {} as Record<string, any> });
const billGenerate = reactive({ visible: false, siteName: '', siteId: '', billMonth: '', billType: 1 });

const openMaintain = (row: any) => {
  maintain.form = {
    siteId: row.siteId,
    maintainFee: Number(row.mainLineFee ?? row.lineMaintainFee ?? 0),
    siteStatus: row.siteStatus
  };
  maintain.siteName = row.siteName;
  maintain.visible = true;
};

const submitMaintain = async () => {
  await maintainSite({
    siteId: maintain.form.siteId,
    maintainFee: maintain.form.maintainFee,
    siteStatus: maintain.form.siteStatus
  });
  modal.msgSuccess('维护成功');
  maintain.visible = false;
  emit('saved');
};

const openSecurityCode = (row: any) => {
  security.siteId = row.siteId;
  security.siteName = row.siteName;
  security.securityCode = '';
  security.visible = true;
};

const submitSecurity = async () => {
  if (!security.securityCode || security.securityCode.length < 6) {
    modal.msgWarning('安全码不少于 6 位');
    return;
  }
  await changeSiteSecurityCode({ siteId: security.siteId, securityCode: security.securityCode });
  modal.msgSuccess('安全码已更新');
  security.visible = false;
};

const openRecharge = (row: any) => {
  recharge.siteName = row.siteName;
  recharge.form = { siteId: row.siteId, currency: 'USDT', amount: 100, payType: '人工' };
  recharge.visible = true;
};

const submitRecharge = async () => {
  if (!recharge.form.amount || recharge.form.amount <= 0) {
    modal.msgWarning('请输入充币数量');
    return;
  }
  await rechargeSite(recharge.form as any);
  modal.msgSuccess('充币成功');
  recharge.visible = false;
  emit('saved');
};

const openWithdrawMode = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  withdrawMode.siteId = site.siteId;
  withdrawMode.siteName = site.siteName;
  withdrawMode.mode = site.withdrawReviewMode ?? 1;
  withdrawMode.visible = true;
};

const submitWithdrawMode = async () => {
  await setWithdrawReviewMode({ siteId: withdrawMode.siteId, mode: withdrawMode.mode });
  modal.msgSuccess('设置成功');
  withdrawMode.visible = false;
  emit('saved');
};

const openQuota = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  quota.siteName = site.siteName;
  quota.form = { siteId: site.siteId, quotaType: 1, currency: site.currency, quotaAmount: 0, usedAmount: 0 };
  quota.visible = true;
};

const submitQuota = async () => {
  await saveSiteQuota(quota.form);
  modal.msgSuccess('保存成功');
  quota.visible = false;
  emit('saved');
};

const openCredit = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  credit.siteName = site.siteName;
  credit.form = { siteId: site.siteId, supportFunc: '支付', settleCycle: 'T+1', creditAmount: 0, usedCredit: 0 };
  credit.visible = true;
};

const submitCredit = async () => {
  if (!credit.form.thirdId) {
    modal.msgWarning('请输入三方ID');
    return;
  }
  await saveSiteCredit(credit.form);
  modal.msgSuccess('保存成功');
  credit.visible = false;
  emit('saved');
};

const openFee = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  fee.siteName = site.siteName;
  fee.form = { siteId: site.siteId, feeType: 1, feeName: '线路维护费', feeUnit: 1, feeValue: 0, currency: 'USDT' };
  fee.visible = true;
};

const submitFee = async () => {
  await saveSiteFee(fee.form);
  modal.msgSuccess('保存成功');
  fee.visible = false;
  emit('saved');
};

const openOpenRecord = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  openRecord.siteName = site.siteName;
  openRecord.form = { siteId: site.siteId, openType: 1, openFee: 0, currency: site.currency };
  openRecord.visible = true;
};

const submitOpenRecord = async () => {
  await saveSiteOpen(openRecord.form);
  modal.msgSuccess('保存成功');
  openRecord.visible = false;
  emit('saved');
};

const openBillGenerate = (site?: any) => {
  if (!site) {
    modal.msgWarning('请先选择站点');
    return;
  }
  billGenerate.siteId = site.siteId;
  billGenerate.siteName = site.siteName;
  const now = new Date();
  billGenerate.billMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  billGenerate.billType = 1;
  billGenerate.visible = true;
};

const submitBillGenerate = async () => {
  await generateSiteBill({
    siteId: billGenerate.siteId,
    billMonth: billGenerate.billMonth,
    billType: billGenerate.billType
  });
  modal.msgSuccess('账单已生成');
  billGenerate.visible = false;
  emit('saved');
};

defineExpose({
  openMaintain,
  openSecurityCode,
  openRecharge,
  openWithdrawMode,
  openQuota,
  openCredit,
  openFee,
  openOpenRecord,
  openBillGenerate
});
</script>
