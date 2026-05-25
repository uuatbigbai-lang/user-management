import { config, requestBackend } from '../../config/index';

/** 获取售后单mock数据 */
function mockFetchRightsPreview(params) {
  const { delay } = require('../_utils/delay');
  const { genRightsPreview } = require('../../model/order/applyService');

  return delay().then(() => genRightsPreview(params));
}

/** 获取售后单数据 */
export function fetchRightsPreview(params) {
  if (config.useMock) {
    return mockFetchRightsPreview(params);
  }

  const { orderNo = '', skuId = '', spuId = '', numOfSku = 1 } = params || {};
  return requestBackend({
    path: `/api/after-sale/preview?orderNo=${orderNo}&skuId=${skuId}&spuId=${spuId}&numOfSku=${numOfSku}`,
  }).then((res) => {
    const result = res.data || {};
    if (result.code !== 0) throw new Error(result.message || '获取售后预览失败');
    return { data: result.data };
  });
}

/** 确认收货 */
export function dispatchConfirmReceived() {
  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    return delay();
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}

/** 获取可选的mock售后原因列表 */
function mockFetchApplyReasonList(params) {
  const { delay } = require('../_utils/delay');
  const { genApplyReasonList } = require('../../model/order/applyService');

  return delay().then(() => genApplyReasonList(params));
}

/** 获取可选的售后原因列表 */
export function fetchApplyReasonList(params) {
  if (config.useMock) {
    return mockFetchApplyReasonList(params);
  }

  return requestBackend({
    path: `/api/after-sale/reasons?rightsReasonType=${(params && params.rightsReasonType) || ''}`,
  }).then((res) => {
    const result = res.data || {};
    if (result.code !== 0) throw new Error(result.message || '获取售后原因失败');
    return { data: result.data };
  });
}

/** 发起mock售后申请 */
function mockDispatchApplyService(params) {
  const { delay } = require('../_utils/delay');
  const { applyService } = require('../../model/order/applyService');

  return delay().then(() => applyService(params));
}

/** 发起售后申请 */
export function dispatchApplyService(params) {
  if (config.useMock) {
    return mockDispatchApplyService(params);
  }

  return requestBackend({
    path: '/api/after-sale/apply',
    method: 'POST',
    data: params,
  }).then((res) => {
    const result = res.data || {};
    if (result.code !== 0) throw new Error(result.message || '申请售后失败');
    return { data: result.data };
  });
}
