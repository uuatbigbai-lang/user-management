import { config, requestBackend } from '../../config/index';

/** 获取订单列表mock数据 */
function mockFetchOrders(params) {
  const { delay } = require('../_utils/delay');
  const { genOrders } = require('../../model/order/orderList');

  return delay(200).then(() => genOrders(params));
}

/** 获取订单列表数据 */
export function fetchOrders(params) {
  if (config.useMock) {
    return mockFetchOrders(params);
  }

  const { pageNum = 1, pageSize = 10, orderStatus } = params.parameter || {};
  const query = `pageNum=${pageNum}&pageSize=${pageSize}${orderStatus !== undefined && orderStatus !== -1 ? `&orderStatus=${orderStatus}` : ''}`;

  return requestBackend({
    path: `/api/order/list?${query}`,
    method: 'GET',
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return {
        code: 'Success',
        data: {
          orders: result.data.orders || [],
          total: result.data.total || 0,
        },
      };
    }
    throw new Error(result.message || '获取订单列表失败');
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

  // 复用订单列表接口中返回的 tabCounts
  return requestBackend({
    path: '/api/order/list?pageNum=1&pageSize=1',
    method: 'GET',
  }).then((res) => {
    const result = res.data || res;
    return {
      code: 'Success',
      data: (result.code === 0 && result.data.tabCounts) || [],
    };
  });
}