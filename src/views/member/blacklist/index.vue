<template>
  <div class="p-2 app-container member-blacklist-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="会员封禁记录" name="ban">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="会员ID">
              <el-input v-model="banQuery.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getBanList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="banQuery.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getBanList" />
            </el-form-item>
            <el-form-item label="封禁类型">
              <el-select v-model="banQuery.banType" placeholder="全部" clearable style="width: 130px">
                <!-- 口径见 F:\g318\sqls\member_ban_type_dict_20261008.sql（与 player 执行侧效果对齐） -->
                <el-option label="黑名单（封号）" :value="1" />
                <el-option label="封设备（未接入）" :value="2" />
                <el-option label="限制登录" :value="3" />
                <el-option label="禁止提现" :value="4" />
                <el-option label="禁止游戏（未接入）" :value="5" />
                <el-option label="禁止充值（未接入）" :value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="banQuery.active" placeholder="全部" clearable style="width: 130px">
                <el-option label="生效中" :value="1" />
                <el-option label="已解除/到期" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getBanList">搜索</el-button>
              <el-button icon="Refresh" @click="resetBanQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>黑名单</h3>
                <p>封号会同步将账号状态置为「锁定」；解除封禁只写解除时间，历史保留可复核。</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['member:blacklist:edit']" type="primary" plain icon="Plus" @click="banDialog.visible = true">封禁会员</el-button>
              </div>
            </div>
          </template>
          <el-table v-loading="banLoading" border :data="banRows">
            <el-table-column label="封禁时间" prop="banStartAt" align="center" width="180" />
            <el-table-column label="会员ID" align="center" width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <el-link type="primary" :underline="false" @click="goDetail(row.uid)">{{ row.uid }}</el-link>
              </template>
            </el-table-column>
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="层级" align="center" width="110">
              <template #default="{ row }">{{ row.levelName || '默认层级' }}</template>
            </el-table-column>
            <el-table-column label="VIP" align="center" width="80">
              <template #default="{ row }">VIP{{ row.vipLevel ?? 0 }}</template>
            </el-table-column>
            <el-table-column label="账号状态" align="center" width="110">
              <template #default="{ row }">
                <el-tag :type="row.accountStatus === 2 ? 'danger' : 'success'">
                  {{ row.accountStatus === 2 ? '锁定' : row.accountStatus === 3 ? '注销' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="封禁类型" align="center" width="110">
              <template #default="{ row }">{{ banTypeLabel(row.banType) }}</template>
            </el-table-column>
            <el-table-column label="原因" prop="reason" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="到期时间" align="center" width="180">
              <template #default="{ row }">{{ row.banEndAt || '永久' }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="110">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'danger' : 'info'">{{ row.active ? '生效中' : '已解除' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-hasPermi="['member:blacklist:edit']"
                  link
                  type="primary"
                  :disabled="!row.active"
                  @click="handleUnban(row as MemberBanVO)"
                  >解除封禁</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="banTotal > 0"
            v-model:page="banQuery.pageNum"
            v-model:limit="banQuery.pageSize"
            :total="banTotal"
            @pagination="getBanList"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="风控黑名单（设备/IP等）" name="risk">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="维度">
              <el-select v-model="riskQuery.targetType" placeholder="全部" clearable style="width: 140px">
                <el-option label="UID" :value="1" />
                <el-option label="设备" :value="2" />
                <el-option label="IP" :value="3" />
                <el-option label="手机" :value="4" />
                <el-option label="邮箱" :value="5" />
                <el-option label="PAN" :value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="掩码值">
              <el-input v-model="riskQuery.keyword" placeholder="模糊匹配掩码值" clearable style="width: 200px" @keyup.enter="getRiskList" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getRiskList">搜索</el-button>
              <el-button icon="Refresh" @click="resetRiskQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">该列表由风控引擎与会员设备模块写入，本页只读展示（不提供直接删除，避免绕过风控域）。</div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <el-table v-loading="riskLoading" border :data="riskRows">
            <el-table-column label="加入时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="维度" align="center" width="100">
              <template #default="{ row }">{{ targetTypeLabel(row.targetType) }}</template>
            </el-table-column>
            <el-table-column label="掩码值" prop="targetValueMask" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="来源" align="center" width="110">
              <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
            </el-table-column>
            <el-table-column label="阻断范围" align="center" width="150">
              <template #default="{ row }">{{ scopeLabel(row.blockScope) }}</template>
            </el-table-column>
            <el-table-column label="原因" prop="reason" align="left" min-width="200" show-overflow-tooltip />
            <el-table-column label="到期时间" align="center" width="180">
              <template #default="{ row }">{{ row.expireAt || '永久' }}</template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorId" align="center" width="140" />
          </el-table>
          <pagination
            v-show="riskTotal > 0"
            v-model:page="riskQuery.pageNum"
            v-model:limit="riskQuery.pageSize"
            :total="riskTotal"
            @pagination="getRiskList"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="banDialog.visible" title="封禁会员" width="600px" append-to-body destroy-on-close>
      <el-form ref="banFormRef" :model="banForm" :rules="banRules" label-width="130px">
        <el-form-item label="会员ID" prop="uid">
          <el-input v-model="banForm.uid" placeholder="请输入会员ID" />
        </el-form-item>
        <el-form-item label="封禁类型">
          <el-select v-model="banForm.banType" style="width: 100%">
            <el-option label="黑名单（封号，同步锁定账号）" :value="1" />
            <el-option label="封设备（未接入）" :value="2" />
            <el-option label="限制登录" :value="3" />
            <el-option label="禁止提现" :value="4" />
            <el-option label="禁止游戏（未接入）" :value="5" />
            <el-option label="禁止充值（未接入）" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="封禁天数" prop="banDays">
          <el-input-number v-model="banForm.banDays" :min="0" :max="3650" controls-position="right" style="width: 100%" />
          <span class="ml-2 text-gray-400 text-sm">填 0 表示永久封禁</span>
        </el-form-item>
        <el-form-item label="封禁原因" prop="reason">
          <el-input v-model="banForm.reason" type="textarea" :rows="3" placeholder="将写入封禁记录与操作审计" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="banSaving" @click="submitBan">确 定</el-button>
        <el-button @click="banDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberBlacklist" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { banMember, listMemberBan, listRiskBlacklist, unbanMember } from '@/api/member/blacklist';
import type { MemberBanForm, MemberBanQuery, MemberBanVO, RiskBlacklistQuery, RiskBlacklistVO } from '@/api/member/blacklist/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const router = useRouter();
const activeTab = ref('ban');
const { loading: banLoading, withLoading: withBanLoading } = useLoading(true);
const { loading: riskLoading, withLoading: withRiskLoading } = useLoading(true);
const { loading: banSaving, withLoading: withBanSaving } = useLoading(false);

const banRows = ref<MemberBanVO[]>([]);
const banTotal = ref(0);
const riskRows = ref<RiskBlacklistVO[]>([]);
const riskTotal = ref(0);
const banFormRef = ref();
const banDialog = reactive({ visible: false });

const data = reactive<{ banQuery: MemberBanQuery; riskQuery: RiskBlacklistQuery; banForm: MemberBanForm }>({
  banQuery: { pageNum: 1, pageSize: 10 },
  riskQuery: { pageNum: 1, pageSize: 10 },
  banForm: { uid: '', banType: 1, reason: '', banDays: 0, syncAccountStatus: 1 }
});
const { banQuery, riskQuery, banForm } = toRefs(data);

const banRules = {
  uid: [{ required: true, message: '会员ID不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '封禁原因不能为空', trigger: 'blur' }]
};

const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

const banTypeLabel = (type?: number) =>
  // 口径见 F:\g318\sqls\member_ban_type_dict_20261008.sql（与 player 执行侧效果对齐）
  ({
    1: '黑名单（封号）',
    2: '封设备（未接入）',
    3: '限制登录',
    4: '禁止提现',
    5: '禁止游戏（未接入）',
    6: '禁止充值（未接入）'
  } as Record<number, string>)[type ?? -1] ?? '—';
const targetTypeLabel = (type?: number) =>
  ({ 1: 'UID', 2: '设备', 3: 'IP', 4: '手机', 5: '邮箱', 6: 'PAN' } as Record<number, string>)[type ?? -1] ?? '—';
const sourceLabel = (source?: number) => (source === 2 ? '风控引擎' : source === 3 ? '系统' : '后台');
const scopeLabel = (scope?: number) => {
  const value = Number(scope ?? 0);
  if (value === 0) {
    return '全阻断';
  }
  const parts: string[] = [];
  if (value & 1) {
    parts.push('登录');
  }
  if (value & 2) {
    parts.push('提现');
  }
  if (value & 4) {
    parts.push('充值');
  }
  if (value & 8) {
    parts.push('游戏');
  }
  return parts.join('/') || '全阻断';
};

const getBanList = async () => {
  await withBanLoading(async () => {
    const res = (await listMemberBan(banQuery.value)) as unknown as PageBody<MemberBanVO>;
    banRows.value = res.rows ?? [];
    banTotal.value = res.total ?? 0;
  });
};

const getRiskList = async () => {
  await withRiskLoading(async () => {
    const res = (await listRiskBlacklist(riskQuery.value)) as unknown as PageBody<RiskBlacklistVO>;
    riskRows.value = res.rows ?? [];
    riskTotal.value = res.total ?? 0;
  });
};

const resetBanQuery = () => {
  banQuery.value = { pageNum: 1, pageSize: 10 };
  getBanList();
};

const resetRiskQuery = () => {
  riskQuery.value = { pageNum: 1, pageSize: 10 };
  getRiskList();
};

const submitBan = async () => {
  await banFormRef.value?.validate();
  const res = (await withBanSaving(async () => banMember(banForm.value))) as unknown as DataBody<number>;
  modal.msgSuccess(`封禁成功（记录 ${res.data ?? 0}）`);
  banDialog.visible = false;
  banForm.value = { uid: '', banType: 1, reason: '', banDays: 0, syncAccountStatus: 1 };
  await getBanList();
};

const handleUnban = async (row: MemberBanVO) => {
  if (!(await confirmed(`确认解除会员 ${row.loginName ?? row.uid} 的封禁？账号状态将恢复为正常。`))) {
    return;
  }
  const res = (await unbanMember({ id: row.id, reason: '后台解除封禁' })) as unknown as DataBody<number>;
  modal.msgSuccess(`解除成功（影响 ${res.data ?? 0} 条）`);
  await getBanList();
};

const goDetail = (uid: number | string) => {
  const target = router.resolve({ path: '/member/detail' });
  if (target.matched.length === 0) {
    return;
  }
  router.push({ path: '/member/detail', query: { uid: String(uid) } });
};

onMounted(async () => {
  await getBanList();
  await getRiskList();
});
</script>
