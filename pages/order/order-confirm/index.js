import Toast from 'tdesign-miniprogram/toast/index';
import { confirmOrderPaid, fetchSettleDetail } from '../../../services/order/orderConfirm';
import { commitPay, wechatPayOrder } from './pay';
import { getAddressPromise } from '../../../services/address/list';
import { requestBackend } from '../../../config/index';

const stripeImg = `https://tdesign.gtimg.com/miniprogram/template/retail/order/stripe.png`;

Page({
  data: {
    placeholder: '备注信息',
    stripeImg,
    loading: false,
    settleDetailData: {
      storeGoodsList: [], //正常下单商品列表
      outOfStockGoodsList: [], //库存不足商品
      abnormalDeliveryGoodsList: [], // 不能正常配送商品
      inValidGoodsList: [], // 失效或者库存不足
      limitGoodsList: [], //限购商品
      couponList: [], //门店优惠券信息
    }, // 获取结算页详情 data
    orderCardList: [], // 仅用于商品卡片展示
    couponsShow: false, // 显示优惠券的弹框
    invoiceData: {
      email: '', // 发票发送邮箱
      buyerTaxNo: '', // 税号
      invoiceType: null, // 开票类型  1：增值税专用发票； 2：增值税普通发票； 3：增值税电子发票；4：增值税卷式发票；5：区块链电子发票。
      buyerPhone: '', //手机号
      buyerName: '', //个人或公司名称
      titleType: '', // 发票抬头 1-公司 2-个人
      contentType: '', //发票内容 1-明细 2-类别
    },
    goodsRequestList: [],
    userAddressReq: null,
    popupShow: false, // 不在配送范围 失效 库存不足 商品展示弹框
    notesPosition: 'center',
    storeInfoList: [],
    storeNoteIndex: 0, //当前填写备注门店index
    promotionGoodsList: [], //当前门店商品列表(优惠券)
    couponList: [], //当前门店所选优惠券
    submitCouponList: [], //所有门店所选优惠券
    currentStoreId: null, //当前优惠券storeId
    userAddress: null,
  },

  payLock: false,
  noteInfo: [],
  tempNoteInfo: [],
  onLoad(options) {
    this.setData({
      loading: true,
    });
    this.handleOptionsParams(options);
  },
  onShow() {
    const invoiceData = wx.getStorageSync('invoiceData');
    if (invoiceData) {
      //处理发票
      this.invoiceData = invoiceData;
      this.setData({
        invoiceData,
      });
      wx.removeStorageSync('invoiceData');
    }
  },

  init() {
    this.setData({
      loading: true,
    });
    const { goodsRequestList } = this;
    this.handleOptionsParams({ goodsRequestList });
  },
  // 处理不同情况下跳转到结算页时需要的参数
  handleOptionsParams(options, couponList) {
    let { goodsRequestList } = this; // 商品列表
    let { userAddressReq } = this; // 收货地址

    const storeInfoList = []; // 门店列表
    // 如果是从地址选择页面返回，则使用地址显选择页面新选择的地址去获取结算数据
    if (options.userAddressReq) {
      userAddressReq = options.userAddressReq;
    }
    const app = getApp();
    const temp = app.globalData.temp;
    if (options.type === 'cart') {
      // 从购物车跳转过来时，获取传入的商品列表数据
      const goodsRequestListJson = wx.getStorageSync('order.goodsRequestList');
      goodsRequestList = JSON.parse(goodsRequestListJson);
    } else if (temp) {
      console.log('options:', temp)
      goodsRequestList = [temp];
      app.globalData.temp = null;
    }
    //获取结算页请求数据列表
    const storeMap = {};
    goodsRequestList.forEach((goods) => {
      if (!storeMap[goods.storeId]) {
        storeInfoList.push({
          storeId: goods.storeId,
          storeName: goods.storeName,
        });
        storeMap[goods.storeId] = true;
      }
    });
    this.goodsRequestList = goodsRequestList;
    this.storeInfoList = storeInfoList;
    const params = {
      goodsRequestList,
      storeInfoList,
      userAddressReq,
      couponList,
    };

    // 并行请求结算数据和默认地址
    Promise.all([
      fetchSettleDetail(params),
      requestBackend({ path: '/api/address/default' }),
    ]).then(
      ([settleRes, addrRes]) => {
        // 优先使用用户手动选择的地址，其次用默认地址
        if (userAddressReq && userAddressReq.name) {
          // 用户从地址选择页返回时带入的地址
          userAddressReq.address = userAddressReq.address || `${userAddressReq.provinceName || ''}${userAddressReq.cityName || ''}${userAddressReq.districtName || ''}${userAddressReq.detailAddress || ''}`;
          settleRes.data.userAddress = userAddressReq;
        } else if (addrRes.data.code === 0 && addrRes.data.data) {
          // 后端返回的默认地址
          const addr = addrRes.data.data;
          addr.address = addr.address || `${addr.provinceName}${addr.cityName}${addr.districtName}${addr.detailAddress}`;
          settleRes.data.userAddress = addr;
        }

        this.setData({ loading: false });
        this.initData(settleRes.data);
      },
      () => {
        this.handleError();
      },
    );
  },
  async getAddress() {






    // this.setData({ userAddress: res.data[0] });
    const raw = this.data.settleDetailData;
    raw.settleType = 1;
    this.setData({ settleDetailData: raw });
    this.userAddressReq = res.data[0];

  },
  initData(resData) {
    // 转换商品卡片显示数据
    const data = this.handleResToGoodsCard(resData);
    this.userAddressReq = resData.userAddress;

    if (resData.userAddress) {
      this.setData({ userAddress: resData.userAddress });
    }
    this.setData({ settleDetailData: data });
    this.isInvalidOrder(data);
  },

  isInvalidOrder(data) {
    // 失效 不在配送范围 限购的商品 提示弹窗
    if (
      (data.limitGoodsList && data.limitGoodsList.length > 0) ||
      (data.abnormalDeliveryGoodsList && data.abnormalDeliveryGoodsList.length > 0) ||
      (data.inValidGoodsList && data.inValidGoodsList.length > 0)
    ) {
      this.setData({ popupShow: true });
      return true;
    }
    this.setData({ popupShow: false });
    if (data.settleType === 0) {
      return true;
    }
    return false;
  },

  handleError() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '结算异常, 请稍后重试',
      duration: 2000,
      icon: '',
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
    this.setData({
      loading: false,
    });
  },
  getRequestGoodsList(storeGoodsList) {
    const filterStoreGoodsList = [];
    storeGoodsList &&
      storeGoodsList.forEach((store) => {
        const { storeName } = store;
        store.skuDetailVos &&
          store.skuDetailVos.forEach((goods) => {
            const data = goods;
            data.storeName = storeName;
            filterStoreGoodsList.push(data);
          });
      });
    return filterStoreGoodsList;
  },
  handleGoodsRequest(goods, isOutStock = false) {
    const { reminderStock, quantity, storeId, uid, saasId, spuId, goodsName, skuId, storeName, roomId } = goods;
    const resQuantity = isOutStock ? reminderStock : quantity;
    return {
      quantity: resQuantity,
      storeId,
      uid,
      saasId,
      spuId,
      goodsName,
      skuId,
      storeName,
      roomId,
    };
  },
  handleResToGoodsCard(data) {
    // 转换数据 符合 goods-card展示
    const orderCardList = []; // 订单卡片列表
    const storeInfoList = [];
    const submitCouponList = []; //使用优惠券列表;

    data.storeGoodsList &&
      data.storeGoodsList.forEach((ele) => {
        const orderCard = {
          id: ele.storeId,
          storeName: ele.storeName,
          status: 0,
          statusDesc: '',
          amount: ele.storeTotalPayAmount,
          goodsList: [],
        }; // 订单卡片
        ele.skuDetailVos.forEach((item, index) => {
          orderCard.goodsList.push({
            id: index,
            thumb: item.image,
            title: item.goodsName,
            specs: item.skuSpecLst.map((s) => s.specValue), // 规格列表 string[]
            price: item.tagPrice || item.settlePrice || '0', // 优先取限时活动价
            settlePrice: item.settlePrice,
            titlePrefixTags: item.tagText ? [{ text: item.tagText }] : [],
            num: item.quantity,
            skuId: item.skuId,
            spuId: item.spuId,
            storeId: item.storeId,
          });
        });

        storeInfoList.push({
          storeId: ele.storeId,
          storeName: ele.storeName,
          remark: '',
        });
        submitCouponList.push({
          storeId: ele.storeId,
          couponList: ele.couponList || [],
        });
        this.noteInfo.push('');
        this.tempNoteInfo.push('');
        orderCardList.push(orderCard);
      });

    this.setData({ orderCardList, storeInfoList, submitCouponList });
    return data;
  },
  onGotoAddress() {
    /** 获取一个Promise */
    getAddressPromise()
      .then((address) => {
        // 选择地址后，将该地址设为默认地址
        const addrId = address.addressId || address.id;
        if (addrId) {
          requestBackend({
            path: '/api/address/update',
            method: 'POST',
            data: { addressId: addrId, isDefault: 1 },
          });
        }
        this.handleOptionsParams({
          userAddressReq: { ...address, checked: true },
        });
      })
      .catch(() => { });

    const { userAddressReq } = this; // 收货地址

    let id = '';

    if (userAddressReq?.id) {
      id = `&id=${userAddressReq.id}`;
    }

    wx.navigateTo({
      url: `/pages/user/address/list/index?selectMode=1&isOrderSure=1${id}`,
    });
  },
  onNotes(e) {
    const { storenoteindex: storeNoteIndex } = e.currentTarget.dataset;
    // 添加备注信息
    this.setData({
      dialogShow: true,
      storeNoteIndex,
    });
  },
  onInput(e) {
    const { storeNoteIndex } = this.data;
    this.noteInfo[storeNoteIndex] = e.detail.value;
  },
  onBlur() {
    this.setData({
      notesPosition: 'center',
    });
  },
  onFocus() {
    this.setData({
      notesPosition: 'self',
    });
  },
  onTap() {
    this.setData({
      placeholder: '',
    });
  },
  onNoteConfirm() {
    // 备注信息 确认按钮
    const { storeInfoList, storeNoteIndex } = this.data;
    this.tempNoteInfo[storeNoteIndex] = this.noteInfo[storeNoteIndex];
    storeInfoList[storeNoteIndex].remark = this.noteInfo[storeNoteIndex];

    this.setData({
      dialogShow: false,
      storeInfoList,
    });
  },
  onNoteCancel() {
    // 备注信息 取消按钮
    const { storeNoteIndex } = this.data;
    this.noteInfo[storeNoteIndex] = this.tempNoteInfo[storeNoteIndex];
    this.setData({
      dialogShow: false,
    });
  },

  onSureCommit() {
    // 商品库存不足继续结算
    const { settleDetailData } = this.data;
    const { outOfStockGoodsList, storeGoodsList, inValidGoodsList } = settleDetailData;
    if ((outOfStockGoodsList && outOfStockGoodsList.length > 0) || (inValidGoodsList && storeGoodsList)) {
      // 合并正常商品 和 库存 不足商品继续支付
      // 过滤不必要的参数
      const filterOutGoodsList = [];
      outOfStockGoodsList &&
        outOfStockGoodsList.forEach((outOfStockGoods) => {
          const { storeName } = outOfStockGoods;
          outOfStockGoods.unSettlementGoods.forEach((ele) => {
            const data = ele;
            data.quantity = ele.reminderStock;
            data.storeName = storeName;
            filterOutGoodsList.push(data);
          });
        });
      const filterStoreGoodsList = this.getRequestGoodsList(storeGoodsList);
      const goodsRequestList = filterOutGoodsList.concat(filterStoreGoodsList);
      this.handleOptionsParams({ goodsRequestList });
    }
  },
  // 提交订单：创建订单后，生产环境调起微信支付；未配置支付参数时保留本地模拟成功。
  submitOrder() {
    const { settleDetailData, userAddressReq, invoiceData, storeInfoList, submitCouponList } = this.data;
    const { goodsRequestList } = this;

    // 校验收货地址
    const address = settleDetailData.userAddress || userAddressReq;
    if (!address || !address.name) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先选择收货地址',
        duration: 2000,
        icon: '',
      });
      return;
    }

    if (this.payLock) return;
    this.payLock = true;

    const resSubmitCouponList = this.handleCouponList(submitCouponList);
    const params = {
      userAddressReq: settleDetailData.userAddress || userAddressReq,
      goodsRequestList: goodsRequestList,
      userName: (settleDetailData.userAddress && settleDetailData.userAddress.name) || (userAddressReq && userAddressReq.name) || '',
      totalAmount: settleDetailData.totalPayAmount,
      invoiceRequest: null,
      storeInfoList,
      couponList: resSubmitCouponList,
    };
    if (invoiceData && invoiceData.email) {
      params.invoiceRequest = invoiceData;
    }

    wx.showLoading({ title: '提交订单中', mask: true });

    commitPay(params).then(
      (res) => {
        wx.hideLoading();
        this.payLock = false;
        const orderData = res.result.data;
        console.log('订单创建成功:', orderData);

        if (orderData.payInfo) {
          this.handlePay(orderData, settleDetailData);
          return;
        }

        // 本地开发或后端未配置微信商户参数时，模拟支付成功并同步订单状态。
        confirmOrderPaid({
          orderId: orderData.orderId,
          orderNo: orderData.orderNo,
        })
          .catch((err) => {
            console.warn('同步支付状态失败:', err);
          })
          .finally(() => {
            wx.redirectTo({
              url: `/pages/order/pay-result/index?totalPaid=${params.totalAmount}&orderID=${orderData.orderId}`,
            });
          });
      },
      (err) => {
        wx.hideLoading();
        this.payLock = false;
        console.error('创建订单失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: (err && err.message) || '提交订单失败，请稍后重试',
          duration: 2000,
          icon: '',
        });
      },
    );
  },

  // 处理支付
  handlePay(data, settleDetailData) {
    const {
      channel,
      payInfo,
      tradeNo,
      outTradeNo,
      out_trade_no,
      orderNo,
      orderId,
      paymentAmount,
      interactId,
      transactionId,
    } = data;
    const { totalAmount, totalPayAmount } = settleDetailData;
    const goodsOrderNo = outTradeNo || out_trade_no || tradeNo || orderNo;
    const payOrderInfo = {
      payInfo: payInfo,
      orderId: orderId,
      orderAmt: totalAmount,
      payAmt: paymentAmount || totalPayAmount,
      interactId: interactId,
      tradeNo: goodsOrderNo,
      orderNo: goodsOrderNo,
      outTradeNo: goodsOrderNo,
      out_trade_no: goodsOrderNo,
      transactionId: transactionId,
      context: this,
      dialogOnCancel: true,
    };

    if (channel === 'wechat') {
      wechatPayOrder(payOrderInfo).catch(() => {});
    }
  },

  hide() {
    // 隐藏 popup
    this.setData({
      'settleDetailData.abnormalDeliveryGoodsList': [],
    });
  },
  onReceipt() {
    // 跳转 开发票
    const invoiceData = this.invoiceData || {};
    wx.navigateTo({
      url: `/pages/order/receipt/index?invoiceData=${JSON.stringify(invoiceData)}`,
    });
  },

  onCoupons(e) {
    const { submitCouponList, currentStoreId } = this.data;
    const { goodsRequestList } = this;
    const { selectedList } = e.detail;
    const tempSubmitCouponList = submitCouponList.map((storeCoupon) => {
      return {
        couponList: storeCoupon.storeId === currentStoreId ? selectedList : storeCoupon.couponList,
      };
    });
    const resSubmitCouponList = this.handleCouponList(tempSubmitCouponList);
    //确定选择优惠券
    this.handleOptionsParams({ goodsRequestList }, resSubmitCouponList);
    this.setData({ couponsShow: false });
  },
  onOpenCoupons(e) {
    const { storeid } = e.currentTarget.dataset;
    this.setData({
      couponsShow: true,
      currentStoreId: storeid,
    });
  },

  handleCouponList(storeCouponList) {
    //处理门店优惠券   转换成接口需要
    if (!storeCouponList) return [];
    const resSubmitCouponList = [];
    storeCouponList.forEach((ele) => {
      resSubmitCouponList.push(...ele.couponList);
    });
    return resSubmitCouponList;
  },

  onGoodsNumChange(e) {
    const {
      detail: { value },
      currentTarget: {
        dataset: { goods },
      },
    } = e;
    const index = this.goodsRequestList.findIndex(
      ({ storeId, spuId, skuId }) => goods.storeId === storeId && goods.spuId === spuId && goods.skuId === skuId,
    );
    if (index >= 0) {
      // eslint-disable-next-line no-confusing-arrow
      const goodsRequestList = this.goodsRequestList.map((item, i) =>
        i === index ? { ...item, quantity: value } : item,
      );
      this.handleOptionsParams({ goodsRequestList });
    }
  },

  onPopupChange() {
    this.setData({
      popupShow: !this.data.popupShow,
    });
  },
});
