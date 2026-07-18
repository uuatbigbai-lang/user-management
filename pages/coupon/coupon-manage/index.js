import {
  createCoupon,
  fetchAdminCouponList,
  fetchCouponProductOptions,
  fetchCouponTemplates,
  voidCoupon,
} from '../../../services/coupon/index';

Page({
  data: {
    couponTypes: [],
    couponList: [],
    loading: false,
    goodsPopupVisible: false,
    goodsLoading: false,
    goodsKeyword: '',
    goodsOptions: [],
    filteredGoodsOptions: [],
    selectedScopeSpuIds: [],
    pendingTemplate: null,
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

  isScopedDiscountTemplate(templateType) {
    const template = (this.data.couponTypes || []).find((item) => item.templateType === templateType);
    return !!template && template.ruleType === 'discount';
  },

  createHandle(e) {
    const { type } = e.currentTarget.dataset;
    if (this.isScopedDiscountTemplate(type)) {
      this.openGoodsPopup(type);
      return;
    }
    this.submitCreateCoupon(type, []);
  },

  openGoodsPopup(templateType) {
    this.setData({
      goodsPopupVisible: true,
      goodsKeyword: '',
      selectedScopeSpuIds: [],
      pendingTemplate: templateType,
    });
    if (this.data.goodsOptions.length) {
      this.applyGoodsFilter('');
      return;
    }
    this.setData({ goodsLoading: true });
    fetchCouponProductOptions().then((goodsOptions) => {
      this.setData({
        goodsOptions,
        filteredGoodsOptions: goodsOptions,
        goodsLoading: false,
      });
    }).catch((err) => {
      this.setData({ goodsLoading: false });
      wx.showToast({ title: err.message || '商品加载失败', icon: 'none' });
    });
  },

  closeGoodsPopup() {
    this.setData({
      goodsPopupVisible: false,
      goodsKeyword: '',
      selectedScopeSpuIds: [],
      pendingTemplate: null,
    });
  },

  applyGoodsFilter(keyword = '') {
    const text = String(keyword || '').trim().toLowerCase();
    const filteredGoodsOptions = !text
      ? this.data.goodsOptions
      : this.data.goodsOptions.filter((item) => {
          const haystack = `${item.title || ''}${item.brief || ''}${item.spuId || ''}`.toLowerCase();
          return haystack.indexOf(text) > -1;
        });
    this.setData({
      goodsKeyword: keyword,
      filteredGoodsOptions,
    });
  },

  onGoodsKeywordInput(e) {
    this.applyGoodsFilter(e.detail.value || '');
  },

  toggleScopeGoods(e) {
    const { spuId } = e.currentTarget.dataset;
    if (!spuId) return;
    const selected = new Set(this.data.selectedScopeSpuIds || []);
    if (selected.has(spuId)) {
      selected.delete(spuId);
    } else {
      selected.add(spuId);
    }
    this.setData({ selectedScopeSpuIds: Array.from(selected) });
  },

  clearScopeGoods() {
    this.setData({ selectedScopeSpuIds: [] });
  },

  confirmScopeCreate() {
    this.submitCreateCoupon(this.data.pendingTemplate, this.data.selectedScopeSpuIds || []);
  },

  submitCreateCoupon(templateType, scopeSpuIds = []) {
    wx.showLoading({ title: '生成中', mask: true });
    createCoupon(templateType, scopeSpuIds).then(() => {
      wx.hideLoading();
      this.closeGoodsPopup();
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
