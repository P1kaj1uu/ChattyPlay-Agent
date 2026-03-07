/**
 * 订单相关类型定义
 */

// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = 1, // 待付款
  PENDING_SHIPMENT = 2, // 待发货
  PENDING_RECEIPT = 3, // 待收货
  COMPLETED = 4, // 交易成功
  CLOSED = 6, // 已关闭
}

// 订单状态文本映射
export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: "获取中",
  [OrderStatus.PENDING_PAYMENT]: "待付款",
  [OrderStatus.PENDING_SHIPMENT]: "待发货",
  [OrderStatus.PENDING_RECEIPT]: "待收货",
  [OrderStatus.COMPLETED]: "交易成功",
  [OrderStatus.CLOSED]: "已关闭",
};

// 数据库订单记录
export interface OrderRecord {
  id: number;
  orderId: string;
  accountId: string;
  itemId: string | null;
  itemTitle: string | null;
  itemPicUrl: string | null;
  price: string | null;
  buyerUserId: string | null;
  buyerNickname: string | null;
  chatId: string | null;
  status: number;
  statusText: string;
  orderTime: string;
  payTime: string | null;
  shipTime: string | null;
  completeTime: string | null;
  createdAt: string;
  updatedAt: string;
}

// 订单详情 API 响应数据
export interface OrderDetailData {
  orderId: number;
  bizOrderId?: number;
  itemId: number;
  peerUserId: number;
  seller: boolean;
  status: number;
  components: OrderComponent[];
  bottomBarVO?: {
    buttonList: OrderButton[];
  };
  utArgs?: {
    orderStatusName: string;
    orderMainTitle: string;
    orderId: string;
    orderStatus: string;
  };
}

export interface OrderComponent {
  render: string;
  data: any;
}

export interface OrderButton {
  name: string;
  style: string;
  tradeAction: string;
  buttonDisable: boolean;
}

// 订单列表查询参数
export interface OrderListParams {
  accountId?: string;
  status?: number;
  limit?: number;
  offset?: number;
}

// 订单列表响应
export interface OrderListResponse {
  orders: OrderRecord[];
  total: number;
  limit: number;
  offset: number;
}
