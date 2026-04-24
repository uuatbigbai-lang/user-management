import { requestBackend } from '../../config/index';

/** 获取单个收货地址详情 */
export function fetchDeliveryAddress(id) {
  return requestBackend({
    path: `/api/address/${id}`,
  }).then((res) => {
    if (res.data.code === 0 && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || '地址不存在');
  });
}

/** 获取收货地址列表 */
export function fetchDeliveryAddressList() {
  return requestBackend({
    path: '/api/address/list',
  }).then((res) => {
    if (res.data.code === 0) {
      return res.data.data || [];
    }
    return [];
  });
}