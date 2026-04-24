import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../config/index';

Page({
  data: {
    pageLoading: true,
    products: [],
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.fetchProducts();
  },

  // 从后端获取商品列表（自动识别本地/云托管）
  fetchProducts() {
    this.setData({ pageLoading: true });
    requestBackend({ path: '/api/products' }).then((res) => {
      if (res.data.code === 0) {
        this.setData({ products: res.data.data, pageLoading: false });
      } else {
        console.error('获取商品失败:', res.data.message);
        Toast({ context: this, selector: '#t-toast', message: '加载商品失败' });
        this.setData({ pageLoading: false });
      }
      wx.stopPullDownRefresh();
    }).catch((err) => {
      console.error('请求失败:', err);
      Toast({ context: this, selector: '#t-toast', message: '网络错误，请重试' });
      this.setData({ pageLoading: false });
      wx.stopPullDownRefresh();
    });
  },

  // 跳转到商品详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },

  navToAbout() {
    wx.navigateTo({
      url: '/pages/about/index',
    });
  },

  navToNutrition() {
    wx.navigateTo({
      url: '/pages/nutrition/index',
    });
  },
});