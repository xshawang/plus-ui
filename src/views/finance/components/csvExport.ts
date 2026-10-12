/**
 * 财务页面通用导出工具（需求文档 2_财务/10、11 的"导出字段列表"）。
 *
 * 背景：运营导出前会勾选需要的列（"导出字段列表"弹窗），因此导出必须按选中列裁剪；
 * 数据源就是当前页签的列表数据，导出在浏览器本地完成，避免为导出再开一个后端大结果集接口。
 */
export interface CsvColumn {
  /** 列标题（表头） */
  label: string;
  /** 取值字段名 */
  prop: string;
  /** 可选：值格式化（如状态码转中文） */
  format?: (row: Record<string, unknown>) => string;
}

/**
 * 导出 CSV 并触发浏览器下载。
 *
 * 为什么要处理"逗号/引号/换行"：CSV 不做转义会让含逗号的备注串列，导致 Excel 打开后错列。
 */
export function exportCsv(fileName: string, rows: Array<Record<string, unknown>>, columns: CsvColumn[]) {
  const header = columns.map((column) => escapeCsv(column.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const raw = column.format ? column.format(row) : row[column.prop];
          return escapeCsv(raw === undefined || raw === null ? '' : String(raw));
        })
        .join(',')
    )
    .join('\n');
  // 加 BOM 让 Excel 正确识别 UTF-8，避免中文乱码
  const content = '\uFEFF' + header + '\n' + body;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
