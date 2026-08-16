import { buildBackendUrl, requestBackend } from '../../config/index';

function normalizeProfileResult(data = {}) {
  if (!data.userInfo) return data;
  return {
    ...data,
    userInfo: {
      ...data.userInfo,
      avatarUrl: buildBackendUrl(data.userInfo.avatarUrl),
    },
  };
}

export function updateProfile(data = {}) {
  return requestBackend({
    path: '/api/user/profile',
    method: 'POST',
    data,
  }).then((res) => {
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || '更新资料失败');
    }
    return normalizeProfileResult(res.data?.data || {});
  });
}

export function updateAvatar(data = {}) {
  return requestBackend({
    path: '/api/user/avatar',
    method: 'POST',
    data,
  }).then((res) => {
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || '更新头像失败');
    }
    return normalizeProfileResult(res.data?.data || {});
  });
}
