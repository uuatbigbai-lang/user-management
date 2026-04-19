import { config } from '../../config/index';

/** 获取商品详情 - Mock数据 */
function mockFetchGood(ID = 0) {
  const { delay } = require('../_utils/delay');
  const { genGood } = require('../../model/good');
  return delay().then(() => genGood(ID));
}

/** 获取商品详情 - 真实数据 */
async function fetchRealGoodDetail(goodId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'mutateGood',
      data: {
        action: 'get',
        data: {
          spuId: goodId
        }
      }
    });

    if (result.result && result.result.success) {
      const goodData = result.result.data;
      
      // 确保数据格式与前端期望的格式一致
      if (goodData) {
        return {
          ...goodData,
          // 确保必要字段存在
          spuId: goodData.spuId || goodData._id,
          title: goodData.title || goodData.name,
          primaryImage: goodData.primaryImage || goodData.images?.[0] || '',
          images: goodData.images || [goodData.primaryImage || ''],
          price: goodData.price || 0,
          originPrice: goodData.originPrice || goodData.price || 0,
          desc: goodData.desc || goodData.description || '',
          isPutOnSale: goodData.isPutOnSale !== undefined ? goodData.isPutOnSale : 1,
          // 价格信息 - 商品详情页面需要的字段
          minSalePrice: goodData.minSalePrice || goodData.price || 0,
          maxSalePrice: goodData.maxSalePrice || goodData.price || 0,
          minLinePrice: goodData.minLinePrice || goodData.originPrice || goodData.price || 0,
          maxLinePrice: goodData.maxLinePrice || goodData.originPrice || goodData.price || 0,
          // 销售信息
          soldNum: goodData.soldNum || 0,
          spuStockQuantity: goodData.spuStockQuantity || 0,
          // 规格信息
          specList: goodData.specList || [],
          skuList: goodData.skuList || [],
          // 商品详情
          details: goodData.details || goodData.desc || '',
          // 时间戳
          createTime: goodData.createTime || new Date().getTime(),
          updateTime: goodData.updateTime || new Date().getTime()
        };
      }
    } else {
      console.error('获取商品详情失败:', result.result?.message || '未知错误');
      // 如果获取失败，回退到mock数据
      return mockFetchGood(goodId);
    }
  } catch (error) {
    console.error('调用云函数获取商品详情失败:', error);
    // 发生错误时回退到mock数据
    return mockFetchGood(goodId);
  }
}

/** 获取商品详情 */
export function fetchGood(ID = 0) {
  // 使用云函数获取真实商品详情数据
  return fetchRealGoodDetail(ID);
}
