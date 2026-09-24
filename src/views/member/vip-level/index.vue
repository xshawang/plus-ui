<template>
  <div class="p-2 app-container member-vip-level-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP 等级配置</h3>
            <p>共 {{ rows.length }} 个等级；提现上限/次数与免手续费笔数填 0 表示不限制，会员人数可点击钻取。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:vip:edit']" type="primary" plain icon="Plus" @click="handleAdd">新增等级</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="VIP等级" prop="vipLevel" align="center" width="100" />
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="预览图" align="center" width="90">
          <template #default="{ row }">
            <el-avatar v-if="row.badgeIcon" :src="row.badgeIcon" :size="32" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="等级名称" prop="levelName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="会员人数" align="center" width="110">
          <template #default="{ row }">{{ row.memberCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="晋级需累计充值(VND)" align="right" width="180">
          <template #default="{ row }">{{ fmtMoney(row.minPayTotal) }}</template>
        </el-table-column>
        <el-table-column label="晋级需有效局数" prop="minRounds" align="right" width="140" />
        <el-table-column label="每日提现上限(VND)" align="right" width="170">
          <template #default="{ row }">{{ Number(row.withdrawDailyLimit ?? 0) > 0 ? fmtMoney(row.withdrawDailyLimit) : '不限' }}</template>
        </el-table-column>
        <el-table-column label="每日提现次数" align="right" width="140">
          <template #default="{ row }">{{ Number(row.withdrawDailyTimes ?? 0) > 0 ? row.withdrawDailyTimes : '不限' }}</template>
        </el-table-column>
        <el-table-column label="每日免手续费笔数" align="right" width="160">
          <template #default="{ row }">{{ row.dailyFreeFeeTimes ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:vip:edit']" link type="primary" @click="handleUpdate(row as VipLevelConfigVO)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="170px">
        <el-form-item label="VIP等级" prop="vipLevel">
          <el-input-number v-model="form.vipLevel" :min="0" :max="50" :disabled="isEdit" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="form.levelName" maxlength="32" placeholder="如 VIP3 / 黄金会员" />
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="form.currency" style="width: 200px" />
        </el-form-item>
        <el-form-item label="徽章图URL">
          <el-input v-model="form.badgeIcon" placeholder="可为空，客户端按默认徽章展示" />
        </el-form-item>
        <el-form-item label="晋级需累计充值(VND)">
          <el-input-number v-model="form.minPayTotal" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="晋级需有效局数">
          <el-input-number v-model="form.minRounds" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日提现上限(VND，0=不限)">
          <el-input-number v-model="form.withdrawDailyLimit" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日提现次数(0=不限)">
          <el-input-number v-model="form.withdrawDailyTimes" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日免手续费笔数">
          <el-input-number v-model="form.dailyFreeFeeTimes" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="费率折扣(0~1)">
          <el-input-number v-model="form.feeDiscountRate" :min="0" :max="1" :precision="4" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日礼金(VND)">
          <el-input-number v-model="form.dailyGift" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberVipLevel" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { listVipLevel, saveVipLevel } from '@/api/member/vip';
import type { VipLevelConfigVO } from '@/api/member/vip/types';

type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const rows = ref<VipLevelConfigVO[]>([]);
const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const isEdit = ref(false);
const form = reactive<VipLevelConfigVO>({ vipLevel: 0, levelName: '', currency: 'VND', status: 1 });

const rules = {
  vipLevel: [{ required: true, message: 'VIP等级不能为空', trigger: 'blur' }],
  levelName: [{ required: true, message: '等级名称不能为空', trigger: 'blur' }]
};

const fmtMoney = (value?: number) => Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getList = async () => {
  await withLoading(async () => {
    const res = (await listVipLevel()) as unknown as DataBody<VipLevelConfigVO[]>;
    rows.value = res.data ?? [];
  });
};

const handleAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    vipLevel: (rows.value.at(-1)?.vipLevel ?? 0) + 1,
    levelName: '',
    currency: 'VND',
    badgeIcon: '',
    minPayTotal: 0,
    minRounds: 0,
    dailyGift: 0,
    feeDiscountRate: 0,
    withdrawDailyLimit: 0,
    withdrawDailyTimes: 0,
    dailyFreeFeeTimes: 0,
    status: 1
  });
  dialog.title = '新增 VIP 等级';
  dialog.visible = true;
};

const handleUpdate = (row: VipLevelConfigVO) => {
  isEdit.value = true;
  Object.assign(form, row);
  dialog.title = `修改 VIP${row.vipLevel} 配置`;
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    await withSaving(async () => saveVipLevel({ ...form }));
    modal.msgSuccess('保存成功');
    dialog.visible = false;
    await getList();
  });
};

onMounted(() => getList());
</script>
