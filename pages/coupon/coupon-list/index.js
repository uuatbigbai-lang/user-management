import { fetchCouponList } from '../../../services/coupon/index';

Page({
  data: {
    status: 0,
    list: [
      {
        text: '可使用',
        key: 0,
      },
      {
        text: '已使用',
        key: 1,
      },
      {
        text: '已失效',
        key: 2,
      },
    ],

    couponList: [],
    loading: false,
    errorMessage: '',
  },

  onLoad() {
    this.init();
  },

  onShow() {
    if (this.hasLoaded) {
      this.fetchList();
    }
  },

  init() {
    this.fetchList();
  },

  fetchList(status = this.data.status) {
    let statusInFetch = '';
    switch (Number(status)) {
      case 0: {
        statusInFetch = 'default';
        break;
      }
      case 1: {
        statusInFetch = 'useless';
        break;
      }
      case 2: {
        statusInFetch = 'disabled';
        break;
      }
      default: {
        throw new Error(`unknown fetchStatus: ${statusInFetch}`);
      }
    }
    this.setData({ loading: true, errorMessage: '' });
    return fetchCouponList(statusInFetch).then((couponList) => {
      this.hasLoaded = true;
      this.setData({ couponList, loading: false });
    }).catch((err) => {
      const errorMessage = err.message || '获取优惠券失败';
      this.setData({ couponList: [], loading: false, errorMessage });
      wx.showToast({ title: errorMessage, icon: 'none' });
    });
  },

  tabChange(e) {
    const { value } = e.detail;

    this.setData({ status: value });
    this.fetchList(value);
  },

  onPullDownRefresh_(e) {
    const callback = e && e.detail && e.detail.callback;
    this.setData(
      {
        couponList: [],
      },
      () => {
        this.fetchList().finally(() => {
          callback && callback();
          wx.stopPullDownRefresh();
        });
      },
    );
  },
});
