/**
 * 商品相关类型定义
 */

// 商品信息
export interface GoodsItem {
  id: string;
  title: string;
  price: string;
  picUrl: string;
  picWidth: number;
  picHeight: number;
  categoryId: number;
  itemStatus: number; // 0: 在售
  hasVideo: boolean;
  soldPrice?: string;
  postInfo?: string;
  accountId?: string;
  accountNickname?: string;
}

// 商品列表结果
export interface GoodsListResult {
  items: GoodsItem[];
  nextPage: boolean;
  totalCount: number;
}
