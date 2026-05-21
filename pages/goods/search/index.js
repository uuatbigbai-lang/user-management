import {
  getSearchHistory,
  getSearchPopular,
} from '../../../services/good/fetchSearchHistory';
import Toast from 'tdesign-miniprogram/toast/index';
import { requestBackend } from '../../../config/index';
import { resolveProductsImageUrls } from '../../../utils/cloudImage';

const SEARCH_HISTORY_KEY = 'goods_search_history';
const DEFAULT_POPULAR_WORDS = ['益生菌', '成人款', '肠道', '乳酸菌', '微生态', '清畅'];
const MAX_HISTORY_COUNT = 12;

Page({
  data: {
    historyWords: [],
    popularWords: [],
    searchValue: '',
    goodsList: [],
    loading: false,
    hasSearched: false,
    dialog: {
      title: '确认删除当前历史记录',
      showCancelButton: true,
      message: '',
    },
    dialogShow: false,
  },

  deleteType: 0,
  deleteIndex: '',
  searchTimer: null,

  onShow() {
    this.queryHistory();
    this.queryPopular();
  },

  queryHistory() {
    try {
      const historyWords = wx.getStorageSync(SEARCH_HISTORY_KEY) || [];
      this.setData({ historyWords: Array.isArray(historyWords) ? historyWords : [] });
    } catch (error) {
      console.error(error);
    }
  },

  async queryPopular() {
    try {
      const data = await getSearchPopular();
      const code = 'Success';
      if (String(code).toUpperCase() === 'SUCCESS') {
        const { popularWords = DEFAULT_POPULAR_WORDS } = data && typeof data === 'object' ? data : {};
        this.setData({
          popularWords: popularWords.length ? popularWords : DEFAULT_POPULAR_WORDS,
        });
      }
    } catch (error) {
      console.error(error);
      this.setData({ popularWords: DEFAULT_POPULAR_WORDS });
    }
  },

  saveHistory(keyword) {
    const value = String(keyword || '').trim();
    if (!value) return;

    const historyWords = [value]
      .concat(this.data.historyWords.filter((word) => word !== value))
      .slice(0, MAX_HISTORY_COUNT);

    wx.setStorageSync(SEARCH_HISTORY_KEY, historyWords);
    this.setData({ historyWords });
  },

  confirm() {
    const { historyWords } = this.data;
    const { deleteType, deleteIndex } = this;
    historyWords.splice(deleteIndex, 1);
    if (deleteType === 0) {
      wx.setStorageSync(SEARCH_HISTORY_KEY, historyWords);
      this.setData({
        historyWords,
        dialogShow: false,
      });
    } else {
      wx.removeStorageSync(SEARCH_HISTORY_KEY);
      this.setData({ historyWords: [], dialogShow: false });
    }
  },

  close() {
    this.setData({ dialogShow: false });
  },

  handleClearHistory() {
    const { dialog } = this.data;
    this.deleteType = 1;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除所有历史记录',
      },
      dialogShow: true,
    });
  },

  deleteCurr(e) {
    const { index } = e.currentTarget.dataset;
    const { dialog } = this.data;
    this.deleteIndex = index;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除当前历史记录',
        deleteType: 0,
      },
      dialogShow: true,
    });
  },

  handleHistoryTap(e) {
    const { historyWords } = this.data;
    const { dataset } = e.currentTarget;
    const _searchValue = historyWords[dataset.index || 0] || '';
    if (_searchValue) {
      this.setData({ searchValue: _searchValue }, () => {
        this.searchProducts();
      });
    }
  },

  handlePopularTap(e) {
    const { popularWords } = this.data;
    const { dataset } = e.currentTarget;
    const value = popularWords[dataset.index || 0] || '';
    if (value) {
      this.setData({ searchValue: value }, () => {
        this.searchProducts();
      });
    }
  },

  handleInput(e) {
    const value = e.detail.value ?? e.detail ?? '';
    this.setData({ searchValue: value });
    clearTimeout(this.searchTimer);

    if (!String(value).trim()) {
      this.setData({ goodsList: [], loading: false, hasSearched: false });
      return;
    }

    this.searchTimer = setTimeout(() => {
      this.searchProducts();
    }, 300);
  },

  handleSubmit(e) {
    const value = e.detail.value?.value ?? e.detail.value ?? '';
    if (value.length === 0) {
      this.setData({ goodsList: [], loading: false, hasSearched: false });
      return;
    }
    this.setData({ searchValue: value }, () => {
      this.searchProducts();
    });
  },

  searchProducts() {
    const keyword = String(this.data.searchValue || '').trim();
    if (!keyword) {
      this.setData({ goodsList: [], loading: false, hasSearched: false });
      return;
    }

    this.saveHistory(keyword);
    this.setData({ loading: true, hasSearched: true });
    requestBackend({ path: `/api/products?keyword=${encodeURIComponent(keyword)}` }).then(async (res) => {
      if (res.data.code !== 0) {
        throw new Error(res.data.message || '搜索失败');
      }

      const goodsList = await resolveProductsImageUrls(res.data.data || []);
      this.setData({ goodsList, loading: false });
    }).catch((err) => {
      console.error('搜索商品失败:', err);
      Toast({ context: this, selector: '#t-toast', message: '搜索失败，请稍后重试' });
      this.setData({ goodsList: [], loading: false, hasSearched: true });
    });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },
});
