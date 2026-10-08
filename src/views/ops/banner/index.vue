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
          <el-popover v-if="pendingCount > 0" placement="bottom" :width="420" trigger="hover">
            <template #reference>
              <el-tag type="warning" style="cursor: pointer">待发布 {{ pendingCount }} 项变更</el-tag>
            </template>
            <div class="pending-list">
              <div v-for="(item, index) in pendingList" :key="index" class="pending-item">
                <el-tag size="small" :type="pendingTagType(item.type)">{{ pendingTagText(item.type) }}</el-tag>
                <span class="font-mono">{{ item.namebanner }}</span>
                <div class="muted small">{{ item.detail }}</div>
              </div>
            </div>
          </el-popover>
          <el-tag v-else type="success">已与客户端配置一致</el-tag>
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
      <el-alert
        class="mt-2"
        type="info"
        :closable="false"
        show-icon
        title="VIP 门槛生效条件"
        description="服务端仅在请求携带登录态（X-TOKEN/xtoken）时按钱包可用余额过滤；未登录/身份缺失一律放行。当前 g318 客户端主配置请求不带身份，VIP 门槛需客户端补透传后才会对玩家真实隐藏。"
      />
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
        <el-table-column label="生效时间" align="center" width="210">
          <template #default="{ row }">
            <div class="muted small">
              {{ row.effectiveStart ? fmt(row.effectiveStart) : '立即' }}
              ~
              {{ row.effectiveEnd ? fmt(row.effectiveEnd) : '长期' }}
            </div>
            <el-tag size="small" :type="windowTagType(row)">{{ windowTagText(row) }}</el-tag>
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
          <span class="muted small ml-2">0=不限；有登录态时按钱包可用余额过滤（未登录/身份缺失放行）</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用（不参与发布）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生效时间">
          <!--
            FIX(2026-10-08)：value-format 必须是 `YYYY-MM-DD HH:mm:ss`（空格），不能是 ISO 的 T 分隔。
            原因：后端 LocalDateTime 的 Jackson 反序列化只认空格格式，用 T 格式提交会返回
            code=400「请求参数格式错误：Text '...' could not be parsed at index 10」
            （HTTP 状态仍是 200，很容易被误判为保存成功）。
          -->
          <el-date-picker
            v-model="form.effectiveStart"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="留空=立即生效"
            style="width: 45%"
          />
          <span class="muted small mx-1">~</span>
          <el-date-picker
            v-model="form.effectiveEnd"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="留空=长期有效"
            style="width: 45%"
          />
          <div class="muted small">
            由服务端在下发时刻过滤：<b>改生效时间无需发布</b>，客户端下次拉取即按新时间窗生效（静态兜底文件仍为全量条目）。
          </div>
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
const pendingCount = ref(0);
const pendingList = ref<Array<{ type: string; namebanner: string; detail: string }>>([]);

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
  effectiveStart: null,
  effectiveEnd: null,
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
 * 待发布差异（方案A）。
 *
 * 为什么不用"启用条数 - 已发布条数"：改了图片/跳转但条数不变时该差值为 0，
 * 页面会显示"已一致"，运营误以为已生效。现在由后端逐条比对并给出差异字段。
 */
const pendingTagText = (type: string) =>
  ({ ADDED: '未发布', REMOVED: '待移除', CHANGED: '已改动', ORDER_CHANGED: '顺序变更' })[type] || type;
const pendingTagType = (type: string) =>
  ({ ADDED: 'success', REMOVED: 'danger', CHANGED: 'warning', ORDER_CHANGED: 'info' })[type] || 'info';

/**
 * 生效时间窗状态（仅页面提示）。
 *
 * 真正的过滤发生在服务端渲染时并以**服务端时间**为准，避免客户端时间被修改后绕过上下线控制；
 * 因此这里的时间显示可能与实际生效存在秒级差异，属可接受范围。
 */
const windowState = (row: BannerVO) => {
  if (row.status !== 1) return 'OFF';
  const now = Date.now();
  if (row.effectiveStart && new Date(row.effectiveStart).getTime() > now) return 'PENDING';
  if (row.effectiveEnd && new Date(row.effectiveEnd).getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
};
const windowTagText = (row: BannerVO) =>
  ({ OFF: '停用', PENDING: '未开始', EXPIRED: '已过期', ACTIVE: '生效中' })[windowState(row)] || '';
const windowTagType = (row: BannerVO) =>
  (windowState(row) === 'ACTIVE'
    ? 'success'
    : windowState(row) === 'PENDING'
      ? 'warning'
      : windowState(row) === 'EXPIRED'
        ? 'danger'
        : 'info') as 'success' | 'warning' | 'danger' | 'info';

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
    pendingCount.value = res.data?.pendingCount ?? 0;
    pendingList.value = res.data?.pending ?? [];
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

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow: auto;
}

.pending-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  line-height: 1.5;
}
</style>
