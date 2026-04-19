Page({
  data: {
    totalPaid: 0,
    orderID: '',
    groupId: '',
    groupon: null,
    spu: null,
    adUrl: '',
  },

  onLoad(options) {
    const { totalPaid = 0, orderID = '', groupId = '' } = options;
    this.setData({
      totalPaid,
      orderID,
      groupId,
    });
  },

  onTapReturn(e) {
    const target = e.currentTarget.dataset.type;
    const { orderID } = this.data;
    if (target === 'home') {
      wx.switchTab({ url: '/pages/home/home' });
    } else if (target === 'orderList') {
      wx.navigateTo({
        url: `/pages/order/order-list/index?orderID=${orderID}`,
      });
    } else if (target === 'order') {
      wx.navigateTo({
        url: `/pages/order/order-detail/index?orderID=${orderID}`,
      });
    }
  },

  navBackHandle() {
    wx.navigateBack();
  },
});
