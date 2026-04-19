import Toast from 'tdesign-miniprogram/toast/index';

// 获取全局 App 实例
const app = getApp();

Page({
  data: {
    listData: [], // 列表数据
    loading: true, // 加载状态
    error: false, // 错误状态
    errorMessage: '', // 错误信息
    refreshing: false, // 下拉刷新状态
    loadingMore: false, // 加载更多状态
    hasMore: true, // 是否还有更多数据
    page: 1, // 当前页码
    pageSize: 20, // 每页数据量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('Template List Page loaded with options:', options);
    this.loadData();

    // 暴露方法用于测试
    if (typeof jest !== 'undefined') {
      this.testExposed = {
        loadData: this.loadData.bind(this),
        refreshData: this.refreshData.bind(this),
        loadMoreData: this.loadMoreData.bind(this)
      };
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Template List Page ready');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时可以刷新数据
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('Pull down refresh triggered');
    this.refreshData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('Reach bottom triggered');
    this.loadMoreData();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '模板列表页面',
      path: '/pages/template-list/index'
    };
  },



  callCloudFunction() {
    return wx.cloud.callFunction({
      name: 'getTemplateList',
      data: {
       'xxx': 'xxx'
      }
    });
  },
  /**
   * 加载数据
   */
  async loadData() {
    try {
      this.setData({
        loading: true,
        error: false
      });

      const result = await this.callCloudFunction();

      if (result.success) {
        console.log('list data', result.data);
        this.setData({
          listData: result.data || [],
          loading: false,
          page: 1,
          hasMore: result.data && result.data.length >= this.data.pageSize
        });
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('Load data error:', error);
      this.setData({
        loading: false,
        error: true,
        errorMessage: error.message || '网络错误，请稍后重试'
      });

      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取数据失败',
        theme: 'error',
      });
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      this.setData({
        refreshing: true,
        error: false
      });

      const result = await this.callCloudFunction();

      if (result.success) {
        this.setData({
          listData: result.data || [],
          refreshing: false,
          page: 1,
          hasMore: result.data && result.data.length >= this.data.pageSize
        });

        Toast({
          context: this,
          selector: '#t-toast',
          message: '刷新成功',
          theme: 'success',
        });
      } else {
        throw new Error(result.message || '刷新失败');
      }
    } catch (error) {
      console.error('Refresh data error:', error);
      this.setData({
        refreshing: false,
        error: true,
        errorMessage: error.message || '网络错误，请稍后重试'
      });

      Toast({
        context: this,
        selector: '#t-toast',
        message: '刷新失败',
        theme: 'error',
      });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 加载更多数据
   */
  async loadMoreData() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return;
    }

    try {
      this.setData({
        loadingMore: true
      });

      const nextPage = this.data.page + 1;
      const result = await this.callCloudFunction(nextPage);

      if (result.success) {
        const newData = result.data || [];
        this.setData({
          listData: [...this.data.listData, ...newData],
          loadingMore: false,
          page: nextPage,
          hasMore: newData.length >= this.data.pageSize
        });
      } else {
        throw new Error(result.message || '加载更多失败');
      }
    } catch (error) {
      console.error('Load more data error:', error);
      this.setData({
        loadingMore: false
      });

      Toast({
        context: this,
        selector: '#t-toast',
        message: '加载更多失败',
        theme: 'error',
      });
    }
  },

  /**
   * 调用云函数获取数据
   */
  async callCloudFunction(page = 1) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getTemplateList',
        data: {
          action: 'list',
          page: page,
          pageSize: this.data.pageSize
        },
        success: (res) => {
          console.log('Cloud function success:', res);
          resolve(res.result);
        },
        fail: (error) => {
          console.error('Cloud function error:', error);
          reject(error);
        }
      });
    });
  },

  /**
   * 列表项点击事件
   */
  onItemClick(event) {
    const { item } = event.currentTarget.dataset;
    console.log('Item clicked:', item);

    if (!item || !item.id) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '无效的项目',
        theme: 'warning',
      });
      return;
    }

    // 跳转到详情页面
    wx.navigateTo({
      url: `/pages/template-detail/index?id=${item.id}`,
      success: () => {
        console.log('Navigate to detail page success');
      },
      fail: (error) => {
        console.error('Navigate to detail page error:', error);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '页面跳转失败',
          theme: 'error',
        });
      }
    });
  },

  /**
   * 重试加载数据
   */
  onRetry() {
    this.loadData();
  }
});