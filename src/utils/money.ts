/**
 * 金额展示格式化工具（运营后台统一口径）。
 *
 * 背景：后台各页面的金额字段（下单金额、赠送、余额、手续费、限额…）在库里都是「分」的整数，
 * 过去直接渲染会出现 1000 这种裸数字，既没有千分位也没有小数位，运营核对时极易看错位数。
 * 需求（2026-10-09）：页面上展示的金额一律「千分位 + 固定 2 位小数」，例如 1000 → 1,000.00。
 *
 * 口径：
 *  ① 只改「展示」，不改数值本身（不做分↔元换算），也不改可编辑输入控件与 CSV 导出内容
 *    （导出保持纯数字，避免千分位逗号破坏下游解析）；
 *  ② 空值（null/undefined/''）返回空串，保持"无数据"语义；数字 0 正常显示为 0.00；
 *  ③ 非数值字符串原样返回，避免把 '-'(占位符) 之类变成 0.00；
 *  ④ 固定使用 en-US 分组（输出 1,000.00），不随浏览器语言变化。
 */

/** 把任意入参安全转成 number；无法解析返回 NaN。 */
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return NaN;
  const text = String(value).trim().replace(/,/g, '');
  if (text === '') return NaN;
  const num = Number(text);
  return Number.isFinite(num) ? num : NaN;
};

/**
 * 金额展示：千分位 + 2 位小数（1000 → 1,000.00）。
 *
 * 空值返回空串；非数值原样返回（如 '-'、'—'）。
 */
export const formatMoney = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = toNumber(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** 带符号金额：正数补 '+'，负数保留 '-'（用于流水变动金额）。 */
export const formatSignedMoney = (value: unknown): string => {
  const num = toNumber(value);
  if (Number.isNaN(num)) return value === null || value === undefined ? '' : String(value);
  return (num >= 0 ? '+' : '-') + formatMoney(Math.abs(num));
};

/** 金额区间展示：'1,000.00 ~ 5,000.00'（用于单笔限额等上下限字段）。 */
export const formatMoneyRange = (min: unknown, max: unknown): string =>
  `${formatMoney(min)} ~ ${formatMoney(max)}`;

/**
 * 金额清单展示（逗号分隔的金额字符串，如推荐金额 '50000,100000'）。
 *
 * 为什么用 ' / ' 连接：千分位本身带逗号，继续用逗号分隔会让人分不清分组与分隔符。
 */
export const formatMoneyList = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .map((item) => formatMoney(item))
    .join(' / ');
};

/**
 * el-table-column 的 formatter 适配器（表格金额列一行搞定）。
 *
 * 用法：<el-table-column label="订单金额" prop="amount" :formatter="moneyColumnFormatter" />
 */
export const moneyColumnFormatter = (_row: unknown, _column: unknown, cellValue: unknown): string =>
  formatMoney(cellValue);

/** el-table-column 的 formatter 适配器（逗号分隔的金额清单，如推荐金额）。 */
export const moneyListColumnFormatter = (_row: unknown, _column: unknown, cellValue: unknown): string =>
  formatMoneyList(cellValue);
