<template>
  <div class="p-2 app-container member-tag-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="标签名称/代码" clearable style="width: 200px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="游戏限制">
          <el-select v-model="queryParams.gameRestrictType" placeholder="全部" clearable style="width: 130px">
            <el-option label="不限制" :value="0" />
            <el-option label="白名单" :value="1" />
            <el-option label="黑名单" :value="2" />
          </el-select>
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
            <h3>会员标签</h3>
            <p>共 {{ total }} 个标签；标签人数为实时统计，删除前需先摘标。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:tag:edit']" plain icon="PriceTag" @click="openBindDialog">批量打标</el-button>
            <el-button v-hasPermi="['member:tag:edit']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="排序" prop="sortOrder" align="center" width="80" />
        <el-table-column label="ID" prop="tagId" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="图标" align="center" width="150">
          <template #default="{ row }">
            <el-tag :style="{ backgroundColor: row.tagColor || '#409EFF', color: '#fff', border: 'none' }">
              {{ row.tagName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签名称" prop="tagName" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="标签代码" prop="tagCode" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" align="left" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="游戏限制类型" align="center" width="130">
          <template #default="{ row }">{{ restrictLabel(row.gameRestrictType) }}</template>
        </el-table-column>
        <el-table-column label="标签人数" align="center" width="110">
          <template #default="{ row }">
            <el-link
              v-if="Number(row.memberCount) > 0"
              type="primary"
              :underline="false"
              @click="goMembers(row as MemberTagVO)"
              >{{ row.memberCount }}</el-link
            >
            <span v-else class="text-gray-400">0</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="140" show-overflow-tooltip />
        <el-table-column label="操作时间" prop="updatedAt" align="center" width="170" />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:tag:edit']" link type="primary" @click="handleUpdate(row as MemberTagVO)">修改</el-button>
            <el-button v-hasPermi="['member:tag:edit']" link type="danger" @click="handleDelete(row as MemberTagVO)">删除</el-button>
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

    <!-- 新增/修改标签 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="标签名称" prop="tagName">
          <el-input v-model="form.tagName" placeholder="如：高风险 / 可疑风险" maxlength="50" />
        </el-form-item>
        <el-form-item label="标签代码" prop="tagCode">
          <el-input v-model="form.tagCode" placeholder="英文唯一代码，如 HIGH_RISK" maxlength="50" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="form.tagColor" />
          <el-tag class="ml-2" :style="{ backgroundColor: form.tagColor || '#409EFF', color: '#fff', border: 'none' }">
            {{ form.tagName || '标签预览' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="255" placeholder="该标签的风控/运营含义" />
        </el-form-item>
        <el-form-item label="游戏限制类型">
          <el-select v-model="form.gameRestrictType" style="width: 100%">
            <el-option label="不限制" :value="0" />
            <el-option label="白名单（仅允许指定厂商）" :value="1" />
            <el-option label="黑名单（限制指定厂商）" :value="2" />
          </el-select>
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

    <!-- 打标：按会员ID/账号批量打标（会员列表批量入口复用本接口） -->
    <el-dialog v-model="bindDialog.visible" title="批量打标" width="620px" append-to-body destroy-on-close>
      <el-form label-width="130px">
        <el-form-item label="标签" required>
          <el-select v-model="bindForm.tagIds" multiple placeholder="请选择标签" style="width: 100%">
            <el-option v-for="item in options" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员ID" required>
          <el-input
            v-model="bindForm.uidText"
            type="textarea"
            :rows="4"
            placeholder="支持英文逗号、中文逗号或换行分隔，单次最多 200 个会员ID"
          />
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="bindForm.mode">
            <el-radio value="bind">打标</el-radio>
            <el-radio value="unbind">摘标</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="buttonLoading" @click="submitBind">确 定</el-button>
        <el-button @click="bindDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberTag" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addMemberTag,
  bindMemberTag,
  delMemberTag,
  listMemberTag,
  listMemberTagOptions,
  unbindMemberTag,
  updateMemberTag
} from '@/api/member/tag';
import type { MemberTagForm, MemberTagQuery, MemberTagVO } from '@/api/member/tag/types';

/** 后端返回体：分页 {rows,total}；对象 {code,msg,data}（request 拦截器直出 body） */
type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const router = useRouter();
const { loading, withLoading } = useLoading(true);
const { loading: buttonLoading, withLoading: withButtonLoading } = useLoading(false);

const rows = ref<MemberTagVO[]>([]);
const options = ref<MemberTagVO[]>([]);
const total = ref(0);
const formRef = ref();
const dialog = reactive({ visible: false, title: '' });
const bindDialog = reactive({ visible: false });

const data = reactive<{ queryParams: MemberTagQuery; form: MemberTagForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  form: { tagName: '', tagCode: '', tagColor: '#409EFF', gameRestrictType: 0, sortOrder: 0, status: 1 }
});
const { queryParams, form } = toRefs(data);

const bindForm = reactive<{ tagIds: number[]; uidText: string; mode: 'bind' | 'unbind' }>({
  tagIds: [],
  uidText: '',
  mode: 'bind'
});

const rules = {
  tagName: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
  tagCode: [{ required: true, message: '标签代码不能为空', trigger: 'blur' }]
};

/** 二次确认：收敛 ElMessageBox 取消时的 reject，避免点击取消产生未捕获错误 */
const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

const restrictLabel = (type?: number) => {
  if (type === 1) {
    return '白名单';
  }
  if (type === 2) {
    return '黑名单';
  }
  return '不限制';
};

const getList = async () => {
  await withLoading(async () => {
    const res = (await listMemberTag(queryParams.value)) as unknown as PageBody<MemberTagVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const loadOptions = async () => {
  const res = (await listMemberTagOptions()) as unknown as DataBody<MemberTagVO[]>;
  options.value = res.data ?? [];
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  getList();
};

const handleAdd = () => {
  form.value = { tagName: '', tagCode: '', tagColor: '#409EFF', gameRestrictType: 0, sortOrder: 0, status: 1 };
  dialog.title = '新增标签';
  dialog.visible = true;
};

const handleUpdate = (row: MemberTagVO) => {
  form.value = {
    tagId: row.tagId,
    tagName: row.tagName,
    tagCode: row.tagCode,
    tagColor: row.tagColor ?? '#409EFF',
    gameRestrictType: row.gameRestrictType ?? 0,
    sortOrder: row.sortOrder ?? 0,
    description: row.description,
    status: row.status ?? 1
  };
  dialog.title = '修改标签';
  dialog.visible = true;
};

const closeDialog = () => {
  dialog.visible = false;
};

const submitForm = async () => {
  await formRef.value?.validate();
  await withButtonLoading(async () => {
    if (form.value.tagId) {
      await updateMemberTag(form.value);
    } else {
      await addMemberTag(form.value);
    }
  });
  modal.msgSuccess('操作成功');
  closeDialog();
  await getList();
  await loadOptions();
};

const handleDelete = async (row: MemberTagVO) => {
  if (!(await confirmed(`确认删除标签「${row.tagName}」？标签下若有会员将无法删除。`))) {
    return;
  }
  await delMemberTag(row.tagId);
  modal.msgSuccess('删除成功');
  await getList();
  await loadOptions();
};

/**
 * 标签人数钻取：跳转会员列表并按标签过滤。
 *
 * 为什么先 resolve 再跳转：会员列表菜单由 sys_menu 下发，若当前角色未授权该页面，
 * 直接 push 会跳到 404；这里先校验路由是否已注册，给出可读提示。
 * 注：会员列表按 tagId 过滤在 01 文档「所有会员扩展」批次落地。
 */
const goMembers = (row: MemberTagVO) => {
  const target = router.resolve({ path: '/member/users' });
  if (target.matched.length === 0) {
    modal.msgWarning('未找到会员列表菜单，请确认已分配该菜单权限');
    return;
  }
  router.push({ path: '/member/users', query: { tagId: String(row.tagId), tagName: row.tagName } });
};

const openBindDialog = () => {
  bindForm.tagIds = [];
  bindForm.uidText = '';
  bindForm.mode = 'bind';
  bindDialog.visible = true;
};

/**
 * 解析会员ID输入框。
 *
 * FIX(2026-10-10): 返回**字符串**而不是 number。
 * 原因：会员UID 是 19 位雪花ID（如 2108388244222775296），超出 JS 安全整数范围，
 * 原实现 `.map(Number)` 会丢精度（…775296 → …775300），后端拿错误 uid 查不到会员，
 * bind() 静默 continue，最终"影响 0 条"但界面提示成功。
 * 解决方案：仅做数字格式校验，保留原始字符串；服务端 List<Long> 可直接接收数字字符串。
 */
const parseUids = (text: string): string[] =>
  text
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^\d+$/.test(item));

const submitBind = async () => {
  const uids = parseUids(bindForm.uidText);
  if (bindForm.tagIds.length === 0) {
    modal.msgWarning('请选择标签');
    return;
  }
  if (uids.length === 0) {
    modal.msgWarning('请输入会员ID');
    return;
  }
  if (uids.length > 200) {
    modal.msgWarning('单次最多支持 200 个会员ID');
    return;
  }
  const payload = { uids, tagIds: bindForm.tagIds };
  const res = (await withButtonLoading(async () =>
    bindForm.mode === 'bind' ? bindMemberTag(payload) : unbindMemberTag(payload)
  )) as unknown as DataBody<number>;
  // FIX(2026-10-10): 影响 0 条时必须给出可读提示，不能一律报"成功"（否则用户以为打标成功但列表看不到）。
  const affected = res?.data ?? 0;
  if (affected > 0) {
    modal.msgSuccess(`操作完成（影响 ${affected} 条）`);
  } else {
    modal.msgWarning('未产生任何变更：请确认会员ID是否存在，或该会员与所选标签之间已无变化');
  }
  bindDialog.visible = false;
  bindForm.uidText = '';
  bindForm.tagIds = [];
  await getList();
};

defineExpose({ bindDialog, bindForm });

onMounted(async () => {
  await loadOptions();
  await getList();
});
</script>
