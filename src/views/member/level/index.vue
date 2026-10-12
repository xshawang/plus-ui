<template>
  <div class="p-2 app-container member-level-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="层级类型">
          <el-radio-group v-model="queryParams.levelType" @change="handleQuery">
            <el-radio-button :value="1">自动层级</el-radio-button>
            <el-radio-button :value="2">固定层级</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="层级名称">
          <el-input v-model="queryParams.levelName" placeholder="层级名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>层级设置</h3>
            <p>共 {{ total }} 个层级，层级人数可点击查看该层级会员明细。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:level:edit']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="ID" prop="levelId" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="层级类型" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.levelType === 2 ? 'warning' : 'success'">{{ row.levelType === 2 ? '固定层级' : '自动层级' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="层级名称" prop="levelName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" align="left" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="充值次数" align="center" width="100">
          <template #default="{ row }">{{ row.minDepositCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="累计充值金额" align="right" width="150">
          <template #default="{ row }">{{ fmtYuan(row.minDepositAmount) }}</template>
        </el-table-column>
        <el-table-column label="层级人数" align="center" width="120">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleDetail(row as MemberLevelVO)">{{ row.memberCount ?? 0 }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="140" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row as MemberLevelVO)">详情</el-button>
            <el-button v-hasPermi="['member:level:edit']" link type="primary" @click="handleUpdate(row as MemberLevelVO)">修改</el-button>
            <el-button
              v-hasPermi="['member:level:edit']"
              link
              type="danger"
              :disabled="row.defaultLevel"
              @click="handleDelete(row as MemberLevelVO)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 新增/修改层级 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="层级类型" prop="levelType">
          <el-radio-group v-model="form.levelType">
            <el-radio :value="1">自动层级</el-radio>
            <el-radio :value="2">固定层级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="层级名称" prop="levelName">
          <el-input v-model="form.levelName" placeholder="如：默认层级 / 首充玩家 / 10E" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="255" placeholder="层级业务定位说明" />
        </el-form-item>
        <el-form-item label="最低充值次数">
          <el-input-number v-model="form.minDepositCount" :min="0" :max="100000" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最低累计充值金额">
          <el-input-number
            v-model="form.minDepositAmountYuan"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="单位 VND，0 表示不考核"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="buttonLoading" @click="submitForm">确 定</el-button>
        <el-button @click="closeDialog">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 层级详情：层级会员明细 + 行内/批量改层级 -->
    <el-dialog v-model="detail.visible" :title="detail.title" width="1180px" append-to-body top="5vh" destroy-on-close>
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="memberQuery.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="handleMemberQuery" />
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input v-model="memberQuery.uid" placeholder="会员ID" clearable style="width: 160px" @keyup.enter="handleMemberQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleMemberQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetMemberQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar-shell mb-2">
        <div class="table-heading">
          <span>已选择 {{ selectedUids.length }} 名会员，共 {{ memberTotal }} 条</span>
        </div>
        <div class="toolbar-actions">
          <el-select v-model="batchLevelId" placeholder="批量调整为层级" style="width: 200px" clearable>
            <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelId" />
          </el-select>
          <el-button v-hasPermi="['member:user:edit']" type="primary" plain :disabled="!batchLevelId || selectedUids.length === 0" @click="handleBatchAssign">
            批量调整层级
          </el-button>
        </div>
      </div>

      <el-table v-loading="memberLoading" border :data="memberRows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="会员ID" prop="uid" align="center" width="150" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="注册时间" prop="registerAt" align="center" width="170" />
        <el-table-column label="充值总额" align="right" width="130">
          <template #default="{ row }">{{ fmtYuan(row.rechargeAmount) }}</template>
        </el-table-column>
        <el-table-column label="充值次数" align="right" width="100">
          <template #default="{ row }">{{ row.rechargeCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="最大单笔充值" align="right" width="140">
          <template #default="{ row }">{{ fmtYuan(row.maxDepositAmount) }}</template>
        </el-table-column>
        <el-table-column label="提现总额" align="right" width="130">
          <template #default="{ row }">{{ fmtYuan(row.withdrawAmount) }}</template>
        </el-table-column>
        <el-table-column label="提现次数" align="right" width="100">
          <template #default="{ row }">{{ row.withdrawCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="VIP等级" align="center" width="90">
          <template #default="{ row }">VIP{{ row.vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="余额" align="right" width="130">
          <template #default="{ row }">{{ fmtYuan(row.availableBalance) }}</template>
        </el-table-column>
        <el-table-column label="奖励钱包" align="right" width="130">
          <template #default="{ row }">{{ fmtYuan(row.bonusBalance) }}</template>
        </el-table-column>
        <el-table-column label="层级" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-select
              v-hasPermi="['member:user:edit']"
              :model-value="row.levelName"
              placeholder="调整层级"
              style="width: 100%"
              @change="(value: string) => handleRowAssign(row as MemberLevelMemberVO, value)"
            >
              <el-option v-for="item in levelOptions" :key="item.levelId" :label="item.levelName" :value="item.levelName" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="memberTotal > 0"
        v-model:page="memberQuery.pageNum"
        v-model:limit="memberQuery.pageSize"
        :total="memberTotal"
        @pagination="getMemberList"
      />
    </el-dialog>
  </div>
</template>

<script setup name="MemberLevel" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addMemberLevel,
  assignMemberLevel,
  delMemberLevel,
  listLevelMembers,
  listMemberLevel,
  listMemberLevelOptions,
  updateMemberLevel
} from '@/api/member/level';
import type {
  MemberLevelForm,
  MemberLevelMemberVO,
  MemberLevelQuery,
  MemberLevelVO
} from '@/api/member/level/types';

/** 后端返回体：分页接口是 {rows,total}，对象接口是 {code,msg,data}（见 utils/request 拦截器直出 body） */
type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: memberLoading, withLoading: withMemberLoading } = useLoading(true);
const { loading: buttonLoading, withLoading: withButtonLoading } = useLoading(false);

const rows = ref<MemberLevelVO[]>([]);
const total = ref(0);
const levelOptions = ref<MemberLevelVO[]>([]);
const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const detail = reactive({ visible: false, title: '' });

interface LevelFormState extends MemberLevelForm {
  /** 表单内以 VND 录入，提交时换算为分 */
  minDepositAmountYuan?: number;
}

const data = reactive<{ queryParams: MemberLevelQuery; form: LevelFormState }>({
  queryParams: { pageNum: 1, pageSize: 10, levelType: 1 },
  form: { levelName: '', levelType: 1, minDepositCount: 0, minDepositAmountYuan: 0, sortOrder: 0, status: 1 }
});
const { queryParams, form } = toRefs(data);

const memberQuery = reactive({ pageNum: 1, pageSize: 10, loginName: '', uid: '' as number | string });
const memberRows = ref<MemberLevelMemberVO[]>([]);
const memberTotal = ref(0);
const selectedUids = ref<number[]>([]);
const batchLevelId = ref<number>();
const currentLevelId = ref<number>();

const rules = {
  levelName: [{ required: true, message: '层级名称不能为空', trigger: 'blur' }],
  levelType: [{ required: true, message: '请选择层级类型', trigger: 'change' }]
};

/**
 * 二次确认封装。
 *
 * 为什么包一层：modal.confirm 基于 ElMessageBox，用户点「取消」时 Promise 会 reject，
 * 直接 await 会在点击取消时产生未捕获拒绝（控制台报错）；这里统一收敛为布尔值。
 */
const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

/** 分（BIGINT）→ VND 展示 */
const fmtYuan = (fen?: number) => {
  const value = Number(fen ?? 0) / 100;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const toFen = (yuan?: number) => Math.round(Number(yuan ?? 0) * 100);

const getList = async () => {
  await withLoading(async () => {
    const res = (await listMemberLevel(queryParams.value)) as unknown as PageBody<MemberLevelVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const loadOptions = async () => {
  const res = (await listMemberLevelOptions()) as unknown as DataBody<MemberLevelVO[]>;
  levelOptions.value = res.data ?? [];
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10, levelType: queryParams.value.levelType };
  getList();
};

const handleAdd = () => {
  form.value = { levelName: '', levelType: queryParams.value.levelType ?? 1, minDepositCount: 0, minDepositAmountYuan: 0, sortOrder: 0, status: 1 };
  dialog.title = '新增层级';
  dialog.visible = true;
};

const handleUpdate = (row: MemberLevelVO) => {
  form.value = {
    levelId: row.levelId,
    levelName: row.levelName,
    levelType: row.levelType,
    minDepositCount: row.minDepositCount ?? 0,
    minDepositAmountYuan: Number(row.minDepositAmount ?? 0) / 100,
    description: row.description,
    sortOrder: row.sortOrder ?? 0,
    status: row.status ?? 1
  };
  dialog.title = '修改层级';
  dialog.visible = true;
};

const closeDialog = () => {
  dialog.visible = false;
};

const submitForm = async () => {
  await formRef.value?.validate();
  const payload: MemberLevelForm = {
    levelId: form.value.levelId,
    levelName: form.value.levelName,
    levelType: form.value.levelType,
    minDepositCount: form.value.minDepositCount ?? 0,
    minDepositAmount: toFen(form.value.minDepositAmountYuan),
    description: form.value.description,
    sortOrder: form.value.sortOrder ?? 0,
    status: form.value.status ?? 1
  };
  await withButtonLoading(async () => {
    if (payload.levelId) {
      await updateMemberLevel(payload);
    } else {
      await addMemberLevel(payload);
    }
  });
  modal.msgSuccess('操作成功');
  closeDialog();
  await getList();
  await loadOptions();
};

const handleDelete = async (row: MemberLevelVO) => {
  if (!(await confirmed(`确认删除层级「${row.levelName}」？该层级下若有会员将无法删除。`))) {
    return;
  }
  await delMemberLevel(row.levelId);
  modal.msgSuccess('删除成功');
  await getList();
  await loadOptions();
};

const handleDetail = async (row: MemberLevelVO) => {
  currentLevelId.value = row.levelId;
  memberQuery.loginName = '';
  memberQuery.uid = '';
  memberQuery.pageNum = 1;
  batchLevelId.value = undefined;
  selectedUids.value = [];
  detail.title = `层级详情 - ${row.levelName}（${row.levelType === 2 ? '固定层级' : '自动层级'}）`;
  detail.visible = true;
  await getMemberList();
};

const getMemberList = async () => {
  if (!currentLevelId.value) {
    return;
  }
  await withMemberLoading(async () => {
    const res = (await listLevelMembers(currentLevelId.value as number, memberQuery)) as unknown as PageBody<MemberLevelMemberVO>;
    memberRows.value = res.rows ?? [];
    memberTotal.value = res.total ?? 0;
  });
};

const handleMemberQuery = () => {
  memberQuery.pageNum = 1;
  getMemberList();
};

const resetMemberQuery = () => {
  memberQuery.loginName = '';
  memberQuery.uid = '';
  memberQuery.pageNum = 1;
  getMemberList();
};

const handleSelectionChange = (selection: MemberLevelMemberVO[]) => {
  selectedUids.value = selection.map((item) => item.uid);
};

const findLevelIdByName = (name?: string) => levelOptions.value.find((item) => item.levelName === name)?.levelId;

const handleRowAssign = async (row: MemberLevelMemberVO, levelName: string) => {
  const levelId = findLevelIdByName(levelName);
  if (!levelId) {
    modal.msgWarning('层级不存在，请刷新后重试');
    return;
  }
  if (!(await confirmed(`确认将会员「${row.loginName}」调整为层级「${levelName}」？`))) {
    return;
  }
  const res = (await assignMemberLevel({ uid: row.uid, levelId, changeReason: '层级详情行内调整' })) as unknown as DataBody<number>;
  modal.msgSuccess(`调整完成（影响 ${res.data ?? 0} 条）`);
  await getMemberList();
  await getList();
};

const handleBatchAssign = async () => {
  if (!batchLevelId.value || selectedUids.value.length === 0) {
    return;
  }
  const levelName = levelOptions.value.find((item) => item.levelId === batchLevelId.value)?.levelName ?? '';
  if (!(await confirmed(`确认将选中的 ${selectedUids.value.length} 名会员批量调整为层级「${levelName}」？`))) {
    return;
  }
  const res = (await assignMemberLevel({
    uids: selectedUids.value,
    levelId: batchLevelId.value,
    changeReason: '层级详情批量调整'
  })) as unknown as DataBody<number>;
  modal.msgSuccess(`调整完成（影响 ${res.data ?? 0} 条）`);
  selectedUids.value = [];
  batchLevelId.value = undefined;
  await getMemberList();
  await getList();
};

onMounted(async () => {
  await loadOptions();
  await getList();
});
</script>
