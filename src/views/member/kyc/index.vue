<template>
  <div class="p-2 app-container member-kyc-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="KYC厂商配置" name="vendor">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="厂商">
              <el-input v-model="vendorQuery.keyword" placeholder="厂商代码/名称" clearable style="width: 200px" @keyup.enter="getVendorList" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="vendorQuery.status" placeholder="全部" clearable style="width: 110px">
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getVendorList">搜索</el-button>
              <el-button icon="Refresh" @click="resetVendorQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>KYC 厂商</h3>
                <p>按优先级 + 启用国家路由；封顶达到后自动熔断，通过率用于评估厂商质量。</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['member:kyc:edit']" type="primary" plain icon="Plus" @click="handleAddVendor">新增厂商</el-button>
              </div>
            </div>
          </template>
          <el-table v-loading="vendorLoading" border :data="vendorRows">
            <el-table-column label="优先级" prop="priority" align="center" width="90" />
            <el-table-column label="厂商代码" prop="vendorCode" align="center" min-width="130" show-overflow-tooltip />
            <el-table-column label="厂商名称" prop="vendorName" align="center" min-width="140" show-overflow-tooltip />
            <el-table-column label="支持国家" prop="supportCountries" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="启用国家" prop="enabledCountries" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="收费说明" prop="feeDesc" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column label="每日封顶" align="center" width="100">
              <template #default="{ row }">{{ row.dailyCap && row.dailyCap > 0 ? row.dailyCap : '不限' }}</template>
            </el-table-column>
            <el-table-column label="今日剩余" align="center" width="100">
              <template #default="{ row }">{{ row.todayRemain === -1 ? '不限' : row.todayRemain }}</template>
            </el-table-column>
            <el-table-column label="今日验证/成功/失败" align="center" width="180">
              <template #default="{ row }">{{ row.todayCount ?? 0 }} / {{ row.todaySuccess ?? 0 }} / {{ row.todayFail ?? 0 }}</template>
            </el-table-column>
            <el-table-column label="今日通过率" align="center" width="110">
              <template #default="{ row }">{{ (row.todayPassRate ?? 0).toFixed(2) }}%</template>
            </el-table-column>
            <el-table-column label="累计通过率" align="center" width="110">
              <template #default="{ row }">{{ (row.totalPassRate ?? 0).toFixed(2) }}%</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="150" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['member:kyc:edit']" link type="primary" @click="handleUpdateVendor(row as KycVendorVO)">修改</el-button>
                <el-button v-hasPermi="['member:kyc:edit']" link type="danger" @click="handleDeleteVendor(row as KycVendorVO)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="vendorTotal > 0"
            v-model:page="vendorQuery.pageNum"
            v-model:limit="vendorQuery.pageSize"
            :total="vendorTotal"
            @pagination="getVendorList"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="实名单据" name="record">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="会员ID">
              <el-input v-model="recordQuery.uid" placeholder="会员ID" clearable style="width: 160px" @keyup.enter="getRecordList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="recordQuery.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getRecordList" />
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="recordQuery.verifyStatus" placeholder="全部" clearable style="width: 130px">
                <el-option label="未提交" :value="0" />
                <el-option label="待审核" :value="1" />
                <el-option label="通过" :value="2" />
                <el-option label="驳回" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getRecordList">搜索</el-button>
              <el-button icon="Refresh" @click="resetRecordQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">合规提示：证件号一律掩码展示，后台不提供明文查看。</div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <el-table v-loading="recordLoading" border :data="recordRows">
            <el-table-column label="提交时间" prop="createdAt" align="center" width="180" />
            <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="KYC等级" prop="kycLevel" align="center" width="90" />
            <el-table-column label="真实姓名" prop="realName" align="center" min-width="130" show-overflow-tooltip />
            <el-table-column label="证件号" prop="idCardNoMask" align="center" min-width="140" />
            <el-table-column label="审核状态" align="center" width="110">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.verifyStatus)">{{ statusLabel(row.verifyStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="驳回原因" prop="rejectReason" align="left" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.rejectReason || '—' }}</template>
            </el-table-column>
            <el-table-column label="审核时间" prop="verifiedAt" align="center" width="180" />
            <el-table-column label="操作" align="center" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['member:kyc:edit']" link type="success" @click="handleAudit(row as KycRecordVO, 'PASS')">通过</el-button>
                <el-button v-hasPermi="['member:kyc:edit']" link type="danger" @click="handleAudit(row as KycRecordVO, 'REJECT')">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="recordTotal > 0"
            v-model:page="recordQuery.pageNum"
            v-model:limit="recordQuery.pageSize"
            :total="recordTotal"
            @pagination="getRecordList"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="vendorDialog.visible" :title="vendorDialog.title" width="640px" append-to-body destroy-on-close>
      <el-form ref="vendorFormRef" :model="vendorForm" :rules="vendorRules" label-width="140px">
        <el-form-item label="厂商代码" prop="vendorCode">
          <el-input v-model="vendorForm.vendorCode" placeholder="如 SUMSUB / JUMIO" maxlength="64" />
        </el-form-item>
        <el-form-item label="厂商名称" prop="vendorName">
          <el-input v-model="vendorForm.vendorName" maxlength="128" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="vendorForm.priority" :min="0" :max="9999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支持国家">
          <el-input v-model="vendorForm.supportCountries" placeholder="逗号分隔，如 VN,IN,BR" />
        </el-form-item>
        <el-form-item label="启用国家">
          <el-input v-model="vendorForm.enabledCountries" placeholder="逗号分隔，留空表示全部启用" />
        </el-form-item>
        <el-form-item label="收费说明">
          <el-input v-model="vendorForm.feeDesc" placeholder="如 0.15 USDT/次" />
        </el-form-item>
        <el-form-item label="每日封顶">
          <el-input-number v-model="vendorForm.dailyCap" :min="0" :max="10000000" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="vendorForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitVendor">确 定</el-button>
        <el-button @click="vendorDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialog.visible" :title="auditDialog.action === 'PASS' ? '审核通过' : '驳回实名'" width="520px" append-to-body destroy-on-close>
      <el-input
        v-if="auditDialog.action === 'REJECT'"
        v-model="auditDialog.reason"
        type="textarea"
        :rows="3"
        placeholder="驳回原因（必填，将展示给会员）"
      />
      <div v-else class="text-gray-500">确认将该实名单据置为「通过」？</div>
      <template #footer>
        <el-button type="primary" @click="submitAudit">确 定</el-button>
        <el-button @click="auditDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberKyc" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addKycVendor,
  auditKycRecord,
  delKycVendor,
  listKycRecord,
  listKycVendor,
  updateKycVendor
} from '@/api/member/kyc';
import type { KycRecordQuery, KycRecordVO, KycVendorForm, KycVendorQuery, KycVendorVO } from '@/api/member/kyc/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const activeTab = ref('vendor');
const { loading: vendorLoading, withLoading: withVendorLoading } = useLoading(true);
const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);

const vendorRows = ref<KycVendorVO[]>([]);
const vendorTotal = ref(0);
const recordRows = ref<KycRecordVO[]>([]);
const recordTotal = ref(0);
const vendorFormRef = ref();
const vendorDialog = reactive({ visible: false, title: '' });
const auditDialog = reactive({ visible: false, action: 'PASS', reason: '', id: 0 });

const data = reactive<{ vendorQuery: KycVendorQuery; recordQuery: KycRecordQuery; vendorForm: KycVendorForm }>({
  vendorQuery: { pageNum: 1, pageSize: 10 },
  recordQuery: { pageNum: 1, pageSize: 10 },
  vendorForm: { vendorCode: '', vendorName: '', priority: 999, dailyCap: 0, status: 1 }
});
const { vendorQuery, recordQuery, vendorForm } = toRefs(data);

const vendorRules = {
  vendorCode: [{ required: true, message: '厂商代码不能为空', trigger: 'blur' }],
  vendorName: [{ required: true, message: '厂商名称不能为空', trigger: 'blur' }]
};

const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

const getVendorList = async () => {
  await withVendorLoading(async () => {
    const res = (await listKycVendor(vendorQuery.value)) as unknown as PageBody<KycVendorVO>;
    vendorRows.value = res.rows ?? [];
    vendorTotal.value = res.total ?? 0;
  });
};

const getRecordList = async () => {
  await withRecordLoading(async () => {
    const res = (await listKycRecord(recordQuery.value)) as unknown as PageBody<KycRecordVO>;
    recordRows.value = res.rows ?? [];
    recordTotal.value = res.total ?? 0;
  });
};

const resetVendorQuery = () => {
  vendorQuery.value = { pageNum: 1, pageSize: 10 };
  getVendorList();
};

const resetRecordQuery = () => {
  recordQuery.value = { pageNum: 1, pageSize: 10 };
  getRecordList();
};

const handleAddVendor = () => {
  vendorForm.value = { vendorCode: '', vendorName: '', priority: 999, dailyCap: 0, status: 1 };
  vendorDialog.title = '新增 KYC 厂商';
  vendorDialog.visible = true;
};

const handleUpdateVendor = (row: KycVendorVO) => {
  vendorForm.value = {
    vendorId: row.vendorId,
    vendorCode: row.vendorCode,
    vendorName: row.vendorName,
    priority: row.priority ?? 999,
    supportCountries: row.supportCountries,
    enabledCountries: row.enabledCountries,
    feeDesc: row.feeDesc,
    dailyCap: row.dailyCap ?? 0,
    status: row.status ?? 1
  };
  vendorDialog.title = '修改 KYC 厂商';
  vendorDialog.visible = true;
};

const submitVendor = async () => {
  await vendorFormRef.value?.validate();
  if (vendorForm.value.vendorId) {
    await updateKycVendor(vendorForm.value);
  } else {
    await addKycVendor(vendorForm.value);
  }
  modal.msgSuccess('操作成功');
  vendorDialog.visible = false;
  await getVendorList();
};

const handleDeleteVendor = async (row: KycVendorVO) => {
  if (!(await confirmed(`确认删除厂商「${row.vendorName}」？已有历史验证记录的厂商需改为停用。`))) {
    return;
  }
  await delKycVendor(row.vendorId);
  modal.msgSuccess('删除成功');
  await getVendorList();
};

const handleAudit = async (row: KycRecordVO, action: string) => {
  if (row.verifyStatus !== 1) {
    modal.msgWarning('仅待审核单据可以审核');
    return;
  }
  auditDialog.action = action;
  auditDialog.reason = '';
  auditDialog.id = row.id;
  auditDialog.visible = true;
};

const submitAudit = async () => {
  if (auditDialog.action === 'REJECT' && !auditDialog.reason.trim()) {
    modal.msgWarning('驳回必须填写原因');
    return;
  }
  const res = (await auditKycRecord({
    id: auditDialog.id,
    action: auditDialog.action,
    reason: auditDialog.reason
  })) as unknown as DataBody<number>;
  modal.msgSuccess(`审核完成（影响 ${res.data ?? 0} 条）`);
  auditDialog.visible = false;
  await getRecordList();
};

const statusLabel = (status?: number) => {
  switch (status) {
    case 1:
      return '待审核';
    case 2:
      return '通过';
    case 3:
      return '驳回';
    default:
      return '未提交';
  }
};

const statusTagType = (status?: number) => {
  switch (status) {
    case 2:
      return 'success';
    case 3:
      return 'danger';
    case 1:
      return 'warning';
    default:
      return 'info';
  }
};

onMounted(async () => {
  await getVendorList();
  await getRecordList();
});
</script>
