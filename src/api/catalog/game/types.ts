export interface GameCatalogVO extends BaseEntity {
  id?: string | number;
  /** 游戏ID（业务ID） */
  gameId?: number;
  /** 游戏代码（唯一标识，如 kts_9848） */
  gameCode?: string;
  /** 游戏中文名称 */
  gameName?: string;
  /** 游戏越南文名称 */
  gameNameVn?: string;
  /** NGame ID */
  ngameId?: string;
  /** 游戏类型：1-棋牌，2-彩票，3-真人，4-电子，5-体育，6-捕鱼 */
  gameType?: number;
  /** 提供商代码 */
  providerCode?: string;
  /** 状态：0-禁用，1-启用 */
  status?: number;
  /** 客户端类型掩码 */
  clientTypeMask?: number;
  /** 启动模式：1-H5，2-APP，3-两者 */
  launchMode?: number;
  /** 排序权重（数值越大越靠前） */
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameCatalogQuery extends PageQuery {
  gameName?: string;
  gameCode?: string;
  gameType?: number;
  providerCode?: string;
  status?: number;
  params?: any;
}

export interface GameCatalogForm extends BaseEntity {
  id?: string | number;
  gameId?: number;
  gameCode?: string;
  gameName?: string;
  gameNameVn?: string;
  ngameId?: string;
  gameType?: number;
  providerCode?: string;
  status?: number;
  clientTypeMask?: number;
  launchMode?: number;
  sortOrder?: number;
}
