import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';

import { confirmOrderPaid, dispatchCommitPay } from '../../../services/order/orderConfirm';

// 真实的提交支付
export const commitPay = (params) => {
  return dispatchCommitPay({
    goodsRequestList: params.goodsRequestList, // 待结算的商品集合
    invoiceRequest: params.invoiceRequest, // 发票信息
    // isIgnore: params.isIgnore || false, // 删掉 是否忽视库存不足和商品失效,继续结算,true=继续结算 购物车请赋值false
    userAddressReq: params.userAddressReq, // 地址信息(用户在购物选择更换地址)
    currency: params.currency || 'CNY', // 支付货币: 人民币=CNY，美元=USD
    logisticsType: params.logisticsType || 1, // 配送方式 0=无需配送 1=快递 2=商家 3=同城 4=自提
    // orderMark: params.orderMark, // 下单备注
    orderType: params.orderType || 0, // 订单类型 0=普通订单 1=虚拟订单
    payType: params.payType || 1, // 支付类型(0=线上、1=线下)
    totalAmount: params.totalAmount, // 新增字段"totalAmount"总的支付金额
    userName: params.userName, // 用户名
    payWay: 1,
    authorizationCode: '', //loginCode, // 登录凭证
    storeInfoList: params.storeInfoList, //备注信息列表
    couponList: params.couponList,
    groupInfo: params.groupInfo,
  });
};

export const paySuccess = (payOrderInfo, context) => {
  const { payAmt, tradeNo, groupId, promotionId } = payOrderInfo;
  // 支付成功
  Toast({
    context,
    selector: '#t-toast',
    message: '支付成功',
    duration: 2000,
    icon: 'check-circle',
  });

  const params = {
    totalPaid: payAmt,
    orderID: payOrderInfo.orderId,
    orderNo: tradeNo,
  };
  if (groupId) {
    params.groupId = groupId;
  }
  if (promotionId) {
    params.promotionId = promotionId;
  }
  const paramsStr = Object.keys(params)
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const redirectToPayResult = () => {
    wx.redirectTo({ url: `/pages/order/pay-result/index?${paramsStr}` });
  };

  confirmOrderPaid({
    orderId: payOrderInfo.orderId,
    orderNo: tradeNo,
    transactionId: payOrderInfo.transactionId,
  })
    .catch((err) => {
      console.warn('同步支付状态失败:', err);
    })
    .finally(redirectToPayResult);
};

export const payFail = (payOrderInfo, resultMsg, context) => {
  if (resultMsg === 'requestPayment:fail cancel') {
    if (payOrderInfo.dialogOnCancel) {
      //结算页，取消付款，dialog提示
      Dialog.confirm({
        title: '是否放弃付款',
        content: '商品可能很快就会被抢空哦，是否放弃付款？',
        confirmBtn: '放弃',
        cancelBtn: {
          content: '继续付款',
          theme: 'primary',
        },
      })
        .then(() => {
          wx.redirectTo({ url: '/pages/order/order-list/index' });
        })
        .catch(() => {});
    } else {
      //订单列表页，订单详情页，取消付款，toast提示
      Toast({
        context,
        selector: '#t-toast',
        message: '支付取消',
        duration: 2000,
        icon: 'close-circle',
      });
    }
  } else {
    Toast({
      context,
      selector: '#t-toast',
      message: `支付失败：${resultMsg}`,
      duration: 2000,
      icon: 'close-circle',
    });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/order/order-list/index' });
    }, 2000);
  }
};

// 微信支付方式
export const wechatPayOrder = (payOrderInfo) => {
  const payInfo = typeof payOrderInfo.payInfo === 'string' ? JSON.parse(payOrderInfo.payInfo) : payOrderInfo.payInfo;
  const { timeStamp, nonceStr, signType, paySign } = payInfo;
  return new Promise((resolve, reject) => {
    // // demo 中直接走支付成功
    // paySuccess(payOrderInfo);
    // resolve();
    wx.requestPayment({
      timeStamp,
      nonceStr,
      package: payInfo.package,
      signType,
      paySign,
      success: function () {
        paySuccess(payOrderInfo, payOrderInfo.context);
        resolve();
      },
      fail: function (err) {
        payFail(payOrderInfo, err.errMsg, payOrderInfo.context);
        if (err.errMsg === 'requestPayment:fail cancel') {
          resolve();
          return;
        }
        reject(err);
      },
    });
  });
};
