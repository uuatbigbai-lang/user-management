Page({
  data: {},
  onLoad() {},
  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },
  goSample() {
    wx.switchTab({ url: '/pages/sample/index' });
  },
});