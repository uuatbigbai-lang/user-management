import { config } from '../../config/index';

/** 获取订单详情mock数据 */
function mockFetchOrderDetail(params) {
  const { delay } = require('../_utils/delay');
  const { genOrderDetail } = require('../../model/order/orderDetail');

  return delay().then(() => genOrderDetail(params));
}

/** 获取订单详情数据 */
export function fetchOrderDetail(params) {

  return new Promise((resolve, reject) => {
    const db = wx.cloud.database();
    const orderID = params.parameter;
    // 根据订单号查询订单详情
    db.collection('Order')
      .doc(orderID)
      .get()
      .then(res => {
        if (res.data) {
          const order = res.data;
          const response = {
            code: 'Success',
            msg: null,
            data: {
              ...order, // 保留其他所有字段
              uid: order.uid || order._openid,
              parentOrderNo: order.parentOrderNo || order.orderNo,
              orderId: order.orderId || order._id,
              orderNo: order.orderNo,
              orderType: order.orderType || 0,
              orderSubType: order.orderSubType || 0,
              orderStatus: order.orderStatus,
              orderSubStatus: order.orderSubStatus || null,
              totalAmount: order.totalAmount,
              goodsAmountApp: order.goodsAmountApp || order.totalAmount, // 添加商品总额字段
              paymentAmount: order.paymentAmount || order.totalAmount,
              createTime: order.createTime,
              orderItemVOs: order.orderItemVOs || [],
              autoCancelTime: order.autoCancelTime || null,
              orderStatusName: order.orderStatusName,
              orderStatusRemark: order.orderStatusRemark || null,
              // 确保物流信息结构完整
              logisticsVO: {
                logisticsNo: (order.logisticsVO && order.logisticsVO.logisticsNo) || order.logisticsNo || '',
                logisticsCompanyName: (order.logisticsVO && order.logisticsVO.logisticsCompanyName) || order.logisticsCompanyName || '',
                logisticsCompanyTel: (order.logisticsVO && order.logisticsVO.logisticsCompanyTel) || order.logisticsCompanyTel || '',
                receiverName: (order.logisticsVO && order.logisticsVO.receiverName) || order.receiverName || '',
                receiverPhone: (order.logisticsVO && order.logisticsVO.receiverPhone) || order.receiverPhone || '',
                receiverCity: (order.logisticsVO && order.logisticsVO.receiverCity) || order.receiverCity || '',
                receiverCountry: (order.logisticsVO && order.logisticsVO.receiverCountry) || order.receiverCountry || '',
                receiverArea: (order.logisticsVO && order.logisticsVO.receiverArea) || order.receiverArea || '',
                receiverAddress: (order.logisticsVO && order.logisticsVO.receiverAddress) || order.receiverAddress || ''
              },
              // 添加支付信息
              paymentVO: {
                paySuccessTime: (order.paymentVO && order.paymentVO.paySuccessTime) || order.paySuccessTime || null
              },
              // 添加发票信息
              invoiceVO: {
                invoiceType: (order.invoiceVO && order.invoiceVO.invoiceType) || order.invoiceType || 0
              },
              invoiceStatus: order.invoiceStatus || 3,
              invoiceDesc: order.invoiceDesc || '',
              // 添加物流轨迹
              trajectoryVos: order.trajectoryVos || [],
              // 添加按钮配置
              buttonVOs: order.buttonVOs || [],
              storeId: order.storeId || null,
              storeName: order.storeName || null,
              // 添加优惠信息
              discountAmount: order.discountAmount || 0,
              couponAmount: order.couponAmount || 0,
              freightFee: order.freightFee || 0,
              remark: order.remark || '',
            }
          };
          resolve(response);
        } else {
          reject(new Error('订单不存在'));
        }
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        reject(err);
      });
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
    resolve('real api');
  });
}
