import { buildBackendUrl, requestBackend } from '../../config/index';

function getWxLoginCode() {
  return new Promise((resolve, reject) => {
    if (!wx.login) {
      reject(new Error('当前基础库不支持微信登录'));
      return;
    }
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('获取登录凭证失败'));
      },
      fail: () => reject(new Error('获取登录凭证失败')),
    });
  });
}

export async function bindPhoneNumber(phoneCode) {
  if (!phoneCode) {
    throw new Error('未获取到手机号授权凭证');
  }

  const authorizationCode = await getWxLoginCode();
  return requestBackend({
    path: '/api/user/phone-login',
    method: 'POST',
    data: {
      code: phoneCode,
      authorizationCode,
    },
  }).then((res) => {
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || '手机号登录失败');
    }
    const data = res.data?.data || {};
    if (!data.userInfo) return data;
    return {
      ...data,
      userInfo: {
        ...data.userInfo,
        avatarUrl: buildBackendUrl(data.userInfo.avatarUrl),
      },
    };
  });
}
