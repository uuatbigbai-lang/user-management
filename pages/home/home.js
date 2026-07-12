import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../config/index';
import { addToCart } from '../../services/cart/cart';
import { resolveCloudFileLocalPaths, resolveCloudFileUrls, resolveProductsImageUrls } from '../../utils/cloudImage';

const app = getApp();

const HOME_ASSET_DEFAULTS = {
  logo: { text: '🌱', src: '' },
  fullLogo: { text: '', src: '' },
  aboutDescription: {
    text: '蓝点荟定位为「检测 + 干预」闭环肠道微生态健康管理平台。我们希望每一次益生菌干预都不再是随便试试，而是从肠道菌群检测、报告解读到个性化方案推荐，帮你建立自己的肠道健康标准。',
    src: '',
  },
  icon1: { text: '🌿', src: '' },
  icon2: { text: '🔬', src: '' },
  icon3: { text: '💚', src: '' },
  icon4: { text: '📖', src: '' },
  nutritionPlaceholder: { text: '', src: '' },
};

Page({
  data: {
    pageLoading: true,
    products: [],
    bannerList: [],
    bannerProducts: [],
    bannerNavigation: { type: 'dots-bar' },
    featureLinks: [
      { label: '菌群检测', assetKey: 'icon1', url: '/pages/products/index?category=testkit', openType: 'navigate' },
      { label: '报告样例', assetKey: 'icon2', url: '/pages/report-preview/index', openType: 'navigate' },
      { label: '精准干预', assetKey: 'icon3', url: '/pages/products/index?category=probiotic', openType: 'navigate' },
      { label: '健康课堂', assetKey: 'icon4', action: 'nutrition' },
    ],
    homeAssets: HOME_ASSET_DEFAULTS,
    statusBarHeight: 0,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.setStatusBarHeight();
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.setData({ pageLoading: true });
    Promise.all([
      this.fetchHomeAssets(),
      this.fetchBanners(),
      this.fetchProducts(),
    ]).finally(() => {
      this.setData({ pageLoading: false });
      wx.stopPullDownRefresh();
    });
  },

  setStatusBarHeight() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: windowInfo.statusBarHeight || 0 });
  },

  fetchBanners() {
    return requestBackend({ path: '/api/home/banners' }).then(async (res) => {
      if (res.data.code !== 0) {
        console.warn('获取首页 Banner 失败:', res.data.message);
        this.setData({ bannerList: [], bannerProducts: [] });
        return;
      }

      const banners = Array.isArray(res.data.data) ? res.data.data : [];
      const urlMap = await resolveCloudFileUrls(banners.map((item) => item.imageUrl));
      const resolvedBanners = banners.map((item) => ({
        ...item,
        imageUrl: urlMap[item.imageUrl] || item.imageUrl,
      }));
      this.setData({
        bannerList: resolvedBanners.map((item) => item.imageUrl).filter(Boolean),
        bannerProducts: resolvedBanners,
      });
    }).catch((err) => {
      console.warn('首页 Banner 请求失败:', err);
      this.setData({ bannerList: [], bannerProducts: [] });
    });
  },

  // 获取首页图片资产配置，失败时使用本地默认值
  fetchHomeAssets() {
    return requestBackend({ path: '/api/home/assets' }).then(async (res) => {
      if (res.data.code !== 0) {
        console.warn('获取首页资产失败:', res.data.message);
        return;
      }

      const assetMap = res.data.data?.assetMap || {};
      const assetUrls = Object.keys(HOME_ASSET_DEFAULTS).map((key) => assetMap[key]?.url).filter(Boolean);
      const localPathMap = await resolveCloudFileLocalPaths(assetUrls);
      const tempUrlMap = await resolveCloudFileUrls(assetUrls);
      const homeAssets = Object.keys(HOME_ASSET_DEFAULTS).reduce((result, key) => {
        const assetUrl = assetMap[key]?.url || '';
        result[key] = {
          ...HOME_ASSET_DEFAULTS[key],
          text: assetMap[key]?.content || HOME_ASSET_DEFAULTS[key].text || '',
          src: localPathMap[assetUrl] || tempUrlMap[assetUrl] || assetUrl,
        };
        return result;
      }, {});

      const featureLinks = this.data.featureLinks.map((item) => ({
        ...item,
        iconSrc: homeAssets[item.assetKey]?.src || '',
      }));

      this.setData({ homeAssets, featureLinks });
      console.log('[home] 首页资产:', homeAssets);
    }).catch((err) => {
      console.warn('首页资产请求失败，使用默认 icon:', err);
    });
  },

  onLogoImageLoad(e) {
    console.log('[home] logo 加载成功:', this.data.homeAssets.logo.src, e.detail);
  },

  onLogoImageError(e) {
    console.error('[home] logo 加载失败:', this.data.homeAssets.logo.src, e.detail);
  },

  // 从后端获取商品列表（自动识别本地/云托管）
  fetchProducts() {
    return requestBackend({ path: '/api/products' }).then(async (res) => {
      console.log('[home] /api/products 原始返回:', res);
      if (res.data.code === 0) {
        const products = await resolveProductsImageUrls(res.data.data);
        console.log('[home] 即将 setData 的 products:', products);
        this.setData({ products });
      } else {
        console.error('获取商品失败:', res.data.message);
        Toast({ context: this, selector: '#t-toast', message: '加载商品失败' });
      }
    }).catch((err) => {
      console.error('请求失败:', err);
      Toast({ context: this, selector: '#t-toast', message: '网络错误，请重试' });
    });
  },

  onBannerTap(e) {
    const { index } = e.detail || {};
    const item = this.data.bannerProducts[index];
    if (!item) return;

    if (item.linkType === 'product' && item.linkValue) {
      wx.navigateTo({ url: `/pages/goods/details/index?spuId=${item.linkValue}` });
    } else if (item.linkType === 'page' && item.linkValue) {
      wx.navigateTo({ url: item.linkValue });
    }
  },

  // 跳转到商品详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },

  async handleAddCart(e) {
    const { index } = e.currentTarget.dataset;
    const product = this.data.products[index];
    if (!product) return;

    wx.showLoading({ title: '加车中', mask: true });
    try {
      const result = await addToCart({
        spuId: product.spuId,
        skuId: '',
        title: product.title,
        thumb: product.thumb || product.primaryImage,
        price: Math.round(Number(product.price || 0) * 100),
        originPrice: product.originalPrice ? Math.round(Number(product.originalPrice) * 100) : null,
        quantity: 1,
        specs: '',
        stockQuantity: product.spuStockQuantity || 999,
      });
      wx.hideLoading();
      if (result.data.code === 0) {
        const nextCount = (app.getCartBadgeCount ? app.getCartBadgeCount() : 0) + 1;
        if (app.setCartBadgeCount) {
          app.setCartBadgeCount(nextCount);
        }
        const tabBar = this.getTabBar && this.getTabBar();
        if (tabBar && tabBar.init) {
          tabBar.init();
        }
      }
      Toast({
        context: this,
        selector: '#t-toast',
        message: result.data.code === 0 ? '加车成功' : (result.data.message || '加车失败'),
      });
    } catch (err) {
      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: '加车失败' });
    }
  },

  navToAbout() {
    wx.navigateTo({
      url: '/pages/about/index',
    });
  },

  navToNutrition() {
    wx.navigateTo({
      url: '/pages/nutrition/index',
    });
  },

  navToSearch() {
    wx.navigateTo({
      url: '/pages/goods/search/index',
    });
  },

  navToProducts() {
    wx.navigateTo({
      url: '/pages/products/index',
    });
  },

  onFeatureTap(e) {
    const { action, url, openType } = e.currentTarget.dataset;
    if (action === 'nutrition') {
      this.navToNutrition();
      return;
    }

    if (!url) return;

    if (openType === 'switchTab') {
      wx.switchTab({ url });
      return;
    }

    wx.navigateTo({ url });
  },
});
