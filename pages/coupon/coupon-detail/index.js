import { claimCoupon, fetchCouponDetail } from '../../../services/coupon/index';

Page({
  data: {
    detail: null,
    storeInfoList: [],
    storeInfoStr: '',
    showStoreInfoList: false,
    fromShare: false,
    claimed: false,
    errorMessage: '',
  },

  id: '',

  onLoad(query) {
    const id = query.couponNo || query.id;
    this.id = id;
    this.setData({ fromShare: !!query.couponNo });
    if (!id) {
      this.setData({ errorMessage: '缺少优惠券编号，请从优惠券列表或分享链接进入。' });
      return;
    }
    this.getGoodsList(id);
  },

  getGoodsList(id) {
    fetchCouponDetail(id).then(({ detail }) => {
      this.setData({
        detail,
        claimed: detail && detail.recordStatus === 'claimed',
        errorMessage: '',
      });
    }).catch((err) => {
      const message = err.message || '优惠券不存在';
      this.setData({ errorMessage: message });
      wx.showToast({ title: message, icon: 'none' });
    });
  },

  claimHandle() {
    if (!this.id) return;
    wx.showLoading({ title: '领取中', mask: true });
    claimCoupon(this.id).then((detail) => {
      wx.hideLoading();
      this.setData({ detail, claimed: true });
      wx.showToast({ title: '领取成功', icon: 'success' });
    }).catch((err) => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '领取失败', icon: 'none' });
    });
  },

  goHomeHandle() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  navGoodListHandle() {
    wx.navigateTo({
      url: `/pages/coupon/coupon-activity-goods/index?couponNo=${this.id}`,
    });
  },
});
