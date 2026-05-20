import { config, requestBackend } from '../../config/index';

function getWxLoginCode() {
  return new Promise((resolve) => {
    if (!wx.login) {
      resolve('');
      return;
    }
    wx.login({
      success: (res) => resolve(res.code || ''),
      fail: () => resolve(''),
    });
  });
}

/** 获取订单详情mock数据 */
function mockFetchOrderDetail(params) {
  const { delay } = require('../_utils/delay');
  const { genOrderDetail } = require('../../model/order/orderDetail');

  return delay().then(() => genOrderDetail(params));
}

/** 获取订单详情数据 */
export function fetchOrderDetail(params) {
  if (config.useMock) {
    return mockFetchOrderDetail(params);
  }

  const orderID = params.parameter;
  return requestBackend({
    path: `/api/order/detail/${orderID}`,
    method: 'GET',
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return { code: 'Success', data: result.data };
    }
    throw new Error(result.message || '获取订单详情失败');
  });
}

/** 获取客服mock数据 */
function mockFetchBusinessTime(params) {
  const { delay } = require('../_utils/delay');
  const { genBusinessTime } = require('../../model/order/orderDetail');

  return delay().then(() => genBusinessTime(params));
}

/** 获取客服数据 */
export function fetchBusinessTime(params) {
  if (config.useMock) {
    return mockFetchBusinessTime(params);
  }

  return new Promise((resolve) => {
    resolve({
      data: {
        telphone: '',
        businessTime: [],
      },
    });
  });
}

/** 继续支付已有待付款订单 */
export async function dispatchOrderPay(params) {
  const authorizationCode = params.authorizationCode || (await getWxLoginCode());

  return requestBackend({
    path: '/api/order/pay',
    method: 'POST',
    data: {
      orderId: params.orderId,
      orderNo: params.orderNo,
      authorizationCode,
    },
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return { data: result.data };
    }
    throw new Error(result.message || '发起支付失败');
  });
}
