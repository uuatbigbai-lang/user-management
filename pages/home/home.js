import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    pageLoading: true,
    products: [
      {
        id: 1,
        spuId: 'spu_probiotic_01',
        title: '清畅益生菌粉（成人款）',
        brief: '含300亿活性乳酸菌，呵护肠道微生态平衡，每天一袋，轻松享受清爽好肠道。',
        price: '168',
        thumb: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-09a.png',
        badge: '人气爆款',
      },
      {
        id: 2,
        spuId: 'spu_probiotic_02',
        title: '儿童果味益生菌咀嚼片',
        brief: '专为儿童设计，酸甜果味易接受，6种优选菌株协同守护宝宝娇嫩肠胃。',
        price: '128',
        thumb: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-08a.png',
        badge: '妈妈之选',
      },
      {
        id: 3,
        spuId: 'spu_probiotic_03',
        title: '女性私护益生菌胶囊',
        brief: '甄选鼠李糖乳杆菌等专利菌株，由内而外护女性健康，科学守护私密平衡。',
        price: '198',
        thumb: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-10a.png',
        badge: '',
      },
    ],
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
    // 模拟加载
    setTimeout(() => {
      this.setData({ pageLoading: false });
      wx.stopPullDownRefresh();
    }, 400);
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