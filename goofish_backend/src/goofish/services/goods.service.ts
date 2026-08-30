/**
 * 商品服务
 */

import { API_ENDPOINTS, WS_CONFIG } from "../core/constants";
import { CookiesManager } from "../core/cookies.manager";
import { generateSign } from "../utils/crypto";
import { createLogger } from "../core/logger";
import type { GoodsItem, GoodsListResult } from "../types/index";

const logger = createLogger("Svc:Goods");

/**
 * 获取商品列表
 */
export async function fetchGoodsList(
  accountId: string,
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<GoodsListResult> {
  try {
    const cookiesStr = CookiesManager.getCookies(accountId);
    if (!cookiesStr) {
      logger.error(`[${accountId}] 无法获取 cookies`);
      return { items: [], nextPage: false, totalCount: 0 };
    }

    const timestamp = Date.now().toString();
    const dataVal = JSON.stringify({ userId, pageNumber: page, pageSize });
    const h5Token = CookiesManager.getH5Token(accountId);
    const sign = generateSign(timestamp, h5Token, dataVal);

    const params = new URLSearchParams({
      jsv: "2.7.2",
      appKey: WS_CONFIG.SIGN_APP_KEY,
      t: timestamp,
      sign,
      v: "1.0",
      type: "originaljson",
      accountSite: "xianyu",
      dataType: "json",
      timeout: "20000",
      api: "mtop.idle.web.xyh.item.list",
    });

    const res = await fetch(`${API_ENDPOINTS.ITEM_LIST}?${params}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://www.goofish.com",
        referer: "https://www.goofish.com/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        cookie: cookiesStr,
      },
      body: `data=${encodeURIComponent(dataVal)}`,
    });

    CookiesManager.handleResponseCookies(accountId, res);

    const resJson = await res.json();

    if (resJson?.ret?.some((r: string) => r.includes("SUCCESS"))) {
      const data = resJson.data || {};
      const cardList = data.cardList || [];

      const items: GoodsItem[] = cardList.map((card: any) => {
        const cardData = card.cardData || {};
        const detailParams = cardData.detailParams || {};
        const picInfo = cardData.picInfo || {};
        const priceInfo = cardData.priceInfo || {};

        return {
          id: cardData.id || detailParams.itemId || "",
          title: cardData.title || detailParams.title || "",
          price: priceInfo.price || detailParams.soldPrice || "",
          picUrl: picInfo.picUrl || detailParams.picUrl || "",
          picWidth: picInfo.width || parseInt(detailParams.picWidth) || 0,
          picHeight: picInfo.height || parseInt(detailParams.picHeight) || 0,
          categoryId: cardData.categoryId || 0,
          itemStatus: cardData.itemStatus ?? 0,
          hasVideo: picInfo.hasVideo || false,
          soldPrice: detailParams.soldPrice,
          postInfo: detailParams.postInfo,
        };
      });

      logger.info(`[${accountId}] 获取商品列表成功，共 ${items.length} 件商品`);
      return {
        items,
        nextPage: data.nextPage || false,
        totalCount: data.totalCount || items.length,
      };
    }

    logger.warn(
      `[${accountId}] 获取商品列表失败: ${JSON.stringify(resJson?.ret)}`,
    );
    return { items: [], nextPage: false, totalCount: 0 };
  } catch (e) {
    logger.error(`[${accountId}] 获取商品列表异常: ${e}`);
    return { items: [], nextPage: false, totalCount: 0 };
  }
}
