import { fetchCouponDetail } from '../../../services/coupon/index';

Page({
  data: {
    couponNo: '',
    detail: null,
    loading: true,
    errorMessage: '',
  },

  onLoad(query) {
    const couponNo = decodeURIComponent(String(query.couponNo || '').trim());
    this.setData({ couponNo });
    if (!couponNo) {
      this.setData({
        loading: false,
        errorMessage: '缺少优惠券编号，请返回优惠券管理页重新选择。',
      });
      return;
    }
    this.loadDetail(couponNo);
  },

  loadDetail(couponNo = this.data.couponNo) {
    this.setData({ loading: true, errorMessage: '' });
    fetchCouponDetail(couponNo).then(({ detail }) => {
      this.setData({
        detail,
        loading: false,
      });
    }).catch((err) => {
      this.setData({
        loading: false,
        errorMessage: err.message || '优惠券信息加载失败',
      });
    });
  },

  onShareAppMessage() {
    const detail = this.data.detail || {};
    const couponNo = this.data.couponNo || detail.couponNo || '';
    return {
      title: `${detail.title || '优惠券'}，点击领取`,
      path: `/pages/coupon/coupon-detail/index?couponNo=${encodeURIComponent(couponNo)}`,
    };
  },
});
