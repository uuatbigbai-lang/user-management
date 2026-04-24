import { requestBackend } from '../../config/index';

/** 获取商品详情 - Mock数据 */
function mockFetchGood(ID = 0) {
  const { delay } = require('../_utils/delay');
  const { genGood } = require('../../model/good');
  return delay().then(() => genGood(ID));
}

// JSON字段容错：如果是字符串则解析
const safeJSON = (val, fallback) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return fallback; }
  }
  return fallback;
};

/** 获取商品详情 - 从后端获取（自动识别本地/云托管） */
function fetchFromBackend(spuId) {
  return requestBackend({ path: `/api/products/${spuId}` }).then((res) => {
    if (res.data.code === 0 && res.data.data) {
      const d = res.data.data;
      return{
        spuId: d.spuId,
        title: d.title,
        primaryImage: d.primaryImage || d.thumb,
        images: safeJSON(d.images, [d.thumb]),
        price: d.price,
        minSalePrice: d.minSalePrice || 0,
        maxSalePrice: d.maxSalePrice || 0,
        maxLinePrice: d.maxLinePrice || 0,
        soldNum: d.soldNum || 0,
        spuStockQuantity: d.spuStockQuantity || 0,
        isPutOnSale: d.isPutOnSale !== undefined ? d.isPutOnSale : 1,
        specList: safeJSON(d.specList, []),
        skuList: safeJSON(d.skuList, []),
        desc: safeJSON(d.desc, []),
        available: d.spuStockQuantity || 0,
      };
    }
    throw new Error(res.data.message || '获取商品详情失败');
  });
}

/** 获取商品详情 */
export function fetchGood(ID = 0) {
  return fetchFromBackend(ID).catch((err) => {
    console.warn('后端获取失败，回退到mock数据:', err);
    return mockFetchGood(ID);
  });
}