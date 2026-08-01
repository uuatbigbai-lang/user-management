import { requestBackend } from '../../config/index';
import { resolveCloudFileUrls } from '../../utils/cloudImage';

const LOGIN_TIMEOUT = 8000;

function withTimeout(promise, timeout = LOGIN_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('自动登录超时'));
    }, timeout);

    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** 获取个人中心信息 */
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

/** 获取个人中心信息 */
export async function fetchUserCenter() {
  const { genUsercenter } = require('../../model/usercenter');
  const mock = genUsercenter();
  const authorizationCode = await getWxLoginCode();
  return withTimeout(requestBackend({
    path: '/api/user/auto-login',
    method: 'POST',
    data: { authorizationCode },
  })).then(async (res) => {
    if (res.data.code !== 0) {
      throw new Error(res.data.message || '自动登录失败');
    }

    const userInfo = res.data.data.userInfo || {};
    const avatarUrlMap = await resolveCloudFileUrls([userInfo.avatarUrl]);

    return {
      ...mock,
      ...res.data.data,
      userInfo: {
        ...userInfo,
        avatarUrl: avatarUrlMap[userInfo.avatarUrl] || userInfo.avatarUrl,
      },
    };
  });
}
