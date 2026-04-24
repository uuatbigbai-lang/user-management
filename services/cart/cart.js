import { requestBackend } from '../../config/index';

/** 获取购物车数据 */
export function fetchCartGroupData() {
  return requestBackend({ path: '/api/cart/list' }).then((res) => {
    if (res.data.code === 0) {
      return { data: res.data.data };
    }
    throw new Error(res.data.message || '获取购物车失败');
  });
}

/** 加入购物车 */
export function addToCart(data) {
  return requestBackend({ path: '/api/cart/add', method: 'POST', data });
}

/** 更新购物车数量 */
export function updateCartQuantity(data) {
  return requestBackend({ path: '/api/cart/update', method: 'POST', data });
}

/** 切换选中状态 */
export function updateCartSelect(data) {
  return requestBackend({ path: '/api/cart/select', method: 'POST', data });
}

/** 删除购物车商品 */
export function deleteCartItem(data) {
  return requestBackend({ path: '/api/cart/delete', method: 'POST', data });
}

/** 清空失效商品（本地只需刷新列表） */
export function clearInvalidGoods() {
  return Promise.resolve();
}