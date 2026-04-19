import { config } from '../../config/index';

/** 获取个人中心信息 */
function mockFetchUserCenter() {
  const { delay } = require('../_utils/delay');
  const { genUsercenter } = require('../../model/usercenter');
  return delay(200).then(() => genUsercenter());
}

/** 获取个人中心信息 */
export function fetchUserCenter(p) {
  const { genUsercenter } = require('../../model/usercenter');
  const mock = genUsercenter()
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',
      data: p,
      success: (res) => {
        console.log('登录云函数调用成功:', res);
        mock.userInfo = res.result.data.userInfo;
        // const target = Object.assign(mock, res.result)
        resolve({...mock, ...res.result.data});
      },
      fail: (err) => {
        console.error('登录云函数调用失败:', err);
        reject(err);
      }
    });
  });
}

