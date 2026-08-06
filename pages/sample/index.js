import { fetchSamples } from '../../services/sample/index';

Page({
  data: {
    activeTab: 0,
    filterTabs: ['全部', '肠道菌群检测', '阴道菌群检测', '肠道炎症检测'],
    actionItems: [
      { label: '肠道菌群检测', value: 'gut' },
      { label: '阴道菌群检测', value: 'vaginal' },
      { label: '肠道炎症检测', value: 'inflammation' },
    ],
    sampleVideoVisible: false,
    bindSampleVisible: false,
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    loadingMore: false,
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.init) {
      tabBar.init();
    }
  },

  onLoad() {
    this.fetchList(true);
  },

  onTabChange(event) {
    this.setData({
      activeTab: event.detail.value,
      page: 1,
      hasMore: true,
      list: [],
    });
    this.fetchList(true);
  },

  onOpenSampleVideo() {
    this.setData({
      sampleVideoVisible: true,
    });
  },

  onOpenBindSample() {
    this.setData({
      bindSampleVisible: true,
    });
  },

  onSampleVideoVisibleChange(event) {
    this.setData({
      sampleVideoVisible: event.detail.visible,
    });
  },

  onBindSampleVisibleChange(event) {
    this.setData({
      bindSampleVisible: event.detail.visible,
    });
  },

  onSampleVideoSelect(event) {
    const selected = event.detail?.selected || {};
    const type = selected.value || '';
    const fileMap = {
      gut: 'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple1.mp4',
      vaginal:
        'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple2.mp4',
      inflammation:
        'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple3.mp4',
    };
    const fileID = fileMap[type] || fileMap.gut;
    this.setData({
      sampleVideoVisible: false,
    });
    wx.showLoading({ title: '加载中', mask: true });
    wx.cloud
      .downloadFile({
        fileID,
      })
      .then((res) => {
        const tempFilePath = res?.tempFilePath || '';
        if (!tempFilePath) {
          wx.showToast({
            title: '视频地址获取失败',
            icon: 'none',
          });
          return;
        }
        wx.previewMedia({
          sources: [
            {
              url: tempFilePath,
              type: 'video',
            },
          ],
        });
      })
      .catch(() => {
        wx.showToast({
          title: '视频加载失败',
          icon: 'none',
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onBindSampleSelect(event) {
    const selected = event.detail?.selected || {};
    const title = selected.label || selected;
    const type = selected.value || '';
    this.setData({
      bindSampleVisible: false,
    });
    wx.navigateTo({
      url: `/packages/content/sample-register/index?title=${encodeURIComponent(
        title,
      )}&type=${type}`,
    });
  },

  async fetchList(reset = false) {
    if (this.data.loading || this.data.loadingMore) {
      return;
    }
    const nextPage = reset ? 1 : this.data.page;
    this.setData({
      loading: reset,
      loadingMore: !reset,
    });
    try {
      const typeMap = ['', 'gut', 'vaginal', 'inflammation'];
      const type = typeMap[this.data.activeTab] || '';
      const result = await fetchSamples({
        page: nextPage,
        pageSize: this.data.pageSize,
        type,
      });
      const newList = result.data || [];
      const merged = reset ? newList : this.data.list.concat(newList);
      const hasMore = merged.length < (result.total || 0);
      this.setData({
        list: merged,
        page: nextPage + 1,
        hasMore,
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      wx.stopPullDownRefresh();
      this.setData({
        loading: false,
        loadingMore: false,
      });
    }
  },

  onReachBottom() {
    if (!this.data.hasMore) {
      return;
    }
    this.fetchList(false);
  },

  onPullDownRefresh() {
    this.fetchList(true);
  },

  onItemTap(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: `/packages/content/sample-register/index?id=${id}`,
    });
  },
});
