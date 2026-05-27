import { createCoupon, fetchAdminCouponList, fetchCouponTemplates, voidCoupon } from '../../../services/coupon/index';

Page({
  data: {
    couponTypes: [],
    couponList: [],
    loading: false,
  },

  onLoad() {
    this.fetchList();
  },

  onShow() {
    this.fetchList();
  },

  fetchList() {
    this.setData({ loading: true });
    Promise.all([fetchCouponTemplates(), fetchAdminCouponList()]).then(([couponTypes, couponList]) => {
      this.setData({ couponTypes, couponList, loading: false });
    }).catch((err) => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  createHandle(e) {
    const { type } = e.currentTarget.dataset;
    wx.showLoading({ title: '生成中', mask: true });
    createCoupon(type).then(() => {
      wx.hideLoading();
      this.fetchList();
      wx.showToast({ title: '已生成', icon: 'success' });
    }).catch((err) => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    });
  },

  shareHandle(e) {
    const { couponNo } = e.currentTarget.dataset;
    this.shareCouponNo = couponNo;
  },

  voidHandle(e) {
    const { couponNo } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认作废',
      content: '作废后用户将无法领取或使用这张优惠券。',
      confirmText: '作废',
      confirmColor: '#d92d20',
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '作废中', mask: true });
        voidCoupon(couponNo).then(() => {
          wx.hideLoading();
          this.fetchList();
          wx.showToast({ title: '已作废', icon: 'success' });
        }).catch((err) => {
          wx.hideLoading();
          wx.showToast({ title: err.message || '作废失败', icon: 'none' });
        });
      },
    });
  },

  refreshHandle() {
    this.fetchList();
  },

  onShareAppMessage(options) {
    const couponNo = options?.target?.dataset?.couponNo || this.shareCouponNo || '';
    const coupon = this.data.couponList.find((item) => item.couponNo === couponNo);
    if (!coupon || !coupon.couponNo) {
      return {
        title: '优惠券领取',
        path: '/pages/home/home',
      };
    }
    return {
      title: `${coupon.title}，点击领取`,
      path: `/pages/coupon/coupon-detail/index?couponNo=${coupon.couponNo}`,
    };
  },
});
