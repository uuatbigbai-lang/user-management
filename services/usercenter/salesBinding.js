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

export async function bindSalesRelationship(params = {}) {
  const authorizationCode = await getWxLoginCode();
  return requestBackend({
    path: '/api/user/sales/bind',
    method: 'POST',
    data: {
      salesOpenid: params.salesOpenid || '',
      sourcePage: params.sourcePage || '',
      sourcePath: params.sourcePath || '',
      sourceSpuId: params.sourceSpuId || '',
      authorizationCode,
    },
  }).then((res) => {
    const result = res.data || res;
    if (result.code === 0) {
      return result.data || {};
    }
    throw new Error(result.message || '绑定销售失败');
  });
}
