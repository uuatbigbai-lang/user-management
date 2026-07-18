import { formatTime } from '../../../utils/util';
import { OrderStatus, LogisticsIconMap } from '../config';
import {
  dispatchOrderPay,
  fetchBusinessTime,
  fetchOrderDetail,
  fetchWechatWaybillToken,
  syncWechatOrderState,
} from '../../../services/order/orderDetail';
import Toast from 'tdesign-miniprogram/toast/index';
import { getAddressPromise } from '../../../services/address/list';
import { confirmOrderPaid, confirmOrderReceived } from '../../../services/order/orderConfirm';
import { wechatPayOrder } from '../order-confirm/pay';

let logisticsPlugin;
try {
  logisticsPlugin = requirePlugin('logisticsPlugin');
} catch (e) {
  logisticsPlugin = null;
}

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
    showContactService: false,
    showAfterSaleContactDialog: false,
    payLoading: false,
    pullDownRefreshing: false,
    showWechatLogisticsEntry: false,
    hasReceiverInfo: false,
    hasDeliveryInfo: false,
    wechatLogistics: {
      waybillToken: '',
      logisticsNo: '',
      company: '',
      statusText: '',
    },
    showSampleProgress: false,
    sampleProgress: {
      currentIndex: -1,
      currentText: '',
      steps: [],
    },
    /** 订单评论状态 */
    orderHasCommented: true,
  },

  onLoad(query) {
    this.query = query || {};
    this.orderID = this.resolveOrderIdentity(this.query);
    console.log('this.query', query);
    this.init();
    this.navbar = this.selectComponent('#navbar');
    this.pullDownRefresh = this.selectComponent('#t-pull-down-refresh');
  },

  resolveOrderIdentity(query = {}) {
    const raw =
      query.id ||
      query.out_trade_no ||
      query.outTradeNo ||
      query.orderNo ||
      query.orderID ||
      query.orderId ||
      '';
    return decodeURIComponent(String(raw || '')).trim();
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
  onPullDownRefreshChange(e) {
    this.setData({ pullDownRefreshing: !!(e && e.detail && e.detail.value) });
  },

  onPullDownRefresh_(e) {
    const callback = e && e.detail && e.detail.callback;
    this.setData({ pullDownRefreshing: true });
    return this.getDetail()
      .catch((err) => {
        console.error('刷新订单详情失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '刷新失败，请稍后重试',
          duration: 1500,
          icon: '',
        });
      })
      .finally(() => {
        this.setData({ pullDownRefreshing: false });
        callback && callback();
      });
  },

  getDetail() {
    if (!this.orderID) {
      this.handleError();
      return Promise.reject(new Error('缺少订单参数'));
    }

    const params = {
      parameter: this.orderID,
    };
    console.log('about to pass parameter', params);
    return fetchOrderDetail(params)
      .then((res) => {
        const order = res.data;
        if (order && Number(order.orderStatus) === OrderStatus.PENDING_RECEIPT) {
          return syncWechatOrderState({
            orderNo: order.orderNo,
            orderId: order.orderId,
          })
            .then((syncRes) => syncRes.data.order || order)
            .catch((err) => {
              console.warn('同步微信订单状态失败:', err);
              return order;
            });
        }
        return order;
      })
      .then((order) => {
      
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
      order.orderStatusRemark =
        order.orderStatus === OrderStatus.PENDING_PAYMENT ? order.orderStatusRemark || '' : '';
      this.orderNo = order.orderNo;
      const _order = {
        id: order.orderId,
        orderNo: order.orderNo,
        parentOrderNo: order.parentOrderNo,
        rightsNo: order.rightsNo,
        rightsType: order.rightsType,
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
      
      const wechatLogistics = this.buildWechatLogistics(order);
      const sampleProgress = this.buildSampleProgress(order);
      const hasReceiverInfo = !!(
        (order.logisticsVO && (order.logisticsVO.receiverName || order.logisticsVO.receiverPhone)) ||
        this.composeAddress(order)
      );
      const hasDeliveryInfo = !!(
        (order.logisticsVO && (order.logisticsVO.logisticsNo || order.logisticsVO.waybillToken)) ||
        Number(order.orderStatus) === OrderStatus.PENDING_RECEIPT
      );

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
        showContactService: order.orderStatus !== OrderStatus.PENDING_PAYMENT,
        showWechatLogisticsEntry: this.shouldShowWechatLogisticsEntry(order, wechatLogistics),
        hasReceiverInfo,
        hasDeliveryInfo,
        wechatLogistics,
        showSampleProgress: sampleProgress.show,
        sampleProgress,
      });
    });
  },

  buildWechatLogistics(order) {
    const logistics = order.logisticsVO || {};
    const waybillToken =
      order.waybillToken ||
      order.waybill_token ||
      logistics.waybillToken ||
      logistics.waybill_token ||
      '';

    return {
      waybillToken,
      logisticsNo: logistics.logisticsNo || '',
      company: logistics.logisticsCompanyName || '',
      statusText: waybillToken ? '可查看微信物流详情' : '暂无微信物流查询凭证',
    };
  },

  shouldShowWechatLogisticsEntry(order, wechatLogistics) {
    if (wechatLogistics.waybillToken) return true;
    if (wechatLogistics.logisticsNo) return true;
    return false;
  },

  isSampleOrder(order) {
    const goodsList = order.orderItemVOs || [];
    return goodsList.some((goods = {}) => {
      const text = [
        goods.goodsName,
        goods.spuId,
        goods.skuId,
        goods.tagText,
        goods.outCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return /检测|样本|菌群|testkit|sample/.test(text);
    });
  },

  normalizeSampleStatus(order) {
    const raw = String(
      order.sampleStatus ||
        order.sample_status ||
        order.sampleStatusName ||
        order.sample_status_name ||
        '',
    )
      .trim()
      .toLowerCase();

    if (/检测完成|completed|complete|done|report|报告/.test(raw)) return 2;
    if (/样本检测中|检测中|testing|processing|analysis/.test(raw)) return 1;
    if (/回寄中|寄回|returning|returned|sample_return/.test(raw)) return 0;

    if (order.orderStatus === OrderStatus.COMPLETE) return 0;
    return -1;
  },

  buildSampleProgress(order) {
    const show = this.isSampleOrder(order) && order.orderStatus !== OrderStatus.PENDING_PAYMENT;
    const currentIndex = show ? this.normalizeSampleStatus(order) : -1;
    const steps = [
      {
        title: '回寄中',
        desc: '等待客户回寄样本',
      },
      {
        title: '样本检测中',
        desc: '实验室检测分析中',
      },
      {
        title: '检测完成',
        desc: '报告生成后可查看',
      },
    ].map((step, index) => ({
      ...step,
      active: index === currentIndex,
      done: currentIndex >= index,
    }));

    return {
      show,
      currentIndex,
      currentText: currentIndex >= 0 ? steps[currentIndex].title : '待客户收货后开始',
      steps,
    };
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

  onConfirmReceived(e) {
    const order = (e && e.detail && e.detail.order) || this.data.order || {};
    wx.showLoading({ title: '确认中', mask: true });
    return confirmOrderReceived({
      orderId: order.id || order.orderId,
      orderNo: order.orderNo,
    })
      .then(({ data }) => {
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '已确认收货',
          duration: 1200,
          icon: 'check-circle',
        });
        return this.getDetail(data);
      })
      .catch((err) => {
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: err.message || '确认收货失败',
          duration: 1800,
          icon: '',
        });
      });
  },

  onContactServiceFromAfterSale() {
    this.setData({ showAfterSaleContactDialog: true });
  },

  onAfterSaleContactTap() {
    this.setData({ showAfterSaleContactDialog: false });
  },

  onAfterSaleContactCancel() {
    this.setData({ showAfterSaleContactDialog: false });
  },

  noop() {
    return false;
  },

  onWechatLogisticsTap() {
    const { waybillToken } = this.data.wechatLogistics || {};

    if (!waybillToken) {
      const logistics = this.data.order.logisticsVO || {};
      if (!logistics.logisticsNo) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '暂无物流单号',
          duration: 1500,
          icon: '',
        });
        return;
      }

      wx.showLoading({ title: '获取物流凭证中', mask: true });
      return fetchWechatWaybillToken({
        orderNo: this.data.order.orderNo,
        orderId: this.data.order.orderId,
      })
        .then(({ data }) => {
          wx.hideLoading();
          const nextToken = data.waybillToken || '';
          if (!nextToken) throw new Error('微信未返回物流查询凭证');

          this.setData({
            order: data.order || this.data.order,
            'wechatLogistics.waybillToken': nextToken,
            'wechatLogistics.statusText': '可查看微信物流详情',
          });
          this.openWechatWaybillTracking(nextToken);
        })
        .catch((err) => {
          wx.hideLoading();
          Toast({
            context: this,
            selector: '#t-toast',
            message: err.message || '暂无微信物流查询凭证',
            duration: 2200,
            icon: '',
          });
        });
    }

    this.openWechatWaybillTracking(waybillToken);
  },

  openWechatWaybillTracking(waybillToken) {
    if (!waybillToken) return;

    if (!logisticsPlugin || typeof logisticsPlugin.openWaybillTracking !== 'function') {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请使用预览或真机打开微信物流查询',
        duration: 2000,
        icon: '',
      });
      return;
    }

    Toast({
      context: this,
      selector: '#t-toast',
      message: '正在打开微信物流',
      duration: 1200,
      icon: '',
    });

    try {
      logisticsPlugin.openWaybillTracking({
        waybillToken,
        success: () => {
          console.log('微信物流查询打开成功');
        },
        fail: (err) => {
          console.error('微信物流查询打开失败:', err);
          Toast({
            context: this,
            selector: '#t-toast',
            message: (err && (err.errMsg || err.message)) || '微信物流查询打开失败',
            duration: 2200,
            icon: '',
          });
        },
      });
    } catch (err) {
      console.error('调用微信物流插件异常:', err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: (err && (err.errMsg || err.message)) || '调用微信物流插件失败',
        duration: 2200,
        icon: '',
      });
    }
  },

  onOrderPay() {
    const { order, payLoading } = this.data;
    if (payLoading) return;
    if (!order || order.orderStatus !== OrderStatus.PENDING_PAYMENT) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '当前订单状态不可支付',
        duration: 1500,
        icon: '',
      });
      return;
    }

    this.setData({ payLoading: true });
    wx.showLoading({ title: '发起支付中', mask: true });

    dispatchOrderPay({
      orderId: order.orderId,
      orderNo: order.orderNo,
    })
      .then(({ data }) => {
        wx.hideLoading();
        if (data.payInfo) {
          return wechatPayOrder({
            payInfo: data.payInfo,
            orderId: data.orderId,
            orderAmt: data.totalAmount || order.totalAmount,
            payAmt: data.paymentAmount || order.paymentAmount,
            tradeNo: data.tradeNo || data.orderNo,
            orderNo: data.orderNo,
            transactionId: data.transactionId,
            context: this,
            dialogOnCancel: false,
          });
        }

        return confirmOrderPaid({
          orderId: data.orderId,
          orderNo: data.orderNo,
        }).then(() => {
          wx.redirectTo({
            url: `/pages/order/pay-result/index?totalPaid=${data.paymentAmount || order.paymentAmount}&orderID=${data.orderId}`,
          });
        });
      })
      .catch((err) => {
        wx.hideLoading();
        if (err && err.errMsg === 'requestPayment:fail cancel') return;
        console.error('继续支付失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: (err && err.message) || '发起支付失败，请稍后重试',
          duration: 2000,
          icon: '',
        });
      })
      .finally(() => {
        this.setData({ payLoading: false });
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
