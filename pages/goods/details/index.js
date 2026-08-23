import Toast from 'tdesign-miniprogram/toast/index';
import { fetchGood } from '../../../services/good/fetchGood';
import { fetchActivityList } from '../../../services/activity/fetchActivityList';
import {
  getGoodsDetailsCommentList,
  getGoodsDetailsCommentsCount,
} from '../../../services/good/fetchGoodsDetailsComments';

import { cdnBase } from '../../../config/index';
import { addToCart } from '../../../services/cart/cart';
import { bindSalesRelationship } from '../../../services/usercenter/salesBinding';

const imgPrefix = `${cdnBase}/`;

const recLeftImg = `${imgPrefix}common/rec-left.png`;
const recRightImg = `${imgPrefix}common/rec-right.png`;
const obj2Params = (obj = {}, encode = false) => {
  const result = [];
  Object.keys(obj).forEach((key) => result.push(`${key}=${encode ? encodeURIComponent(obj[key]) : obj[key]}`));

  return result.join('&');
};

Page({
  data: {
    commentsList: [],
    commentsStatistics: {
      badCount: 0,
      commentCount: 0,
      goodCount: 0,
      goodRate: 0,
      hasImageCount: 0,
      middleCount: 0,
    },
    isShowPromotionPop: false,
    activityList: [],
    recLeftImg,
    recRightImg,
    details: {},
    goodsTabArray: [
      {
        name: '商品',
        value: '', // 空字符串代表置顶
      },
      {
        name: '详情',
        value: 'goods-page',
      },
    ],
    storeLogo: `${imgPrefix}common/store-logo.png`,
    storeName: '云mall标准版旗舰店',
    jumpArray: [
      {
        title: '首页',
        url: '/pages/home/home',
        iconName: 'home',
      },
      {
        title: '购物车',
        url: '/pages/cart/index',
        iconName: 'cart',
        showCartNum: true,
      },
    ],
    isStock: true,
    cartNum: 0,
    soldout: false,
    buttonType: 1,
    buyNum: 1,
    selectedAttrStr: '',
    skuArray: [],
    primaryImage: '',
    specImg: '',
    isSpuSelectPopupShow: false,
    isAllSelectedSku: false,
    buyType: 0,
    outOperateStatus: false, // 是否外层加入购物车
    operateType: 0,
    selectSkuSellsPrice: 0,
    selectSkuLinePrice: 0,
    maxLinePrice: 0,
    minSalePrice: 0,
    maxSalePrice: 0,
    list: [],
    spuId: '',
    navigation: { type: 'fraction' },
    bannerImageProps: { mode: 'aspectFit' },
    current: 0,
    autoplay: true,
    duration: 500,
    interval: 5000,
    soldNum: 0, // 已售数量
    isEmployee: false,
    showEmployeeSpecialOffer: false,
    employeeSpecialOfferText: '',
  },

  handlePopupHide() {
    this.setData({
      isSpuSelectPopupShow: false,
    });
  },

  showSkuSelectPopup(type) {
    const actionType = typeof type === 'number' ? type : 0;
    if (!this.hasSelectableSku()) {
      if (actionType === 1) {
        this.gotoBuy(1);
      } else if (actionType === 2) {
        this.addCart();
      }
      return;
    }
    this.setData({
      buyType: actionType,
      outOperateStatus: actionType >= 1,
      isSpuSelectPopupShow: true,
    });
  },

  buyItNow() {
    this.showSkuSelectPopup(1);
  },

  toAddCart() {
    this.showSkuSelectPopup(2);
  },

  toNav(e) {
    const { url } = e.detail;
    wx.switchTab({
      url: url,
    });
  },

  showCurImg(e) {
    const { index } = e.detail;
    const { images } = this.data.details;
    wx.previewImage({
      current: images[index],
      urls: images, // 需要预览的图片http链接列表
    });
  },

  onPageScroll({ scrollTop }) {
    const goodsTab = this.selectComponent('#goodsTab');
    goodsTab && goodsTab.onScroll(scrollTop);
  },

  chooseSpecItem(e) {
    const { specList } = this.data.details;
    const { selectedSku, isAllSelectedSku } = e.detail;
    if (!isAllSelectedSku) {
      this.setData({
        selectSkuSellsPrice: 0,
        selectSkuLinePrice: 0,
      });
    }
    this.setData({
      isAllSelectedSku,
    });
    this.getSkuItem(specList, selectedSku);
  },

  getSkuItem(specList, selectedSku) {
    const { skuArray, primaryImage } = this.data;
    const selectedSkuValues = this.getSelectedSkuValues(specList, selectedSku);
    let selectedAttrStr = ` 件  `;
    selectedSkuValues.forEach((item) => {
      selectedAttrStr += `，${item.specValue}  `;
    });
    // eslint-disable-next-line array-callback-return
    const skuItem = skuArray.filter((item) => {
      let status = true;
      (item.specInfo || []).forEach((subItem) => {
        if (!selectedSku[subItem.specId] || selectedSku[subItem.specId] !== subItem.specValueId) {
          status = false;
        }
      });
      if (status) return item;
    })[0] || null;
    this.selectSpecsName(selectedSkuValues.length > 0 ? selectedAttrStr : '');
    if (skuItem) {
      this.setData({
        selectItem: skuItem,
        selectSkuSellsPrice: skuItem.price || 0,
        selectSkuLinePrice: skuItem.linePrice || 0,
      });
    } else {
      this.setData({
        selectItem: null,
        selectSkuSellsPrice: 0,
        selectSkuLinePrice: 0,
      });
    }
    this.setData({
      specImg: skuItem && skuItem.skuImage ? skuItem.skuImage : primaryImage,
    });
  },

  // 获取已选择的sku名称
  getSelectedSkuValues(skuTree, selectedSku) {
    const normalizedTree = this.normalizeSkuTree(skuTree);
    return Object.keys(selectedSku).reduce((selectedValues, skuKeyStr) => {
      const skuValues = normalizedTree[skuKeyStr];
      const skuValueId = selectedSku[skuKeyStr];
      if (skuValueId !== '') {
        const skuValue = skuValues.filter((value) => {
          return value.specValueId === skuValueId;
        })[0];
        skuValue && selectedValues.push(skuValue);
      }
      return selectedValues;
    }, []);
  },

  normalizeSkuTree(skuTree) {
    const normalizedTree = {};
    skuTree.forEach((treeItem) => {
      normalizedTree[treeItem.specId] = treeItem.specValueList;
    });
    return normalizedTree;
  },

  selectSpecsName(selectSpecsName) {
    if (selectSpecsName) {
      this.setData({
        selectedAttrStr: selectSpecsName,
      });
    } else {
      this.setData({
        selectedAttrStr: '',
      });
    }
  },

  hasSelectableSku() {
    const { details = {}, skuArray = [] } = this.data;
    const specList = Array.isArray(details.specList) ? details.specList : [];
    const hasSpecValues = specList.some((item) => Array.isArray(item.specValueList) && item.specValueList.length > 0);
    return hasSpecValues && skuArray.length > 1;
  },

  getEffectiveSelectedSku({ preferFirstSku = false } = {}) {
    const { skuArray = [], selectItem } = this.data;
    if (preferFirstSku) {
      return selectItem || skuArray[0] || null;
    }
    return selectItem || skuArray[0] || null;
  },

  applySingleSkuDefaults(nextState = {}) {
    const details = nextState.details || this.data.details;
    const skuArray = nextState.skuArray || this.data.skuArray;
    const primaryImage = nextState.primaryImage || this.data.primaryImage;
    const specList = Array.isArray(details.specList) ? details.specList : [];
    const hasSelectableSpecs = specList.some((item) => Array.isArray(item.specValueList) && item.specValueList.length > 0);
    if (hasSelectableSpecs && skuArray.length > 1) return;
    const defaultSku = skuArray[0] || this.getEffectiveSelectedSku();
    if (!defaultSku) return;
    this.setData({
      isAllSelectedSku: true,
      selectItem: defaultSku,
      selectSkuSellsPrice: defaultSku.price || 0,
      selectSkuLinePrice: defaultSku.linePrice || 0,
      specImg: defaultSku.skuImage || primaryImage,
    });
  },

  getResolvedSkuSpecInfo(selectedSku) {
    const { details = {} } = this.data;
    const specList = Array.isArray(details.specList) ? details.specList : [];
    const skuSpecInfo = Array.isArray(selectedSku?.specInfo) ? selectedSku.specInfo : [];

    return skuSpecInfo.map((item) => {
      const spec = specList.find((specItem) => specItem.specId === item.specId) || {};
      const specValueList = Array.isArray(spec.specValueList) ? spec.specValueList : [];
      const specValue = specValueList.find((valueItem) => valueItem.specValueId === item.specValueId) || {};
      return {
        ...item,
        specTitle: item.specTitle || spec.title || '',
        specValue: item.specValue || specValue.specValue || '',
      };
    });
  },

  async addCart() {
    const { isAllSelectedSku, buyNum, selectItem, details } = this.data;
    const shouldForceSkuSelection = this.hasSelectableSku();
    if (shouldForceSkuSelection && !isAllSelectedSku) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        icon: '',
        duration: 1000,
      });
      return;
    }
    const selectedSku = selectItem || this.getEffectiveSelectedSku();
    const specInfo = this.getResolvedSkuSpecInfo(selectedSku);
    const skuPrice = selectedSku ? (selectedSku.price || details.minSalePrice) : details.minSalePrice;
    const skuImage = selectedSku ? (selectedSku.skuImage || details.primaryImage) : details.primaryImage;
    const specsStr = specInfo.map((item) => item.specValue).filter(Boolean).join('+');

    wx.showLoading({ title: '加车中', mask: true });
    try {
      const result = await addToCart({
        spuId: details.spuId,
        skuId: selectedSku ? selectedSku.skuId : '',
        title: details.title,
        thumb: skuImage,
        price: skuPrice,
        originPrice: details.maxLinePrice || null,
        quantity: buyNum,
        specs: specsStr,
        stockQuantity: details.spuStockQuantity || 999,
      });
      wx.hideLoading();
      if (result.data.code === 0) {
        Toast({ context: this, selector: '#t-toast', message: '加车成功' });
        this.handlePopupHide();
      } else {
        Toast({ context: this, selector: '#t-toast', message: result.data.message || '加车失败' });
      }
    } catch (err) {
      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: '加车失败' });
    }
  },

  gotoBuy(type) {
    const { isAllSelectedSku, buyNum } = this.data;
    const shouldForceSkuSelection = this.hasSelectableSku();
    if (shouldForceSkuSelection && !isAllSelectedSku) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        icon: '',
        duration: 1000,
      });
      return;
    }
    this.handlePopupHide();
    // 获取选中 SKU 的真实价格
    const selectedSku = this.getEffectiveSelectedSku({ preferFirstSku: type === 1 });
    const specInfo = this.getResolvedSkuSpecInfo(selectedSku);
    const skuPrice = selectedSku ? (selectedSku.price || this.data.details.minSalePrice) : this.data.details.minSalePrice;
    const skuImage = selectedSku ? (selectedSku.skuImage || this.data.details.primaryImage) : this.data.details.primaryImage;
    const query = {
      quantity: buyNum,
      storeId: '1',
      spuId: this.data.details.spuId,
      goodsName: this.data.details.title,
      skuId: selectedSku ? selectedSku.skuId : '',
      available: this.data.details.available,
      price: skuPrice,
      specInfo,
      primaryImage: this.data.details.primaryImage,
      thumb: skuImage,
      title: this.data.details.title,
    };
    
    const app = getApp();
    app.globalData.temp = query;
    
    // let urlQueryStr = obj2Params({
    //   goodsRequestList: JSON.stringify([query]),
    // });
    // urlQueryStr = urlQueryStr ? `?${urlQueryStr}` : '';
    const path = `/pages/order/order-confirm/index`;
    wx.navigateTo({
      url: path,
    });
  },

  specsConfirm() {
    const { buyType } = this.data;
    if (buyType === 1) {
      this.gotoBuy();
    } else {
      this.addCart();
    }
    // this.handlePopupHide();
  },

  changeNum(e) {
    this.setData({
      buyNum: e.detail.buyNum,
    });
  },

  closePromotionPopup() {
    this.setData({
      isShowPromotionPop: false,
    });
  },

  promotionChange(e) {
    const { index } = e.detail;
    wx.navigateTo({
      url: `/pages/promotion/promotion-detail/index?promotion_id=${index}`,
    });
  },

  showPromotionPopup() {
    this.setData({
      isShowPromotionPop: true,
    });
  },

  getDetail(spuId) {
    Promise.all([fetchGood(spuId), fetchActivityList()]).then((res) => {
      const [details, activityList] = res;
      const skuArray = [];
      const { skuList, primaryImage, isPutOnSale, minSalePrice, maxSalePrice, maxLinePrice, soldNum } = details;
      skuList.forEach((item) => {
        const salePrice = item.priceInfo ? Number((item.priceInfo.find((price) => Number(price.priceType) === 1) || {}).price || 0) : 0;
        const linePrice = item.priceInfo ? Number((item.priceInfo.find((price) => Number(price.priceType) === 2) || {}).price || 0) : 0;
        skuArray.push({
          skuId: item.skuId,
          quantity: item.stockInfo ? item.stockInfo.stockQuantity : 0,
          specInfo: item.specInfo,
          price: salePrice,
          linePrice,
          skuImage: item.skuImage || '',
        });
      });
      const promotionArray = [];
      activityList.forEach((item) => {
        promotionArray.push({
          tag: item.promotionSubCode === 'MYJ' ? '满减' : '满折',
          label: '满100元减99.9元',
        });
      });
      const nextState = {
        details,
        activityList,
        isStock: details.spuStockQuantity > 0,
        maxSalePrice: maxSalePrice ? parseInt(maxSalePrice) : 0,
        maxLinePrice: maxLinePrice ? parseInt(maxLinePrice) : 0,
        minSalePrice: minSalePrice ? parseInt(minSalePrice) : 0,
        list: promotionArray,
        skuArray: skuArray,
        primaryImage,
        soldout: isPutOnSale === 0,
        soldNum,
        showEmployeeSpecialOffer: this.data.isEmployee && Number(details.employeePrice || 0) > 0,
        employeeSpecialOfferText: Number(details.employeePrice || 0) > 0
          ? `员工特别优惠：员工价 ¥${(Number(details.employeePrice) / 100).toFixed(2)}`
          : '',
      };
      this.setData(nextState);
      this.applySingleSkuDefaults(nextState);
    });
  },

  async loadEmployeeIdentity() {
    const app = getApp();
    try {
      if (app?.silentLogin) await app.silentLogin();
    } catch (err) {
      console.warn('[goods-detail] 获取员工身份失败:', err);
    }
    const userInfo = app?.getUserInfo?.() || wx.getStorageSync('userInfo') || {};
    const isEmployee = !!userInfo.isSales;
    const employeePrice = Number(this.data.details?.employeePrice || 0);
    this.setData({
      isEmployee,
      showEmployeeSpecialOffer: isEmployee && employeePrice > 0,
      employeeSpecialOfferText: employeePrice > 0
        ? `员工特别优惠：员工价 ¥${(employeePrice / 100).toFixed(2)}`
        : '',
    });
  },

  async getCommentsList() {
    try {
      const code = 'Success';
      const data = await getGoodsDetailsCommentList();
      const { homePageComments } = data;
      if (code.toUpperCase() === 'SUCCESS') {
        const nextState = {
          commentsList: homePageComments.map((item) => {
            return {
              goodsSpu: item.spuId,
              userName: item.userName || '',
              commentScore: item.commentScore,
              commentContent: item.commentContent || '用户未填写评价',
              userHeadUrl: item.isAnonymity ? this.anonymityAvatar : item.userHeadUrl || this.anonymityAvatar,
            };
          }),
        };
        this.setData(nextState);
      }
    } catch (error) {
      console.error('comments error:', error);
    }
  },

  onShareAppMessage() {
    // 自定义的返回信息
    const { selectedAttrStr } = this.data;
    let shareSubTitle = '';
    if (selectedAttrStr.indexOf('件') > -1) {
      const count = selectedAttrStr.indexOf('件');
      shareSubTitle = selectedAttrStr.slice(count + 1, selectedAttrStr.length);
    }
    const userInfo = wx.getStorageSync('userInfo') || getApp().globalData?.userInfo || {};
    const salesOpenid = String(userInfo.openid || '').trim();
    const customInfo = {
      imageUrl: this.data.details.primaryImage,
      title: this.data.details.title + shareSubTitle,
      path: `/pages/goods/details/index?spuId=${this.data.spuId}${salesOpenid ? `&salesOpenid=${encodeURIComponent(salesOpenid)}` : ''}`,
    };
    return customInfo;
  },

  onShareTimeline() {
    const userInfo = wx.getStorageSync('userInfo') || getApp().globalData?.userInfo || {};
    const salesOpenid = String(userInfo.openid || '').trim();
    const query = [`spuId=${encodeURIComponent(this.data.spuId || '')}`];
    if (salesOpenid) {
      query.push(`salesOpenid=${encodeURIComponent(salesOpenid)}`);
    }
    return {
      title: this.data.details.title || '商品详情',
      query: query.join('&'),
    };
  },

  async tryBindSalesFromShare(query = {}) {
    const salesOpenid = String(query.salesOpenid || '').trim();
    if (!salesOpenid) return;

    try {
      const app = getApp();
      if (app?.silentLogin) {
        await app.silentLogin();
      }
      const result = await bindSalesRelationship({
        salesOpenid,
        sourcePage: 'goods-detail',
        sourcePath: '/pages/goods/details/index',
        sourceSpuId: query.spuId || this.data.spuId || '',
      });
      console.log('[goods-detail] 销售绑定结果:', result);
    } catch (err) {
      console.warn('[goods-detail] 销售绑定失败:', err);
    }
  },

  /** 获取评价统计 */
  async getCommentsStatistics() {
    try {
      const code = 'Success';
      const data = await getGoodsDetailsCommentsCount();
      if (code.toUpperCase() === 'SUCCESS') {
        const { badCount, commentCount, goodCount, goodRate, hasImageCount, middleCount } = data;
        const nextState = {
          commentsStatistics: {
            badCount: parseInt(`${badCount}`),
            commentCount: parseInt(`${commentCount}`),
            goodCount: parseInt(`${goodCount}`),
            /** 后端返回百分比后数据但没有限制位数 */
            goodRate: Math.floor(goodRate * 10) / 10,
            hasImageCount: parseInt(`${hasImageCount}`),
            middleCount: parseInt(`${middleCount}`),
          },
        };
        this.setData(nextState);
      }
    } catch (error) {
      console.error('comments statiistics error:', error);
    }
  },

  /** 跳转到评价列表 */
  navToCommentsListPage() {
    wx.navigateTo({
      url: `/pages/goods/comments/index?spuId=${this.data.spuId}`,
    });
  },

  onLoad(query) {
    const { spuId } = query;
    this.setData({
      spuId: spuId,
    });
    this.loadEmployeeIdentity();
    this.tryBindSalesFromShare(query);
    this.getDetail(spuId);
    this.getCommentsList(spuId);
    this.getCommentsStatistics(spuId);
  },
});
