import { config } from '../../config/index';

/** 获取首页数据 */
function fetchHomeData() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'CMS',
      data: {
        action: 'home'
      },
      success: (res) => {
        if (res.result.success) {
          // CMS云函数现在会处理所有情况，包括数据初始化和降级方案
          resolve(res.result.data);
        } else {
          // 如果云函数明确返回失败，记录错误并拒绝Promise
          console.error('CMS云函数返回失败:', res.result.message);
          reject(new Error(res.result.message || 'CMS云函数返回失败'));
        }
      },
      fail: (error) => {
        console.error('调用CMS云函数失败:', error);
        // 调用失败时拒绝Promise，让上层处理
        reject(error);
      }
    });
  });
}

/** 获取首页数据 */
export function fetchHome() {
  return fetchHomeData();

}
