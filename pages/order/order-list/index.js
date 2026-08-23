import { OrderStatus } from '../config';
import { fetchOrders, fetchOrdersCount } from '../../../services/order/orderList';
import { cosThumb } from '../../../utils/util';

// 商品图在列表中以 176rpx 展示；使用 320px 源图可覆盖高分屏显示，避免 70px 缩略图被放大后发糊。
const ORDER_LIST_THUMB_SIZE = 320;

const orderStatusTextMap = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PENDING_DELIVERY]: '待发货',
  [OrderStatus.PENDING_RECEIPT]: '待收货',
  [OrderStatus.COMPLETE]: '已完成',
  [OrderStatus.RETURNING]: '退货中',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.PAYMENT_TIMEOUT]: '已取消',
};

Page({
  data: {
    tabs: [
      { key: -1, text: '全部' },
      { key: OrderStatus.PENDING_PAYMENT, text: '待付款', info: '' },
      { key: OrderStatus.PENDING_DELIVERY, text: '待发货', info: '' },
      { key: OrderStatus.PENDING_RECEIPT, text: '待收货', info: '' },
      { key: OrderStatus.COMPLETE, text: '已完成', info: '' },
      { key: OrderStatus.RETURNING, text: '退货中', info: '' },
    ],
    curTab: -1,
    orderList: [],
    listLoading: 0,
    pullDownRefreshing: false,
    emptyImg: 'https://tdesign.gtimg.com/miniprogram/template/retail/order/empty-order-list.png',
    emptyTitle: '还没有订单',
    emptyDesc: '选一份喜欢的商品，第一笔订单会出现在这里',
    backRefresh: false,
    status: -1,
  },

  onLoad(query) {
    // 初始化分页对象
    this.page = {
      size: 10,
      num: 1,
    };
    
    let status = parseInt(query.status);
    status = this.data.tabs.map((t) => t.key).includes(status) ? status : -1;
    this.init(status);
    this.pullDownRefresh = this.selectComponent('#pull-down-refresh');
  },

  onShow() {
    if (!this.data.backRefresh) return;
    this.onRefresh();
    this.setData({ backRefresh: false });
  },

  onReachBottom() {
    if (this.data.listLoading === 0) {
      this.getOrderList(this.data.curTab);
    }
  },

  onPageScroll(e) {
    this.pullDownRefresh && this.pullDownRefresh.onPageScroll(e);
  },

  onPullDownRefreshChange(e) {
    this.setData({ pullDownRefreshing: !!(e && e.detail && e.detail.value) });
  },

  onPullDownRefresh_(e) {
    const callback = e && e.detail && e.detail.callback;
    this.setData({ pullDownRefreshing: true });
    return this.refreshList(this.data.curTab)
      .catch((err) => {
        console.error('刷新订单列表失败:', err);
      })
      .finally(() => {
        this.setData({ pullDownRefreshing: false });
        callback && callback();
        wx.stopPullDownRefresh();
      });
  },

  init(status) {
    status = status !== undefined ? status : this.data.curTab;
    this.setData({
      status,
    });
    this.refreshList(status);
  },

  getOrderList(statusCode = -1, reset = false) {
    wx.showLoading({ title: '加载中', mask: true });
    const params = {
      parameter: {
        pageSize: this.page.size,
        pageNum: this.page.num,
      },
    };
    if (statusCode !== -1) params.parameter.orderStatus = statusCode;
    this.setData({ listLoading: 1 });
    return fetchOrders(params)
      .then((res) => {
        wx.hideLoading()
        this.page.num++;
        let orderList = [];
        if (res && res.data && res.data.orders) {
          orderList = (res.data.orders || []).map((order) => {
            return {
              id: order.orderId,
              orderNo: order.orderNo,
              parentOrderNo: order.parentOrderNo,
              rightsNo: order.rightsNo,
              rightsType: order.rightsType,
              storeId: order.storeId,
              storeName: order.storeName,
              status: order.orderStatus,
              statusDesc: order.orderStatusName || orderStatusTextMap[order.orderStatus] || '未知状态',
              amount: order.paymentAmount || order.totalAmount,
              totalAmount: order.totalAmount,
              logisticsNo: order.logisticsVO ? order.logisticsVO.logisticsNo : null,
              createTime: order.createTime,
              goodsList: (order.orderItemVOs || []).map((goods) => ({
                id: goods.id,
                thumb: cosThumb(goods.thumb || goods.image || '', ORDER_LIST_THUMB_SIZE),
                title: goods.goodsName,
                skuId: goods.skuId,
                spuId: goods.spuId,
                specs: (goods.specifications || goods.skuSpecLst || []).map((spec) => spec.specValue),
                price: goods.tagPrice || goods.actualPrice || goods.settlePrice,
                num: goods.buyQuantity || goods.quantity,
                titlePrefixTags: goods.tagText ? [{ text: goods.tagText }] : [],
              })),
              buttons: order.buttonVOs || [],
              groupInfoVo: order.groupInfoVo,
              freightFee: order.freightFee,
            };
          });
          
        }
        return new Promise((resolve) => {
          if (reset) {
            this.setData({ orderList: [] }, () => resolve());
          } else resolve();
        }).then(() => {
          this.setData({
            orderList: this.data.orderList.concat(orderList),
            listLoading: orderList.length > 0 ? 0 : 2,
          });
        });
      })
      .catch((err) => {
        wx.hideLoading()
        this.setData({ listLoading: 3 });
        return Promise.reject(err);
      });
  },

  onReTryLoad() {
    this.getOrderList(this.data.curTab);
  },

  onTabChange(e) {
    const { value } = e.detail;
    this.setData({
      status: value,
    });
    this.refreshList(value);
  },

  getOrdersCount() {
    return fetchOrdersCount().then((res) => {
      const tabsCount = res.data || [];
      const { tabs } = this.data;
      tabs.forEach((tab) => {
        const tabCount = tabsCount.find((c) => c.tabType === tab.key);
        if (tabCount) {
          tab.info = tabCount.orderNum;
        }
      });
      this.setData({ tabs });
    });
  },

  refreshList(status = -1) {
    this.page = {
      size: this.page.size,
      num: 1,
    };
    this.setData({
      curTab: status,
      orderList: [],
      ...this.getEmptyState(status),
    });

    return Promise.all([this.getOrderList(status, true), this.getOrdersCount()]);
  },

  onRefresh() {
    this.refreshList(this.data.curTab);
  },

  onOrderCardTap(e) {
    const { order } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/order-detail/index?orderID=${order.id}`,
    });
  },

  getEmptyState(status) {
    const emptyMap = {
      [OrderStatus.PENDING_PAYMENT]: {
        emptyTitle: '没有待付款订单',
        emptyDesc: '下单后未完成支付的订单会显示在这里',
      },
      [OrderStatus.PENDING_DELIVERY]: {
        emptyTitle: '没有待发货订单',
        emptyDesc: '已支付、等待发货的订单会显示在这里',
      },
      [OrderStatus.PENDING_RECEIPT]: {
        emptyTitle: '没有待收货订单',
        emptyDesc: '商家发货后，你可以在这里查看物流进度',
      },
      [OrderStatus.COMPLETE]: {
        emptyTitle: '没有已完成订单',
        emptyDesc: '已支付完成的订单会显示在这里',
      },
      [OrderStatus.RETURNING]: {
        emptyTitle: '没有退货中订单',
        emptyDesc: '正在退货处理的订单会显示在这里',
      },
    };

    return (
      emptyMap[status] || {
        emptyTitle: '还没有订单',
        emptyDesc: '选一份喜欢的商品，第一笔订单会出现在这里',
      }
    );
  },

  onEmptyAction() {
    wx.switchTab({ url: '/pages/home/home' });
  },
});
