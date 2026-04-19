import { config } from '../../config/index';

/** 获取商品列表 */
function mockFetchGoodsList(pageIndex = 1, pageSize = 20) {
  const { delay } = require('../_utils/delay');
  const { getGoodsList } = require('../../model/goods');
  return delay().then(() =>
    getGoodsList(pageIndex, pageSize).map((item) => {
      return {
        spuId: item.spuId,
        thumb: item.primaryImage,
        title: item.title,
        price: item.minSalePrice,
        originPrice: item.maxLinePrice,
        tags: item.spuTagList.map((tag) => tag.title),
      };
    }),
  );
}

/** 通过云函数获取真实商品数据 */
async function fetchRealGoodsList(pageIndex, pageSize, catagory) {
  try {
    // 调用商品管理云函数获取商品列表
    const result = await wx.cloud.callFunction({
      name: 'mutateGood',
      data: {
        action: 'list',
        data: {
          page: pageIndex, // 转换为页码
          pageSize,
          categoryIds: [catagory]
        }
      }
    });

    if (result.result && result.result.success) {
      const goodsList = result.result.data.list || [];
      
      // 转换数据格式以匹配前端需求
      return goodsList.map((item) => {
        return {
          spuId: item.spuId,
          thumb: item.primaryImage,
          title: item.title,
          price: item.minSalePrice,
          originPrice: item.maxLinePrice,
          tags: (item.spuTagList || []).map((tag) => ({title: tag.title, color: tag.color || 'red'})),
        };
      });
    } else {
      console.error('获取商品列表失败:', result.result?.error);
      return [];
    }
  } catch (error) {
    console.error('调用商品云函数失败:', error);
    // 如果云函数调用失败，回退到mock数据
    return mockFetchGoodsList(pageIndex, pageSize);
  }
}

/** 获取商品列表 */
export function fetchGoodsList(pageIndex, pageSize, catagory) {
  // 使用云函数获取真实数据
  return fetchRealGoodsList(pageIndex, pageSize, catagory);
}

/** 获取商品详情 */
export async function fetchGoodsDetail(spuId) {
  try {
    // 调用商品管理云函数获取商品详情
    const result = await wx.cloud.callFunction({
      name: 'mutateGood',
      data: {
        action: 'get',
        data: {
          spuId: spuId
        }
      }
    });

    if (result.result && result.result.success) {
      return result.result.data;
    } else {
      console.error('获取商品详情失败:', result.result?.error);
      return null;
    }
  } catch (error) {
    console.error('调用商品详情云函数失败:', error);
    return null;
  }
}

/** 添加商品到购物车 */
export async function addToCart(goodsData) {
  try {
    // 调用购物车管理云函数
    const result = await wx.cloud.callFunction({
      name: 'mutateCart',
      data: {
        action: 'add',
        data: {
          storeGoods: [{
            storeId: goodsData.storeId || '1000',
            storeName: goodsData.storeName || '默认店铺',
            storeStatus: 1,
            promotionGoodsList: [{
              goodsPromotionList: [goodsData]
            }]
          }]
        }
      }
    });

    if (result.result && result.result.success) {
      return {
        success: true,
        message: '添加到购物车成功'
      };
    } else {
      return {
        success: false,
        message: result.result?.error || '添加到购物车失败'
      };
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    return {
      success: false,
      message: '网络错误，请重试'
    };
  }
}
