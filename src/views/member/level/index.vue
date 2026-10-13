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
      <!--
        FIX(2026-10-13): 按运营后台截图补「自动层级 / 固定层级」页签。
        为什么放在表格上方共用一张表：截图即为此形态（两个页签切换同一列表），
        口径 = 按 level_type 过滤（1 自动 / 2 固定），与后端 MemberLevelQuery.levelType 一致。
      -->
      <el-tabs v-model="activeLevelType" class="mb-2" @tab-change="handleLevelTypeChange">
        <el-tab-pane label="自动层级" name="1" />
        <el-tab-pane label="固定层级" name="2" />
      </el-tabs>
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
        <!-- FIX(2026-10-13): 截图新增「关联标签」列（一个层级可挂一个会员标签，用于层级↔标签联动） -->
        <el-table-column label="关联标签" align="center" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.tagName" type="info" effect="dark">{{ row.tagName }}</el-tag>
            <span v-else>—</span>
          </template>
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
        <!-- FIX(2026-10-13): 截图弹窗内的「关联标签」配置项（可清空=不关联，保存 0） -->
        <el-form-item label="关联标签">
          <el-select v-model="form.tagId" placeholder="不关联" clearable style="width: 100%">
            <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
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
          <!-- FIX(2026-10-13): 截图详情页有「导出报表」；导出当前筛选条件下的层级会员明细（CSV，UTF-8 BOM） -->
          <el-button icon="Download" @click="exportMembers">导出报表</el-button>
        </div>
      </div>

      <el-table v-loading="memberLoading" border :data="memberRows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <!-- FIX(2026-10-13): 按截图补齐详情列：币种 / 上级代理 / 利息宝 / 总有效投注 / 操作人 / 操作时间 / 层级锁定 -->
        <el-table-column label="币种" prop="currency" align="center" width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.currency || 'VND' }}</template>
        </el-table-column>
        <el-table-column label="会员ID" prop="uid" align="center" width="150" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="上级代理" align="center" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.parentAgentName || '—' }}</template>
        </el-table-column>
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
        <el-table-column label="利息宝" align="right" width="120">
          <template #default="{ row }">{{ fmtYuan(row.interestBalance) }}</template>
        </el-table-column>
        <el-table-column label="奖励钱包" align="right" width="130">
          <template #default="{ row }">{{ fmtYuan(row.bonusBalance) }}</template>
        </el-table-column>
        <el-table-column label="总有效投注" align="right" width="140">
          <template #default="{ row }">{{ fmtYuan(row.validBetAmount) }}</template>
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
        <el-table-column label="操作人" align="center" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.operatorId || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" width="170">
          <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
        </el-table-column>
        <el-table-column label="层级锁定" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isLocked === 1"
              v-hasPermi="['member:user:edit']"
              @change="(value: boolean) => toggleLock(row as MemberLevelMemberVO, value)"
            />
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
// FIX(2026-10-13): 层级「关联标签」下拉复用会员标签字典（/infra/member/tag/options）
import { listMemberTagOptions } from '@/api/member/tag';
import type { MemberTagVO } from '@/api/member/tag/types';

/** 后端返回体：分页接口是 {rows,total}，对象接口是 {code,msg,data}（见 utils/request 拦截器直出 body） */
type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: memberLoading, withLoading: withMemberLoading } = useLoading(true);
const { loading: buttonLoading, withLoading: withButtonLoading } = useLoading(false);

const rows = ref<MemberLevelVO[]>([]);
const total = ref(0);
const levelOptions = ref<MemberLevelVO[]>([]);
/** 关联标签下拉数据源（截图弹窗内的「关联标签」配置项） */
const tagOptions = ref<MemberTagVO[]>([]);
/** 当前页签：1=自动层级 2=固定层级（截图两个页签共用同一列表，等价于 levelType 过滤） */
const activeLevelType = ref<string>('1');
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

/** 加载可用标签（仅启用；用于层级关联标签下拉）。 */
const loadTagOptions = async () => {
  const res = (await listMemberTagOptions()) as unknown as DataBody<MemberTagVO[]>;
  tagOptions.value = res.data ?? [];
};

/** 切换「自动层级 / 固定层级」页签：按 levelType 过滤并回到第一页。 */
const handleLevelTypeChange = (name: string | number) => {
  queryParams.value.levelType = Number(name);
  queryParams.value.pageNum = 1;
  getList();
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
  form.value = { levelName: '', levelType: queryParams.value.levelType ?? 1, minDepositCount: 0, minDepositAmountYuan: 0, sortOrder: 0, status: 1, tagId: undefined };
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
    tagId: row.tagId && row.tagId > 0 ? row.tagId : undefined,
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
    // 传 0 表示取消关联（后端仅在非 null 时更新，避免误清空）
    tagId: form.value.tagId ?? 0,
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

/**
 * 层级锁定开关（截图详情「层级锁定」列）。
 *
 * 为什么复用 assign 接口：层级锁定与层级归属同属"归属变更"，服务端 assign 已支持 isLocked 且
 * 幂等（同层级同锁定态会跳过），并会写 member_level_change_log 留痕，无需新开接口。
 * 注意：对"未登记归属"的会员（默认层级）会按 levelId=当前层级 落一行归属，属预期。
 */
const toggleLock = async (row: MemberLevelMemberVO, locked: boolean) => {
  if (!currentLevelId.value) {
    return;
  }
  const action = locked ? '开启' : '关闭';
  if (!(await confirmed(`确认${action}会员「${row.loginName}」的层级锁定？锁定后该会员层级不会被自动升降级覆盖。`))) {
    return;
  }
  await assignMemberLevel({
    uid: row.uid,
    levelId: currentLevelId.value,
    isLocked: locked ? 1 : 0,
    changeReason: `层级锁定${action}`
  });
  modal.msgSuccess('操作成功');
  await getMemberList();
};

/**
 * 导出报表（截图详情页按钮）。
 *
 * 为什么在前端拼 CSV：与「会员投注细目」页既有导出实现同源（前端生成 + UTF-8 BOM，Excel 直接可读），
 * 后端无对应导出接口，避免为一个导出新增服务端接口与鉴权面；分页拉取直到取完，上限 20000 行防误操作。
 */
const exportMembers = async () => {
  if (!currentLevelId.value) {
    return;
  }
  const pageSize = 500;
  const maxRows = 20000;
  const collected: MemberLevelMemberVO[] = [];
  let pageNum = 1;
  while (collected.length < maxRows) {
    const res = (await listLevelMembers(currentLevelId.value as number, {
      ...memberQuery,
      pageNum,
      pageSize
    })) as unknown as PageBody<MemberLevelMemberVO>;
    const pageRows = res.rows ?? [];
    collected.push(...pageRows);
    if (pageRows.length < pageSize) {
      break;
    }
    pageNum += 1;
  }
  if (collected.length === 0) {
    modal.msgWarning('暂无可导出数据');
    return;
  }
  const header = [
    '币种', '会员ID', '会员账号', '上级代理', '注册时间', '充值总额', '充值次数', '最大充值金额',
    '提现总额', '提现次数', 'VIP等级', '余额', '利息宝', '奖励钱包', '总有效投注', '层级',
    '操作人', '操作时间', '层级锁定'
  ];
  const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [header.map(esc).join(',')];
  collected.forEach((row) => {
    lines.push(
      [
        row.currency ?? 'VND',
        row.uid,
        row.loginName ?? '',
        row.parentAgentName ?? '',
        row.registerAt ?? '',
        fmtYuan(row.rechargeAmount),
        row.rechargeCount ?? 0,
        fmtYuan(row.maxDepositAmount),
        fmtYuan(row.withdrawAmount),
        row.withdrawCount ?? 0,
        `VIP${row.vipLevel ?? 0}`,
        fmtYuan(row.availableBalance),
        fmtYuan(row.interestBalance),
        fmtYuan(row.bonusBalance),
        fmtYuan(row.validBetAmount),
        row.levelName ?? '',
        row.operatorId ?? '',
        row.updatedAt ?? '',
        row.isLocked === 1 ? '是' : '否'
      ]
        .map(esc)
        .join(',')
    );
  });
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `层级详情_${detail.title.replace(/[\\/:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  modal.msgSuccess(`已导出 ${collected.length} 条`);
};

onMounted(async () => {
  await loadOptions();
  await loadTagOptions();
  await getList();
});
</script>
