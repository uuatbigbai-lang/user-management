import { config } from '../../config/index';

/** 从GetOrderList云函数获取订单列表数据 */
function fetchOrdersFromDatabase(params) {
  return new Promise((resolve, reject) => {
    const { pageNum = 1, pageSize = 10, orderStatus } = params.parameter || {};
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'GetOrderList',
      data: {
        pageNum,
        pageSize,
        orderStatus
      }
    }).then(res => {
      if (res.result && res.result.code === 'Success') {
        resolve(res.result);
      } else {
        const error = new Error(res.result?.msg || '云函数调用失败');
        console.error('GetOrderList 云函数调用失败:', error);
        reject(error);
      }
    }).catch(err => {
      console.error('GetOrderList 云函数调用异常:', err);
      reject(err);
    });
  });
}

/** 获取订单列表mock数据 */
function mockFetchOrders(params) {
  const { delay } = require('../_utils/delay');
  const { genOrders } = require('../../model/order/orderList');

  return delay(200).then(() => genOrders(params));
}

/** 获取订单列表数据 */
export function fetchOrders(params) {
  // 从Order数据集获取真实数据
  return fetchOrdersFromDatabase(params);
}

/** 从Order数据集获取订单统计数据 */
function fetchOrdersCountFromDatabase(params) {
  return new Promise((resolve, reject) => {
    const db = wx.cloud.database();
    
    // 获取各状态订单数量
    const statusList = [5, 10, 40, 50, 80]; // 待付款、待发货、待收货、交易完成、已取消
    const promises = statusList.map(status => {
      return db.collection('Order')
        .where({ orderStatus: status })
        .count();
    });
    
    Promise.all(promises)
      .then(results => {
        const data = results.map((result, index) => ({
          tabType: statusList[index],
          orderNum: result.total
        }));
        
        const response = {
          code: 'Success',
          msg: null,
          data: data
        };
        resolve(response);
      })
      .catch(err => {
        console.error('获取订单统计失败:', err);
        reject(err);
      });
  });
}

/** 获取订单列表统计mock数据 */
function mockFetchOrdersCount(params) {
  const { delay } = require('../_utils/delay');
  const { genOrdersCount } = require('../../model/order/orderList');

  return delay().then(() => genOrdersCount(params));
}

/** 获取订单列表统计 */
export function fetchOrdersCount(params) {
  if (config.useMock) {
    return mockFetchOrdersCount(params);
  }

  // 从Order数据集获取真实统计数据
  return fetchOrdersCountFromDatabase(params);
}
