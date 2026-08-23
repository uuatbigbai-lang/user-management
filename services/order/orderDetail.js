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

  const orderID = encodeURIComponent(params.parameter);
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

export function fetchWechatWaybillToken(params) {
  if (config.useMock) {
    return Promise.resolve({ code: 'Success', data: { waybillToken: '' } });
  }

  return requestBackend({
    path: '/api/order/logistics/waybill-token',
    method: 'POST',
    data: {
      orderNo: params.orderNo,
      orderId: params.orderId,
    },
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return { code: 'Success', data: result.data || {} };
    }
    throw new Error(result.message || '获取微信物流凭证失败');
  });
}

export function cancelOrderReturn({ orderNo } = {}) {
  if (config.useMock) {
    return Promise.resolve({ code: 'Success', data: {} });
  }
  return requestBackend({
    path: '/api/order/cancel-return',
    method: 'POST',
    data: { orderNo },
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) return { code: 'Success', data: result.data || {} };
    throw new Error(result.message || '取消退货失败');
  });
}

export function syncWechatOrderState(params) {
  if (config.useMock) {
    return Promise.resolve({ code: 'Success', data: {} });
  }

  return requestBackend({
    path: '/api/order/wechat/sync',
    method: 'POST',
    data: {
      orderNo: params.orderNo,
      orderId: params.orderId,
    },
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return { code: 'Success', data: result.data || {} };
    }
    throw new Error(result.message || '同步微信订单状态失败');
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
