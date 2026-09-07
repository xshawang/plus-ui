export interface AvatarQuery extends PageQuery {
  category?: number;
  status?: number;
  keyword?: string;
}

export interface AvatarVO {
  avatarId: number;
  avatarCode: string;
  avatarName: string;
  imageUrl: string;
  category: number;
  sortOrder: number;
  isDefault: number;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AvatarForm {
  avatarId?: number;
  avatarCode?: string;
  avatarName?: string;
  imageUrl?: string;
  category?: number;
  sortOrder?: number;
}

export interface AvatarStateForm {
  id: number;
  value: number;
}
