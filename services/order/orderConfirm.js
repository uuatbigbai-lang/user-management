import { requestBackend } from '../../config/index';

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

/** 获取结算数据 */
export function fetchSettleDetail(params) {
  return requestBackend({
    path: '/api/order/settle',
    method: 'POST',
    data: { goodsRequestList: params.goodsRequestList },
  }).then((res) => {
    if (res.data.code === 0) {
      return { data: res.data.data };
    }
    throw new Error(res.data.message || '获取结算数据失败');
  });
}

/** 提交订单（创建订单） */
export async function dispatchCommitPay(params) {
  // 构造完整的商品快照列表
  const goodsList = (params.goodsRequestList || []).map((item) => ({
    spuId: item.spuId || '',
    skuId: item.skuId || '',
    goodsName: item.goodsName || item.title || '',
    thumb: item.thumb || item.primaryImage || '',
    price: item.price || 0,
    quantity: item.quantity || 1,
    specs: (item.specInfo || []).map((s) => s.specValue).join('，'),
  }));

  const authorizationCode = params.authorizationCode || (await getWxLoginCode());

  return requestBackend({
    path: '/api/order/create',
    method: 'POST',
    data: {
      goodsList,
      userAddress: params.userAddressReq,
      userName: params.userName,
      totalAmount: params.totalAmount,
      remark: (params.storeInfoList && params.storeInfoList[0]?.remark) || '',
      authorizationCode,
    },
  }).then((res) => {
    if (res.data.code === 0) {
      return { result: { data: res.data.data, success: true } };
    }
    throw new Error(res.data.message || '创建订单失败');
  });
}

/** 同步支付成功后的订单状态 */
export function confirmOrderPaid(params) {
  return requestBackend({
    path: '/api/order/paid',
    method: 'POST',
    data: {
      orderId: params.orderId,
      orderNo: params.orderNo,
      transactionId: params.transactionId,
    },
  }).then((res) => {
    if (res.data.code === 0) {
      return { data: res.data.data };
    }
    throw new Error(res.data.message || '同步支付状态失败');
  });
}

export function confirmOrderReceived(params) {
  return requestBackend({
    path: '/api/order/confirm-received',
    method: 'POST',
    data: {
      orderId: params.orderId,
      orderNo: params.orderNo,
    },
  }).then((res) => {
    if (res.data.code === 0) {
      return { data: res.data.data };
    }
    throw new Error(res.data.message || '确认收货失败');
  });
}

/** 开发票 */
export function dispatchSupplementInvoice() {
  return Promise.resolve();
}
