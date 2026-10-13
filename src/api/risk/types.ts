/**
 * 风控域共用类型。
 *
 * 背景：黑名单与派奖监控两个页面都要展示 sys_dict_data 里的下拉选项，
 * 后端统一返回 `{ label, value, listClass, remark }`（OpsReportCommonMapper.selectDictOptions），
 * 因此把该结构放在风控域公共文件里，避免两个模块各定义一份导致形状漂移。
 */

/** 后端字典选项（来自 sys_dict_data：dict_label / dict_value） */
export interface RiskDictOption {
  label: string;
  value: string;
  /** sys_dict_data.list_class，页面可用它标注标签颜色 */
  listClass?: string;
  remark?: string;
}
