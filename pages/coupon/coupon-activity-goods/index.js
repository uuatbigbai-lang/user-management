import { fetchCouponDetail } from '../../../services/coupon/index';
import { fetchGoodsList } from '../../../services/good/fetchGoods';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    goods: [],
    detail: {},
    couponTypeDesc: '',
    showStoreInfoList: false,
    cartNum: 2,
  },

  id: '',

  onLoad(query) {
    const id = query.couponNo || query.id;
    this.id = id;
    if (!id) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '缺少优惠券编号',
        icon: '',
      });
      return;
    }

    this.getCouponDetail(id);
    this.getGoodsList(id);
  },

  getCouponDetail(id) {
    fetchCouponDetail(id).then(({ detail }) => {
      this.setData({ detail });
      if (detail.type === 2) {
        if (detail.base > 0) {
          this.setData({
            couponTypeDesc: `满${detail.base / 100}元${detail.value}折`,
          });
        } else {
          this.setData({ couponTypeDesc: `${detail.value}折` });
        }
      } else if (detail.type === 1) {
        if (detail.base > 0) {
          this.setData({
            couponTypeDesc: `满${detail.base / 100}元减${detail.value / 100}元`,
          });
        } else {
          this.setData({ couponTypeDesc: `减${detail.value / 100}元` });
        }
      } else if (detail.type === 4) {
        this.setData({ couponTypeDesc: detail.title || '买二送一' });
      } else if (detail.ruleType === 'employee_price' || detail.templateType === 'employee_special') {
        this.setData({ couponTypeDesc: '按商品员工价自动结算' });
      }
    }).catch((err) => {
      Toast({
        context: this,
        selector: '#t-toast',
        message: err.message || '优惠券详情加载失败',
        icon: '',
      });
    });
  },

  getGoodsList(id) {
    fetchGoodsList(id).then((goods) => {
      this.setData({ goods });
    });
  },

  openStoreList() {
    this.setData({
      showStoreInfoList: true,
    });
  },

  closeStoreList() {
    this.setData({
      showStoreInfoList: false,
    });
  },

  goodClickHandle(e) {
    const { index } = e.detail;
    const { spuId } = this.data.goods[index];
    wx.navigateTo({ url: `/pages/goods/details/index?spuId=${spuId}` });
  },

  cartClickHandle() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '点击加入购物车',
    });
  },
});
