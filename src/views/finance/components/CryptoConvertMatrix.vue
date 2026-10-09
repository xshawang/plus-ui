<template>
  <el-card shadow="never" class="crypto-convert-card" v-loading="loading">
    <!-- 参照图：区块标题 + 右上角「修改」（查看态只读；点修改进入编辑态才出现底部「取消/确认」） -->
    <template #header>
      <div class="card-head">
        <span class="collapse-title">按汇率转为数字货币充值</span>
        <el-button
          v-if="!editing"
          v-hasPermi="['finance:recharge-config:edit']"
          type="primary"
          @click="startEdit"
        >
          修改
        </el-button>
      </div>
    </template>

    <div class="crypto-box">
      <div class="box-head">
        <span class="box-title">可转化充值的数字货币（需先添加数字货币三方支付）</span>
        <el-link type="primary" :underline="false" @click="gotoExchangeRate">汇率管理</el-link>
      </div>

      <!-- 参照图：一个币种一段，居中显示「越南(VND1000:1)」标题 + 纵向勾选清单 -->
      <div v-for="currency in displayCurrencies" :key="currency.code" class="currency-block">
        <div class="currency-title">{{ currencyTitle(currency) }}</div>
        <div class="coin-list">
          <div v-for="coin in options.coins" :key="coin.value" class="coin-row">
            <el-checkbox
              :model-value="isChecked(currency.code, coin.value)"
              :disabled="!editing || saving"
              @change="(value: string | number | boolean) => toggle(currency.code, coin.value, value)"
            >
              {{ coin.label }}
            </el-checkbox>
          </div>
        </div>
      </div>

      <div v-if="!displayCurrencies.length && !loading" class="text-gray-400 text-sm">暂无可配置币种</div>

      <div class="crypto-note">
        注意：勾选中，表示允许转换为该币种进行充值；<br />
        若某种数字货币全部不勾选（即不开放给任何会员），则该数字货币的&lt;充值通道&gt;会全部自动关闭，需至少开放(勾选)给某一种会员。
      </div>

      <div v-if="editing" class="crypto-actions">
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmEdit">确认</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import modal from '@/plugins/modal';
import { getCryptoMatrixOptions, saveCryptoMatrix } from '@/api/finance/recharge-config';
import type { CryptoMatrixCurrency, CryptoMatrixOptions } from '@/api/finance/recharge-config';

/**
 * 「按汇率转为数字货币充值」配置块（充值设置 → 按汇率转为数字货币充值）。
 *
 * 背景：参照页把"哪些数字货币可以用来充值"做成**按币种纵向罗列的勾选清单**——
 * 区块标题右侧「修改」，正文居中显示"可转化充值的数字货币（需先添加数字货币三方支付）"+ 右侧「汇率管理」，
 * 每个币种居中显示标题（如 越南(VND1000:1)），下面是 USDT…USDS 的纵向复选框；底部是红色注意事项与「取消/确认」。
 *
 * 为什么按币种分段展示：勾选配置本身是"币种 × 数字货币"的二维关系；参照页一个币种一段，
 * 这里默认只展示"平台已启用币种"（sys_currency_config.master_switch=1，例如仅越南盾 VND），与参照页一致；
 * 后续启用更多币种时会自动多出一段，无需改代码。
 *
 * 操作口径：查看态只读（只有「修改」）；点「修改」进入编辑态（复选框可点、底部出现取消/确认）；
 * 「取消」丢弃本地改动回滚到已保存值，「确认」落库（服务端校验币种与数字货币合法性）。
 */
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const editing = ref(false);
const options = reactive<CryptoMatrixOptions>({ currencies: [], coins: [], matrix: {} });
/** 编辑态草稿：取消时直接丢弃，避免"改了没保存却看起来已生效" */
const draft = ref<Record<string, string[]>>({});

const currencyTitle = (currency: CryptoMatrixCurrency) =>
  `${currency.name}(${currency.code}${currency.ratio ? currency.ratio : ''})`;

/**
 * 展示哪些币种：优先平台已启用币种；若一个都没启用，则退回"已配置过勾选的币种"或首个币种，
 * 保证页面永远有一段可配置内容（不会出现空白区块）。
 */
const displayCurrencies = computed<CryptoMatrixCurrency[]>(() => {
  const enabled = options.currencies.filter((item) => item.masterSwitch === 1);
  if (enabled.length) {
    return enabled;
  }
  const configured = options.currencies.filter((item) => (options.matrix[item.code] ?? []).length > 0);
  if (configured.length) {
    return configured;
  }
  return options.currencies.length ? [options.currencies[0]] : [];
});

const isChecked = (currencyCode: string, coin: string) => (draft.value[currencyCode] ?? []).includes(coin);

const load = async () => {
  loading.value = true;
  try {
    const res = await getCryptoMatrixOptions();
    options.currencies = res.data?.currencies ?? [];
    options.coins = res.data?.coins ?? [];
    options.matrix = res.data?.matrix ?? {};
    draft.value = cloneMatrix(options.matrix);
  } finally {
    loading.value = false;
  }
};

const cloneMatrix = (matrix: Record<string, string[]>): Record<string, string[]> =>
  Object.fromEntries(Object.entries(matrix).map(([key, value]) => [key, [...(value ?? [])]]));

/** 点「修改」：以已保存值为基线开一份草稿 */
const startEdit = () => {
  draft.value = cloneMatrix(options.matrix);
  editing.value = true;
};

/** 取消：丢弃草稿，回到查看态 */
const cancelEdit = () => {
  draft.value = cloneMatrix(options.matrix);
  editing.value = false;
};

/** 勾选/取消（仅改草稿，不落库） */
const toggle = (currencyCode: string, coin: string, value: string | number | boolean) => {
  const current = new Set(draft.value[currencyCode] ?? []);
  if (value) {
    current.add(coin);
  } else {
    current.delete(coin);
  }
  draft.value = { ...draft.value, [currencyCode]: Array.from(current) };
};

/** 确认：落库并回读服务端归一化后的结果（按币种排序、过滤非法项） */
const confirmEdit = async () => {
  saving.value = true;
  try {
    const res = await saveCryptoMatrix(draft.value);
    options.matrix = res.data?.matrix ?? draft.value;
    draft.value = cloneMatrix(options.matrix);
    editing.value = false;
    modal.msgSuccess('保存成功');
  } finally {
    saving.value = false;
  }
};

/** 汇率管理入口：跳到「汇率与银行管理」维护币种汇率（与参照页右上角链接同义） */
const gotoExchangeRate = () => router.push('/finance/exchange-rate');

onMounted(load);
</script>

<style scoped>
.crypto-convert-card {
  margin-top: 12px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.collapse-title {
  font-weight: 600;
}
.crypto-box {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px 16px;
}
.box-head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
}
.box-title {
  color: #303133;
}
.box-head .el-link {
  position: absolute;
  right: 0;
}
.currency-block {
  border-top: 1px solid #f2f6fc;
}
.currency-title {
  text-align: center;
  color: #303133;
  font-weight: 600;
  padding: 10px 0;
  border-bottom: 1px solid #f2f6fc;
}
.coin-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
}
.coin-row {
  width: 200px;
  padding: 6px 0;
  display: flex;
  justify-content: center;
}
.crypto-note {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f2f6fc;
  color: #f56c6c;
  font-size: 13px;
  line-height: 1.7;
}
.crypto-actions {
  margin-top: 12px;
  text-align: center;
}
</style>
