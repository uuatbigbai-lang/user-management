import updateManager from './common/updateManager';
import {
  fetchUserCenter
} from './services/usercenter/fetchUsercenter.js'
App({
  globalData: {
    temp: null,
    userInfo: null,
    isLoggedIn: false,
    from: 'pending', // 'pending', 'someone\'s openID', 'null'
    menuData: [],
    loginPromise: null,
    cartBadgeCount: 0,
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "cloud1-1gr581cp70dbd77a",
        traceUser: true,
      })
      console.log('[app] wx.cloud.init env:', 'cloud1-1gr581cp70dbd77a');
    }


    this.silentLogin();
  },
  onShow: function () {
    updateManager();
  },

  // 静默登录方法
  silentLogin: function () {
    if (this.globalData.loginPromise) {
      return this.globalData.loginPromise;
    }

    console.log('开始静默登录...');
    const clearLoginPromise = () => {
      this.globalData.loginPromise = null;
    };

    this.globalData.loginPromise = fetchUserCenter().then(res => {
      console.log('静默登录成功:', res);
      if (res.msg) {
        wx.showModal({ title: res.msg });
      }
      // 将登录态保存到全局变量
      this.globalData.userInfo = res.userInfo;
      this.globalData.isLoggedIn = true;

      // 触发登录成功事件，其他页面可以监听
      wx.setStorageSync('userInfo', res.userInfo);
      wx.setStorageSync('isLoggedIn', true);
      clearLoginPromise();
      return res;

    }).catch(err => {
      console.error('静默登录失败:', err);
      this.globalData.isLoggedIn = false;
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('isLoggedIn');
      clearLoginPromise();
      throw err;
    });

    return this.globalData.loginPromise;
  },

  // 获取用户信息的便捷方法
  getUserInfo: function () {
    return this.globalData.userInfo;
  },

  // 检查登录状态的便捷方法
  isUserLoggedIn: function () {
    return this.globalData.isLoggedIn;
  },

  getCartBadgeCount: function () {
    return this.globalData.cartBadgeCount || 0;
  },

  setCartBadgeCount: function (count) {
    this.globalData.cartBadgeCount = Math.max(0, Number(count) || 0);
  },
});
