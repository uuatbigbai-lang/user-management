import Toast from 'tdesign-miniprogram/toast/index';
import { backendConfig, requestBackend } from '../../config/index';
import { resolveProductsImageUrls } from '../../utils/cloudImage';

const HOME_ASSET_DEFAULTS = {
  logo: { text: '🌱', src: '' },
  philosophyNatural: { text: '🌿', src: '' },
  philosophyScience: { text: '🔬', src: '' },
  philosophyQuality: { text: '💚', src: '' },
  nutritionEntry: { text: '📖', src: '' },
};

const getBackendPublicBase = () => {
  if (backendConfig.useLocal) return backendConfig.localBase;
  return backendConfig.publicBase || '';
};

const buildHomeAssetSrc = (asset) => {
  if (!asset) return '';
  if (asset.url) return asset.url;
  if (!asset.imagePath) return '';
  const version = asset.updatedAt ? `?v=${encodeURIComponent(new Date(asset.updatedAt).getTime())}` : '';
  if (/^https?:\/\//.test(asset.imagePath)) return `${asset.imagePath}${version}`;
  const base = getBackendPublicBase().replace(/\/$/, '');
  return base ? `${base}${asset.imagePath}${version}` : '';
};

Page({
  data: {
    pageLoading: true,
    products: [],
    homeAssets: HOME_ASSET_DEFAULTS,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.setData({ pageLoading: true });
    Promise.all([
      this.fetchHomeAssets(),
      this.fetchProducts(),
    ]).finally(() => {
      this.setData({ pageLoading: false });
      wx.stopPullDownRefresh();
    });
  },

  // 获取首页 logo/icon 配置，失败时使用本地默认 emoji
  fetchHomeAssets() {
    return requestBackend({ path: '/api/home/assets' }).then((res) => {
      if (res.data.code !== 0) {
        console.warn('获取首页资产失败:', res.data.message);
        return;
      }

      const assetMap = res.data.data?.assetMap || {};
      const homeAssets = Object.keys(HOME_ASSET_DEFAULTS).reduce((result, key) => {
        result[key] = {
          ...HOME_ASSET_DEFAULTS[key],
          src: buildHomeAssetSrc(assetMap[key]),
        };
        return result;
      }, {});

      this.setData({ homeAssets });
    }).catch((err) => {
      console.warn('首页资产请求失败，使用默认 icon:', err);
    });
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

  // 跳转到商品详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
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
});
