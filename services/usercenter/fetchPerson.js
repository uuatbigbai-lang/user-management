import { config } from '../../config/index';
import { requestBackend } from '../../config/index';

/** 获取个人中心信息 */
function mockFetchPerson() {
  const { delay } = require('../_utils/delay');
  const { genSimpleUserInfo } = require('../../model/usercenter');
  const { genAddress } = require('../../model/address');
  const address = genAddress();
  return delay().then(() => ({
    ...genSimpleUserInfo(),
    address: {
      provinceName: address.provinceName,
      provinceCode: address.provinceCode,
      cityName: address.cityName,
      cityCode: address.cityCode,
    },
  }));
}

/** 获取个人中心信息 */
export function fetchPerson() {
  if (config.useMock) {
    return mockFetchPerson();
  }
  const app = getApp();
  const userInfo = app?.getUserInfo ? (app.getUserInfo() || {}) : {};
  return requestBackend({
    path: '/api/user/sales-profile',
    method: 'GET',
  }).then((res) => {
    const result = res.data || {};
    return {
      ...userInfo,
      isSales: !!result.data?.isSales,
      salesRoleLabel: result.data?.salesRoleLabel || userInfo.salesRoleLabel || '',
      salesName: result.data?.profile?.salesName || userInfo.salesName || '',
      salesProfile: result.data?.profile || userInfo.salesProfile || null,
    };
  }).catch(() => userInfo);
}
