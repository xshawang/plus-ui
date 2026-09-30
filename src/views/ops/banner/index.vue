<template>
  <div class="p-2 app-container ops-banner-page">
    <el-card shadow="hover" class="search-panel">
      <div class="panel-heading">
        <div>
          <span class="panel-kicker">Lobby Banner</span>
          <h3>大厅Banner</h3>
          <p class="muted">
            客户端只认加密配置 8go88.bin 里的
            <code>bannerInfo.configBanner</code>；本页维护结构化条目，点「发布」后由后端组装回该配置并加密回写（自动备份原文件）。
          </p>
        </div>
        <div class="toolbar-actions">
          <el-tag :type="pendingCount > 0 ? 'warning' : 'success'">
            {{ pendingCount > 0 ? `待发布 ${pendingCount} 项变更` : '已与客户端配置一致' }}
          </el-tag>
          <el-button v-hasPermi="['ops:banner:edit']" type="primary" plain icon="Plus" @click="handleAdd">
            新增
          </el-button>
          <el-button
            v-hasPermi="['ops:banner:publish']"
            type="danger"
            plain
            icon="Upload"
            :loading="publishing"
            @click="handlePublish"
          >
            发布到客户端
          </el-button>
          <el-button icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </div>
      <el-descriptions :column="4" border size="small" class="mt-2">
        <el-descriptions-item label="启用条目">{{ enabledCount }}</el-descriptions-item>
        <el-descriptions-item label="已发布条目">{{ publishedCount }}</el-descriptions-item>
        <el-descriptions-item label="配置库更新时间">{{ fmt(bannerInfoUpdatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="配置文件">
          {{ fileExists ? `${fileSize} 字节 · ${fmt(fileUpdatedAt)}` : '文件不存在' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="顺序" align="center" width="120">
          <template #default="{ $index }">
            <span class="font-mono">{{ $index }}</span>
            <el-button
              v-hasPermi="['ops:banner:edit']"
              link
              type="primary"
              :disabled="$index === 0"
              @click="move($index, -1)"
            >
              上移
            </el-button>
            <el-button
              v-hasPermi="['ops:banner:edit']"
              link
              type="primary"
              :disabled="$index === rows.length - 1"
              @click="move($index, 1)"
            >
              下移
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="预览" align="center" width="140">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl.startsWith('http') ? row.imageUrl : ''"
              :preview-src-list="row.imageUrl.startsWith('http') ? [row.imageUrl] : []"
              fit="contain"
              style="width: 110px; height: 40px"
            >
              <template #error>
                <span class="muted small">相对路径</span>
              </template>
            </el-image>
            <span v-else class="muted small">—</span>
          </template>
        </el-table-column>
        <el-table-column label="标识" prop="namebanner" min-width="170" :show-overflow-tooltip="true" />
        <el-table-column label="图片地址" prop="imageUrl" min-width="240" :show-overflow-tooltip="true" />
        <el-table-column label="跳转" align="center" min-width="180">
          <template #default="{ row }">
            <el-tag size="small">{{ actionLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分端" align="center" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.mobileEnable === 1" size="small" type="success">移动端</el-tag>
            <el-tag v-if="row.webEnable === 1" size="small" type="warning">Web</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="VIP门槛" align="center" width="110">
          <template #default="{ row }">{{ row.vipMinAmount ? formatMoney(row.vipMinAmount) : '不限' }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['ops:banner:edit']" link type="primary" @click="handleUpdate(row)">
              修改
            </el-button>
            <el-button v-hasPermi="['ops:banner:edit']" link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Banner标识" prop="namebanner">
          <el-input v-model="form.namebanner" :disabled="!!form.id" placeholder="如 banner_eventAseanCup（仅字母数字下划线）" />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <div style="width: 100%">
            <image-upload v-model="form.imageUrl" :limit="1" />
            <div class="muted small">
              新图走 OSS 上传得到 https 绝对地址（老图保留 /banner/ 相对路径，不必迁移）。
            </div>
          </div>
        </el-form-item>
        <el-form-item label="跳转类型" prop="actionType">
          <el-radio-group v-model="form.actionType">
            <el-radio value="none">不跳转</el-radio>
            <el-radio value="events">活动页</el-radio>
            <el-radio value="url">外链</el-radio>
            <el-radio value="game">游戏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.actionType === 'game'" label="游戏编码" prop="actionGameid">
          <el-input v-model="form.actionGameid" placeholder="如 vgmn_100 / sbt_1004" />
        </el-form-item>
        <el-form-item v-if="form.actionType === 'url'" label="外链地址" prop="actionUrl">
          <el-input v-model="form.actionUrl" placeholder="必须为 https 地址" />
        </el-form-item>
        <el-form-item label="展示端">
          <el-checkbox v-model="mobileEnable" :true-value="1" :false-value="0">移动端</el-checkbox>
          <el-checkbox v-model="webEnable" :true-value="1" :false-value="0">Web</el-checkbox>
        </el-form-item>
        <el-form-item label="VIP门槛">
          <el-input-number v-model="form.vipMinAmount" :min="0" :step="100000" />
          <span class="muted small ml-2">0=不限（本期仅后台保存，服务端过滤在批次B启用）</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用（不参与发布）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确定</el-button>
          <el-button @click="dialog.visible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsBanner" lang="ts">
import ImageUpload from '@/components/ImageUpload/index.vue';
import { addBanner, delBanner, listBanner, publishBanner, sortBanner, updateBanner } from '@/api/ops/banner';
import type { BannerForm, BannerVO } from '@/api/ops/banner/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import modal from '@/plugins/modal';

const rows = ref<BannerVO[]>([]);
const enabledCount = ref(0);
const publishedCount = ref(0);
const bannerInfoUpdatedAt = ref<string | null>(null);
const fileExists = ref(false);
const fileSize = ref(0);
const fileUpdatedAt = ref<string | null>(null);

const { loading, withLoading } = useLoading(true);
const { loading: buttonLoading, withLoading: withButtonLoading } = useLoading();
const publishing = ref(false);
const formRef = ref<ElFormInstance>();
const { dialog, openDialog } = useDialogState('大厅Banner');

const initForm: BannerForm = {
  id: undefined,
  namebanner: '',
  imageUrl: '',
  actionType: 'game',
  actionGameid: '',
  actionUrl: '',
  mobileEnable: 1,
  webEnable: 1,
  vipMinAmount: 0,
  status: 1,
  remark: ''
};
const form = ref<BannerForm>({ ...initForm });
const rules = {
  namebanner: [{ required: true, message: 'Banner 标识不能为空', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传图片或填写图片地址', trigger: 'change' }],
  actionType: [{ required: true, message: '请选择跳转类型', trigger: 'change' }]
};

/** 勾选框与表单字段的双向桥接（el-checkbox 需要 0/1 值而表单里是 number） */
const mobileEnable = computed({
  get: () => form.value.mobileEnable ?? 1,
  set: value => (form.value.mobileEnable = value)
});
const webEnable = computed({
  get: () => form.value.webEnable ?? 1,
  set: value => (form.value.webEnable = value)
});

/**
 * 待发布变更数 = 启用条数与已发布条数之差。
 * 这是"有没有改动没发出去"的粗略但直观的提示；精细 diff 需要服务端比对（本期不做）。
 */
const pendingCount = computed(() => Math.abs(enabledCount.value - publishedCount.value));

const fmt = (value?: string | null) => (value ? String(value).replace('T', ' ').slice(0, 19) : '—');
const formatMoney = (value?: number) => Number(value ?? 0).toLocaleString('en-US');
const actionLabel = (row: BannerVO) => {
  if (row.actionType === 'events') return '活动页';
  if (row.actionType === 'url') return `外链 ${row.actionUrl || ''}`;
  if (row.actionType === 'game') return `游戏 ${row.actionGameid || ''}`;
  return '不跳转';
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listBanner();
    rows.value = res.data?.rows ?? [];
    enabledCount.value = res.data?.enabledCount ?? 0;
    publishedCount.value = res.data?.publishedCount ?? 0;
    bannerInfoUpdatedAt.value = res.data?.bannerInfoUpdatedAt ?? null;
    fileExists.value = res.data?.fileExists ?? false;
    fileSize.value = res.data?.fileSize ?? 0;
    fileUpdatedAt.value = res.data?.fileUpdatedAt ?? null;
  });
};

const handleAdd = () => {
  form.value = { ...initForm };
  openDialog('新增大厅Banner');
};

const handleUpdate = (row: BannerVO) => {
  form.value = { ...row };
  openDialog('修改大厅Banner');
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    await withButtonLoading(async () => {
      if (form.value.id) {
        await updateBanner(form.value);
      } else {
        await addBanner(form.value);
      }
    });
    modal.msgSuccess('已保存（记得点「发布到客户端」才会写入 8go88.bin）');
    dialog.visible = false;
    await getList();
  });
};

const move = async (index: number, delta: number) => {
  const next = [...rows.value];
  const target = index + delta;
  [next[index], next[target]] = [next[target], next[index]];
  rows.value = next;
  await sortBanner(next.map(item => item.id));
  await getList();
};

const handleDelete = async (row: BannerVO) => {
  await modal.confirm(`确认删除 Banner「${row.namebanner}」？删除后需重新发布才会同步到客户端。`);
  await delBanner([row.id]);
  modal.msgSuccess('已删除');
  await getList();
};

/**
 * 发布到客户端。
 *
 * 为什么必须二次确认：发布会加密回写 8go88.bin（客户端启动强依赖的文件），
 * 属高危配置动作；后端已做校验与备份，但前端仍需明确提示影响面。
 */
const handlePublish = async () => {
  await modal.confirm(
    `确认发布 ${enabledCount.value} 条启用中的 Banner 到客户端配置？将加密回写 8go88.bin（自动备份原文件）。`
  );
  publishing.value = true;
  try {
    const res = await publishBanner();
    modal.msgSuccess(
      `发布完成：已写入 ${res.data?.publishedCount ?? 0} 条，配置文件 ${res.data?.fileExists ? '已更新' : '未生成'}`
    );
    await getList();
  } finally {
    publishing.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
