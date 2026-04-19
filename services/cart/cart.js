import { config } from '../../config/index';

/** 获取购物车mock数据 */
function mockFetchCartGroupData(params) {
  const { genCartGroupData } = require('../../model/cart');

  return new Promise((resolve)=> { resolve(genCartGroupData(params))});
}

/** 调用云函数获取购物车数据 */
function fetchCartFromCloud(params) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'fetchCart',
      data: {
        params: params
      },
      success: (res) => {
        console.log('云函数调用成功:', res);
        if (res.result && res.result.success) {
          resolve(res.result.data);
        } else {
          console.error('云函数返回错误:', res.result);
          reject(new Error(res.result?.message || '获取购物车数据失败'));
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error);
        reject(error);
      }
    });
  });
}

/** 获取购物车数据 */
export function fetchCartGroupData(params) {
  return fetchCartFromCloud(params);
}
