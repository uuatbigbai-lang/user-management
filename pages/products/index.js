import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../config/index';
import { resolveProductsImageUrls } from '../../utils/cloudImage';

const TESTKIT_KEYWORDS = ['检测', '检测盒', '采样', '样本', '试剂', '报告'];

const isTestkitProduct = (product) => {
  const text = `${product.title || ''}${product.brief || ''}${product.badge || ''}`;
  return TESTKIT_KEYWORDS.some((keyword) => text.indexOf(keyword) > -1);
};

const buildIntro = (products) => {
  const firstTestkit = products.find(isTestkitProduct);
  const firstProbiotic = products.find((product) => !isTestkitProduct(product));
  const fallback = products[0] || {};
  return {
    testkit: { image: firstTestkit?.thumb || fallback.thumb || '' },
    probiotic: { image: firstProbiotic?.thumb || fallback.thumb || '' },
  };
};

Page({
  data: {
    loading: true,
    activeCategory: 'testkit',
    scrollIntoView: '',
    testkitProducts: [],
    probioticProducts: [],
    categoryIntro: buildIntro([]),
  },

  onLoad(options) {
    this.fetchProducts().then(() => {
      const category = options.category === 'probiotic' ? 'probiotic' : 'testkit';
      this.scrollToCategory(category);
    });
  },

  fetchProducts() {
    this.setData({ loading: true });
    return requestBackend({ path: '/api/products' }).then(async (res) => {
      if (res.data.code !== 0) {
        throw new Error(res.data.message || '商品加载失败');
      }

      const products = await resolveProductsImageUrls(res.data.data || []);
      const testkitProducts = products.filter(isTestkitProduct);
      const probioticProducts = products.filter((product) => !isTestkitProduct(product));
      this.setData({
        testkitProducts,
        probioticProducts,
        categoryIntro: buildIntro(products),
        loading: false,
      });
    }).catch((err) => {
      console.error('产品列表加载失败:', err);
      Toast({ context: this, selector: '#t-toast', message: '产品加载失败，请稍后重试' });
      this.setData({ loading: false });
    });
  },

  handleFilterTap(e) {
    const { target } = e.currentTarget.dataset;
    this.scrollToCategory(target);
  },

  scrollToCategory(category) {
    if (!category) return;
    this.setData({
      activeCategory: category,
      scrollIntoView: `section-${category}`,
    });
  },

  handleScroll() {
    if (this.data.scrollIntoView) {
      this.setData({ scrollIntoView: '' });
    }
  },

  navToSearch() {
    wx.navigateTo({
      url: '/pages/goods/search/index',
    });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },
});
