<template>
  <div class="p-2 app-container member-vip-level-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>VIP 等级配置</h3>
            <p>共 {{ rows.length }} 个等级；提现金额上限/提现次数填 0 表示不限制。等级奖励（晋级奖金/日周月工资/生日礼金）在「VIP奖励配置」中维护。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:vip-reward:list']" type="primary" icon="Present" @click="goRewardConfig()">VIP奖励配置</el-button>
            <el-button plain icon="QuestionFilled" @click="showGuide">操作教程</el-button>
            <el-button v-hasPermi="['member:vip:edit']" type="primary" plain icon="Plus" @click="handleAdd">新增等级</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="ID" prop="vipLevel" align="center" width="80" />
        <el-table-column label="币种" prop="currency" align="center" width="130" />
        <el-table-column label="VIP等级名称" prop="levelName" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="预览图" align="center" width="90">
          <template #default="{ row }">
            <el-avatar v-if="row.badgeIcon" :src="row.badgeIcon" :size="32" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="会员人数" align="center" width="110">
          <template #default="{ row }">{{ row.memberCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="每日提现金额上限" align="right" width="170">
          <template #default="{ row }">{{ Number(row.withdrawDailyLimit ?? 0) > 0 ? fmtMoney(row.withdrawDailyLimit) : '不限' }}</template>
        </el-table-column>
        <el-table-column label="每日提现次数上限" align="right" width="160">
          <template #default="{ row }">{{ Number(row.withdrawDailyTimes ?? 0) > 0 ? row.withdrawDailyTimes : '不限' }}</template>
        </el-table-column>
        <el-table-column label="每日免手续费笔数" align="right" width="150">
          <template #default="{ row }">{{ row.dailyFreeFeeTimes ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" align="center" width="120">
          <template #default="{ row }">{{ row.operatorId || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" width="180">
          <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:vip:edit']" link type="primary" @click="handleUpdate(row as VipLevelConfigVO)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="180px">
        <el-form-item label="VIP等级" prop="vipLevel">
          <el-input-number v-model="form.vipLevel" :min="0" :max="50" :disabled="isEdit" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="VIP等级名称" prop="levelName">
          <el-input v-model="form.levelName" maxlength="32" placeholder="如 VIP3 / 黄金会员" />
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="form.currency" style="width: 220px" placeholder="如 VND1000:1" />
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
        <el-form-item label="每日提现金额上限(0=不限)">
          <el-input-number v-model="form.withdrawDailyLimit" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日提现次数上限(0=不限)">
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
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { listVipLevel, saveVipLevel } from '@/api/member/vip';
import type { VipLevelConfigVO } from '@/api/member/vip/types';

type DataBody<T> = { data?: T };

const router = useRouter();
const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const rows = ref<VipLevelConfigVO[]>([]);
const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const isEdit = ref(false);
const form = reactive<VipLevelConfigVO>({ vipLevel: 0, levelName: '', currency: 'VND1000:1', status: 1 });

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

/**
 * 跳转「VIP奖励配置」（列表右上角按钮入口）。
 *
 * 2026-10-13 调整：行内「奖励设置」已按运营要求下线（侧边栏菜单同步隐藏），
 * 仅保留此处右上角按钮；仍支持可选 vipLevel 参数（保留给后续按行直达的入口复用）。
 */
const goRewardConfig = (vipLevel?: number) => {
  router.push({ path: '/member/vip-reward', query: vipLevel === undefined ? {} : { level: String(vipLevel) } });
};

const showGuide = () => {
  modal.alert(
    '1. 在「VIP等级配置」维护档位与提现权益；<br/>2. 点右上角「VIP奖励配置」进入矩阵，维护晋级要求/晋级奖金/日周月工资/生日礼金；<br/>' +
      '3. 矩阵右上角「详情 / VIP公共设置」维护领取口径与领取限制；<br/>4. 保存后客户端登录与奖励发放即按新配置生效。'
  );
};

const handleAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    vipLevel: (rows.value.at(-1)?.vipLevel ?? 0) + 1,
    levelName: '',
    currency: rows.value[0]?.currency ?? 'VND1000:1',
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
  dialog.title = `修改 ${row.levelName || 'VIP' + row.vipLevel} 配置`;
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
