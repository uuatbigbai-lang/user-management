import { config } from '../../config/index';

/** 获取收货地址 */
function mockFetchDeliveryAddress(id) {
  const { delay } = require('../_utils/delay');
  const { genAddress } = require('../../model/address');

  return delay().then(() => genAddress(id));
}

/** 获取收货地址 */
export function fetchDeliveryAddress(id = 0) {
  if (config.useMock) {
    return mockFetchDeliveryAddress(id);
  }

  // 从云开发数据库Address集合获取单个地址
  return wx.cloud.database().collection('Address').doc(id).get().then(res => {
    if (res.data) {
      const address = res.data;
      // 转换数据格式以保持与原有接口的兼容性
      return {
        ...address,
        phoneNumber: address.phone,
        address: `${address.provinceName}${address.cityName}${address.districtName}${address.detailAddress}`,
        tag: address.addressTag,
      };
    } else {
      throw new Error('地址不存在');
    }
  }).catch(err => {
    console.error('获取地址详情失败:', err);
    throw err;
  });
}

/** 获取收货地址列表 */
function mockFetchDeliveryAddressList(len = 0) {
  // 从云开发数据库Address集合获取地址列表
  return wx.cloud.database().collection('Address').get().then(res => {
    const addressList = res.data || [];
    
    // 如果指定了数量限制，则截取对应数量
    const limitedList = len > 0 ? addressList.slice(0, len) : addressList;
    
    // 转换数据格式以保持与原有接口的兼容性
    return limitedList.map((address) => {
      return {
        ...address,
        phoneNumber: address.phone,
        address: `${address.provinceName}${address.cityName}${address.districtName}${address.detailAddress}`,
        tag: address.addressTag,
      };
    });
  }).catch(err => {
    console.error('获取地址列表失败:', err);
    // 如果数据库查询失败，返回空数组
    return [];
  });
}

/** 获取收货地址列表 */
export function fetchDeliveryAddressList(len = 10) {
  if (config.useMock) {
    return mockFetchDeliveryAddressList(len);
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}
