import {
  claimCoupon,
  createCouponShare,
  fetchCouponDetail,
  fetchMyCouponDetail,
} from '../../../services/coupon/index';
import { formatTime } from '../../../utils/util';

Page({
  data: {
    detail: null,
    storeInfoList: [],
    storeInfoStr: '',
    showStoreInfoList: false,
    fromShare: false,
    fromMine: false,
    shareId: '',
    claimed: false,
    errorMessage: '',
  },

  id: '',

  onLoad(query) {
    const id = query.couponNo || query.id;
    this.id = id;
    this.fromMine = query.source === 'mine';
    this.shareId = String(query.shareId || '').trim();
    this.setData({
      fromShare: !!query.couponNo,
      fromMine: this.fromMine,
      shareId: this.shareId,
    });
    if (!id) {
      this.setData({ errorMessage: '缺少优惠券编号，请从优惠券列表或分享链接进入。' });
      return;
    }
    this.getGoodsList(id);
  },

  getGoodsList(id) {
    const fetchDetail = this.fromMine ? fetchMyCouponDetail : fetchCouponDetail;
    fetchDetail(id).then(({ detail }) => {
      this.setData({
        detail: this.formatDetail(detail),
        claimed: detail && detail.recordStatus === 'claimed',
        errorMessage: '',
      });
    }).catch((err) => {
      const message = err.message || '优惠券不存在';
      this.setData({ errorMessage: message });
      wx.showToast({ title: message, icon: 'none' });
    });
  },

  formatDetail(detail = {}) {
    const used = detail.recordStatus === 'used';
    const statusText = used
      ? '已使用'
      : detail.recordStatus === 'claimed'
        ? '待使用'
        : detail.recordStatus === 'expired'
          ? '已失效'
          : detail.statusText || '待认领';
    const discountAmount = Number(detail.discountAmount || 0);
    return {
      ...detail,
      usageStatusText: statusText,
      usedAtText: used && detail.usedAt ? formatTime(detail.usedAt, 'YYYY-MM-DD HH:mm') : '',
      discountAmountText: used ? `¥${(discountAmount / 100).toFixed(2)}` : '',
    };
  },

  claimHandle() {
    if (!this.id) return;
    wx.showLoading({ title: '领取中', mask: true });
    claimCoupon(this.id, this.shareId).then((detail) => {
      wx.hideLoading();
      this.setData({ detail: this.formatDetail(detail), claimed: true });
      wx.showToast({ title: '领取成功', icon: 'success' });
    }).catch((err) => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '领取失败', icon: 'none' });
    });
  },

  goHomeHandle() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  forwardHandle() {
    if (!this.id || !this.data.detail || !this.data.detail.canForward) return;
    wx.showLoading({ title: '生成转发链接', mask: true });
    createCouponShare(this.id).then((share) => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/coupon/coupon-invite/index?couponNo=${encodeURIComponent(share.couponNo)}&shareId=${encodeURIComponent(share.shareId)}`,
      });
    }).catch((err) => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '暂时无法继续转发', icon: 'none' });
    });
  },

  navGoodListHandle() {
    wx.navigateTo({
      url: `/pages/coupon/coupon-activity-goods/index?couponNo=${this.id}`,
    });
  },

  goOrderHandle() {
    const orderNo = this.data.detail && this.data.detail.orderNo;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/pages/order/order-detail/index?id=${encodeURIComponent(orderNo)}`,
    });
  },
});
