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
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "cloud1-d8gcvzv3307e57219",
        traceUser: true,
      })
      console.log('[app] wx.cloud.init env:', 'cloud1-d8gcvzv3307e57219');
    }


    let counter = 0;
    const a = setInterval(() => {
      console.log(this.globalData.from);
      if (counter > 9) {
        clearInterval(a);
      }
      const from = this.globalData.from;
      if (from !== 'pending') {
        clearInterval(a);
        this.silentLogin();
      } else {
        counter++;
      }
    }, 1000);


  },
  onShow: function () {
    updateManager();
  },

  // 静默登录方法
  silentLogin: function () {
    console.log('开始静默登录...');
    const p = this.globalData.from !== 'null' ? { from: this.globalData.from } : {};
    fetchUserCenter(p).then(res => {
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

    }).catch(err => {
      console.error('静默登录失败:', err);
      this.globalData.isLoggedIn = false;
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('isLoggedIn');
    });
  },

  // 获取用户信息的便捷方法
  getUserInfo: function () {
    return this.globalData.userInfo;
  },

  // 检查登录状态的便捷方法
  isUserLoggedIn: function () {
    return this.globalData.isLoggedIn;
  },
});
