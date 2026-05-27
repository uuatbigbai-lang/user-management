import { backendConfig, config, requestBackend } from '../../config/index';

/** 获取优惠券列表 */
function mockFetchCoupon(status) {
  const { delay } = require('../_utils/delay');
  const { getCouponList } = require('../../model/coupon');
  return delay().then(() => getCouponList(status));
}

/** 获取优惠券列表 */
export function fetchCouponList(status = 'default') {
  if (config.useMock) {
    return mockFetchCoupon(status);
  }
  return requestBackend({
    path: `/api/coupon/list?status=${encodeURIComponent(status)}`,
  }).then((res) => {
    if (res.data.code === 0) return res.data.data || [];
    throw new Error(res.data.message || '获取优惠券失败');
  });
}

/** 获取优惠券 详情 */
function mockFetchCouponDetail(id, status) {
  const { delay } = require('../_utils/delay');
  const { getCoupon } = require('../../model/coupon');
  const { genAddressList } = require('../../model/address');

  return delay().then(() => {
    const result = {
      detail: getCoupon(id, status),
      storeInfoList: genAddressList(),
    };

    result.detail.useNotes = `1个订单限用1张，除运费券外，不能与其它类型的优惠券叠加使用（运费券除外）\n2.仅适用于各区域正常售卖商品，不支持团购、抢购、预售类商品`;
    result.detail.storeAdapt = `商城通用`;

    if (result.detail.type === 'price') {
      result.detail.desc = `减免 ${result.detail.value / 100} 元`;

      if (result.detail.base) {
        result.detail.desc += `，满${result.detail.base / 100}元可用`;
      }

      result.detail.desc += '。';
    } else if (result.detail.type === 'discount') {
      result.detail.desc = `${result.detail.value}折`;

      if (result.detail.base) {
        result.detail.desc += `，满${result.detail.base / 100}元可用`;
      }

      result.detail.desc += '。';
    }

    return result;
  });
}

/** 获取优惠券 详情 */
export function fetchCouponDetail(id, status = 'default') {
  if (config.useMock) {
    return mockFetchCouponDetail(id, status);
  }
  const path = `/api/coupon/detail/${encodeURIComponent(id)}`;
  return requestBackend({
    path,
  }).then((res) => {
    if (res.data.code === 0) {
      return { detail: res.data.data, storeInfoList: [] };
    }
    const base = backendConfig.useLocal ? backendConfig.localBase : backendConfig.publicBase;
    throw new Error(`${res.data.message || '获取优惠券详情失败'}（请求：${base}${path}）`);
  });
}

export function checkCouponAdmin() {
  return requestBackend({ path: '/api/coupon/admin/check' }).then((res) => {
    if (res.data.code === 0) return res.data.data || {};
    throw new Error(res.data.message || '检查管理员身份失败');
  });
}

export function createCoupon(templateType) {
  return requestBackend({
    path: '/api/coupon/admin/create',
    method: 'POST',
    data: { templateType },
  }).then((res) => {
    if (res.data.code === 0) return res.data.data;
    throw new Error(res.data.message || '生成优惠券失败');
  });
}

export function fetchCouponTemplates() {
  return requestBackend({
    path: '/api/coupon/admin/templates',
  }).then((res) => {
    if (res.data.code === 0) return res.data.data || [];
    throw new Error(res.data.message || '获取优惠券模板失败');
  });
}

export function fetchAdminCouponList() {
  return requestBackend({
    path: '/api/coupon/admin/list',
  }).then((res) => {
    if (res.data.code === 0) return res.data.data || [];
    throw new Error(res.data.message || '获取优惠券记录失败');
  });
}

export function voidCoupon(couponNo) {
  return requestBackend({
    path: '/api/coupon/admin/void',
    method: 'POST',
    data: { couponNo },
  }).then((res) => {
    if (res.data.code === 0) return res.data.data;
    throw new Error(res.data.message || '作废优惠券失败');
  });
}

export function claimCoupon(couponNo) {
  return requestBackend({
    path: '/api/coupon/claim',
    method: 'POST',
    data: { couponNo },
  }).then((res) => {
    if (res.data.code === 0) return res.data.data;
    throw new Error(res.data.message || '领取优惠券失败');
  });
}
