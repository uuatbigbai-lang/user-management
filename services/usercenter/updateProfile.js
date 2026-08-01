import { requestBackend } from '../../config/index';

export function updateProfile(data = {}) {
  return requestBackend({
    path: '/api/user/profile',
    method: 'POST',
    data,
  }).then((res) => {
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || '更新资料失败');
    }
    return res.data?.data || {};
  });
}
