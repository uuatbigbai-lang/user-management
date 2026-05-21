import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../../config/index';
import { resolveProductsImageUrls } from '../../../utils/cloudImage';

Page({
  data: {
    keywords: '',
    goodsList: [],
    loading: true,
    hasLoaded: false,
  },

  searchTimer: null,

  onLoad(options) {
    const { searchValue = '' } = options || {};
    this.setData({ keywords: decodeURIComponent(searchValue) });
    this.searchProducts();
  },

  searchProducts() {
    const keyword = String(this.data.keywords || '').trim();
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    this.setData({ loading: true });
    requestBackend({ path: `/api/products${query}` }).then(async (res) => {
      if (res.data.code !== 0) {
        throw new Error(res.data.message || '商品加载失败');
      }

      const products = await resolveProductsImageUrls(res.data.data || []);
      this.setData({ goodsList: products, loading: false, hasLoaded: true });
    }).catch((err) => {
      console.error('搜索商品失败:', err);
      Toast({ context: this, selector: '#t-toast', message: '搜索失败，请稍后重试' });
      this.setData({ loading: false, hasLoaded: true, goodsList: [] });
    });
  },

  handleInput(e) {
    const value = e.detail.value ?? e.detail ?? '';
    this.setData({ keywords: value });
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchProducts();
    }, 300);
  },

  handleSubmit(e) {
    const value = e.detail.value?.value ?? e.detail.value ?? this.data.keywords;
    this.setData({ keywords: value }, () => {
      this.searchProducts();
    });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },
});
