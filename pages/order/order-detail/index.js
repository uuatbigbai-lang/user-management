import { formatTime } from '../../../utils/util';
import { OrderStatus, LogisticsIconMap } from '../config';
import { fetchBusinessTime, fetchOrderDetail } from '../../../services/order/orderDetail';
import Toast from 'tdesign-miniprogram/toast/index';
import { getAddressPromise } from '../../../services/address/list';

Page({
  data: {
    pageLoading: true,
    order: {}, // 后台返回的原始数据
    _order: {}, // 内部使用和提供给 order-card 的数据
    storeDetail: {},
    countDownTime: null,
    addressEditable: false,
    backRefresh: false, // 用于接收其他页面back时的状态
    formatCreateTime: '', //格式化订单创建时间
    logisticsNodes: [],
    /** 订单评论状态 */
    orderHasCommented: true,
  },

  onLoad(query) {
    this.orderID = query.orderID;
    console.log('this.query', query)
    this.init();
    this.navbar = this.selectComponent('#navbar');
    this.pullDownRefresh = this.selectComponent('#wr-pull-down-refresh');
  },

  onShow() {
    // 当从其他页面返回，并且 backRefresh 被置为 true 时，刷新数据
    if (!this.data.backRefresh) return;
    this.onRefresh();
    this.setData({ backRefresh: false });
  },

  onPageScroll(e) {
    this.pullDownRefresh && this.pullDownRefresh.onPageScroll(e);
  },

  onImgError(e) {
    if (e.detail) {
      console.error('img 加载失败');
    }
  },

  // 页面初始化，会展示pageLoading
  init() {
    this.setData({ pageLoading: true });
    this.getStoreDetail();
    this.getDetail()
      .then(() => {
        this.setData({ pageLoading: false });
      })
      .catch((e) => {
        console.error('获取订单详情失败:', e);
        this.handleError();
      });
  },

  // 错误处理方法
  handleError() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '获取订单详情失败，请稍后重试',
      duration: 2000,
      icon: '',
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
    this.setData({
      pageLoading: false,
    });
  },

  // 页面刷新，展示下拉刷新
  onRefresh() {
    this.init();
    // 如果上一页为订单列表，通知其刷新数据
    const pages = getCurrentPages();
    const lastPage = pages[pages.length - 2];
    if (lastPage) {
      lastPage.data.backRefresh = true;
    }
  },

  // 页面刷新，展示下拉刷新
  onPullDownRefresh_(e) {
    const { callback } = e.detail;
    return this.getDetail().then(() => callback && callback());
  },

  getDetail() {
    const params = {
      parameter: this.orderID,
    };
    console.log('about to pass parameter', params)
    return fetchOrderDetail(params).then((res) => {
      const order = res.data;
      
      // 数据完整性检查
      if (!order) {
        throw new Error('订单数据为空');
      }
      
      // 确保必要字段存在，添加默认值
      order.logisticsVO = order.logisticsVO || {};
      order.orderItemVOs = order.orderItemVOs || [];
      order.paymentVO = order.paymentVO || {};
      order.invoiceVO = order.invoiceVO || {};
      order.trajectoryVos = order.trajectoryVos || [];
      order.buttonVOs = order.buttonVOs || [];
      order.orderStatusRemark = '已' + order.orderStatusRemark.split('').slice(1).join('');
      this.orderNo = order.orderNo;
      const _order = {
        id: order.orderId,
        orderNo: order.orderNo,
        parentOrderNo: order.parentOrderNo,
        storeId: order.storeId,
        storeName: order.storeName,
        status: order.orderStatus,
        statusDesc: order.orderStatusName || '未知状态',
        amount: order.paymentAmount || 0,
        totalAmount: order.goodsAmountApp || order.totalAmount || 0,
        logisticsNo: (order.logisticsVO && order.logisticsVO.logisticsNo) || '',
        goodsList: (order.orderItemVOs || []).map((goods) => {
          // 确保商品数据完整性
          const safeGoods = goods || {};
          return Object.assign({}, safeGoods, {
            id: safeGoods.id,
            thumb: safeGoods.thumb || '',
            title: safeGoods.goodsName || '商品名称',
            skuId: safeGoods.skuId,
            spuId: safeGoods.spuId,
            specs: (safeGoods.specInfo || []).map((s) => (s && s.specValue) || ''),
            price: safeGoods.tagPrice || safeGoods.actualPrice || 0, // 商品销售单价, 优先取限时活动价
            num: safeGoods.buyQuantity || 0,
            titlePrefixTags: safeGoods.tagText ? [{ text: safeGoods.tagText }] : [],
            buttons: safeGoods.buttonVOs || [],
          });
        }),
        buttons: order.buttonVOs || [],
        createTime: order.createTime,
        receiverAddress: this.composeAddress(order),
        groupInfoVo: order.groupInfoVo || {},
      };
      
      this.setData({
        order,
        _order,
        formatCreateTime: formatTime(parseFloat(`${order.createTime || Date.now()}`), 'YYYY-MM-DD HH:mm'), // 格式化订单创建时间
        countDownTime: this.computeCountDownTime(order),
        addressEditable:
          [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_DELIVERY].includes(order.orderStatus) &&
          order.orderSubStatus !== -1, // 订单正在取消审核时不允许修改地址（但是返回的状态码与待发货一致）
        isPaid: !!(order.paymentVO && order.paymentVO.paySuccessTime),
        invoiceStatus: this.datermineInvoiceStatus(order),
        invoiceDesc: order.invoiceDesc || '',
        invoiceType: (order.invoiceVO && order.invoiceVO.invoiceType === 5) ? '电子普通发票' : '不开发票', //是否开票 0-不开 5-电子发票
        logisticsNodes: this.flattenNodes(order.trajectoryVos || []),
      });
    });
  },

  // 展开物流节点
  flattenNodes(nodes) {
    return (nodes || []).reduce((res, node) => {
      return (node.nodes || []).reduce((res1, subNode, index) => {
        res1.push({
          title: index === 0 ? node.title : '', // 子节点中仅第一个显示title
          desc: subNode.status,
          date: formatTime(+subNode.timestamp, 'YYYY-MM-DD HH:mm:ss'),
          icon: index === 0 ? LogisticsIconMap[node.code] || '' : '', // 子节点中仅第一个显示icon
        });
        return res1;
      }, res);
    }, []);
  },

  datermineInvoiceStatus(order) {
    // 1-已开票
    // 2-未开票（可补开）
    // 3-未开票
    // 4-门店不支持开票
    return order.invoiceStatus;
  },

  // 拼接省市区
  composeAddress(order) {
    const logistics = order.logisticsVO || {};
    return [
      //logistics.receiverProvince,
      logistics.receiverCity,
      logistics.receiverCountry,
      logistics.receiverArea,
      logistics.receiverAddress,
    ]
      .filter((s) => !!s)
      .join(' ');
  },

  getStoreDetail() {
    fetchBusinessTime().then((res) => {
      const storeDetail = {
        storeTel: res.data.telphone,
        storeBusiness: res.data.businessTime.join('\n'),
      };
      this.setData({ storeDetail });
    });
  },

  // 仅对待支付状态计算付款倒计时
  // 返回时间若是大于2020.01.01，说明返回的是关闭时间，否则说明返回的直接就是剩余时间
  computeCountDownTime(order) {
    if (order.orderStatus !== OrderStatus.PENDING_PAYMENT) return null;
    return order.autoCancelTime > 1577808000000 ? order.autoCancelTime - Date.now() : order.autoCancelTime;
  },

  onCountDownFinish() {
    //this.setData({ countDownTime: -1 });
    const { countDownTime, order } = this.data;
    if (countDownTime > 0 || (order && order.groupInfoVo && order.groupInfoVo.residueTime > 0)) {
      this.onRefresh();
    }
  },

  onGoodsCardTap(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.order.orderItemVOs[index];
    wx.navigateTo({ url: `/pages/goods/details/index?spuId=${goods.spuId}` });
  },

  onEditAddressTap() {
    getAddressPromise()
      .then((address) => {
        if (address) {
          // 确保 logisticsVO 对象存在
          const order = this.data.order;
          if (!order.logisticsVO) {
            order.logisticsVO = {};
          }
          
          this.setData({
            'order.logisticsVO.receiverName': address.name || '',
            'order.logisticsVO.receiverPhone': address.phone || '',
            '_order.receiverAddress': address.address || '',
          });
        }
      })
      .catch((error) => {
        console.error('获取地址失败:', error);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '获取地址信息失败',
          duration: 1500,
        });
      });

    wx.navigateTo({
      url: `/pages/user/address/list/index?selectMode=1`,
    });
  },

  onOrderNumCopy() {
    wx.setClipboardData({
      data: this.data.order.orderNo,
    });
  },

  onDeliveryNumCopy() {
    const logisticsNo = (this.data.order.logisticsVO && this.data.order.logisticsVO.logisticsNo) || '';
    if (logisticsNo) {
      wx.setClipboardData({
        data: logisticsNo,
      });
    } else {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '暂无物流单号',
        duration: 1500,
      });
    }
  },

  onToInvoice() {
    wx.navigateTo({
      url: `/pages/order/invoice/index?orderNo=${this.data._order.orderNo}`,
    });
  },

  onSuppleMentInvoice() {
    wx.navigateTo({
      url: `/pages/order/receipt/index?orderNo=${this.data._order.orderNo}`,
    });
  },

  onDeliveryClick() {
    const logistics = this.data.order.logisticsVO || {};
    const logisticsData = {
      nodes: this.data.logisticsNodes || [],
      company: logistics.logisticsCompanyName || '未知物流公司',
      logisticsNo: logistics.logisticsNo || '',
      phoneNumber: logistics.logisticsCompanyTel || '',
    };
    
    if (!logisticsData.logisticsNo) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '暂无物流信息',
        duration: 1500,
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/order/delivery-detail/index?data=${encodeURIComponent(JSON.stringify(logisticsData))}`,
    });
  },

  /** 跳转订单评价 */
  navToCommentCreate() {
    wx.navigateTo({
      url: `/pages/order/createComment/index?orderNo=${this.orderNo}`,
    });
  },

  /** 跳转拼团详情/分享页*/
  toGrouponDetail() {
    wx.showToast({ title: '点击了拼团' });
  },

  clickService() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '您点击了联系客服',
    });
  },

  onOrderInvoiceView() {
    wx.navigateTo({
      url: `/pages/order/invoice/index?orderNo=${this.orderNo}`,
    });
  },
});
