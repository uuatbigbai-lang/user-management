import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../../config/index';
import { priceFormat, formatTime } from '../../../utils/util';

Page({
  data: {
    loading: true,
    isSales: false,
    salesRoleLabel: '',
    profile: null,
    cards: [],
  },

  onLoad() {
    this.loadProfile();
  },

  onPullDownRefresh() {
    this.loadProfile();
  },

  loadProfile() {
    this.setData({ loading: true });
    return requestBackend({
      path: '/api/user/sales-profile',
      method: 'GET',
    }).then((res) => {
      const result = res.data || {};
      if (result.code !== 0) {
        throw new Error(result.message || '获取销售资料失败');
      }
      const profile = result.data?.profile || null;
      const isSales = !!result.data?.isSales;
      this.setData({
        loading: false,
        isSales,
        salesRoleLabel: result.data?.salesRoleLabel || '',
        profile,
        cards: profile ? [
          { label: '销售名字', value: profile.salesName || '-' },
          { label: '昵称快照', value: profile.userNickName || '-' },
          { label: '销售openid', value: profile.openid || '-' },
          { label: '绑定用户数', value: String(profile.boundUserCount || 0) },
          { label: '有效订单数', value: String(profile.orderCount || 0) },
          { label: '卖出货数', value: String(profile.soldQuantity || 0) },
          { label: '销售额', value: `¥${priceFormat(profile.totalSalesAmount || 0, 2)}` },
          { label: '注册时间', value: profile.createdAt ? formatTime(profile.createdAt, 'YYYY-MM-DD HH:mm:ss') : '-' },
          { label: '备注', value: profile.remark || '-' },
        ] : [],
      });
      wx.stopPullDownRefresh();
    }).catch((err) => {
      wx.stopPullDownRefresh();
      this.setData({ loading: false });
      Toast({
        context: this,
        selector: '#t-toast',
        message: err.message || '获取销售资料失败',
        icon: '',
        duration: 1600,
      });
    });
  },

  copyValue(e) {
    const value = e.currentTarget.dataset.value || '';
    if (!value || value === '-') return;
    wx.setClipboardData({ data: String(value) });
  },
});
