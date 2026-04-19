// pages/signInSuccess/signInSuccess.js
Page({

  /**
   * Page initial data
   */
  data: {
    pageConfig: null,
    signInData: null,
    loading: true,
    showAnimation: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    // 获取传递的签到数据
    const signInData = options.signInData ? JSON.parse(decodeURIComponent(options.signInData)) : null;
    
    this.setData({
      signInData: signInData
    });

    // 加载页面配置
    this.loadPageConfig();
  },

  /**
   * 加载页面配置
   */
  async loadPageConfig() {
    try {
      const result = await this.getSignInConfig();
      
      if (result.code === 0) {
        this.setData({
          pageConfig: result.data,
          loading: false
        });
        
        // 延迟显示动画效果
        setTimeout(() => {
          this.setData({
            showAnimation: true
          });
        }, 300);
        
        console.log('页面配置加载成功:', result.data);
      } else {
        throw new Error(result.message || '配置加载失败');
      }
      
    } catch (error) {
      console.error('加载页面配置失败:', error);
      this.setData({
        loading: false,
        showAnimation: true
      });
    }
  },

  /**
   * 获取签到配置
   */
  getSignInConfig() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'signinConfig',
        data: {
          action: 'getConfig'
        },
        success: (res) => {
          console.log('配置云函数调用成功:', res);
          resolve(res.result);
        },
        fail: (error) => {
          console.error('配置云函数调用失败:', error);
          reject(new Error('网络连接失败，请检查网络后重试'));
        }
      });
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    const config = this.data.pageConfig;
    const successMessage = config?.messages?.success || '签到成功！';
    
    return {
      title: `我刚刚完成了${config?.pageInfo?.title || '签到'}！`,
      desc: successMessage,
      path: '/pages/signIn/signIn'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const config = this.data.pageConfig;
    
    return {
      title: `完成${config?.pageInfo?.title || '签到'}`,
      query: 'from=timeline'
    };
  }
})