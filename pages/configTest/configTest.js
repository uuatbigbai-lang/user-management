// pages/configTest/configTest.js
Page({

  /**
   * Page initial data
   */
  data: {
    config: null,
    loading: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    this.loadCurrentConfig();
  },

  /**
   * 加载当前配置
   */
  async loadCurrentConfig() {
    try {
      this.setData({ loading: true });
      
      const result = await this.getSignInConfig();
      
      if (result.code === 0) {
        this.setData({
          config: result.data,
          loading: false
        });
      } else {
        throw new Error(result.message || '获取配置失败');
      }
      
    } catch (error) {
      console.error('加载配置失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载配置失败',
        icon: 'error'
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
          resolve(res.result);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * 更新配置
   */
  updateSignInConfig(config) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'signinConfig',
        data: {
          action: 'updateConfig',
          config: config
        },
        success: (res) => {
          resolve(res.result);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * 查看配置详情
   */
  onViewConfig() {
    if (!this.data.config) {
      wx.showToast({
        title: '配置未加载',
        icon: 'error'
      });
      return;
    }
    
    const configStr = JSON.stringify(this.data.config, null, 2);
    
    wx.showModal({
      title: '当前配置详情',
      content: configStr,
      showCancel: false,
      confirmText: '确定'
    });
  },

  /**
   * 跳转到签到页面测试
   */
  onTestSignIn() {
    wx.navigateTo({
      url: '/packages/content/signIn/signIn'
    });
  },

  /**
   * 重置为默认配置
   */
  async onResetConfig() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置为默认配置吗？这将覆盖当前的所有配置设置。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '重置中...'
            });

            // 删除现有配置，让系统重新创建默认配置
            // 这里我们通过更新一个空配置来触发默认配置的创建
            const defaultConfig = {
              pageInfo: {
                title: '每日签到',
                subtitle: '记录美好时光，获取专属奖励',
                description: '请填写您的基本信息完成签到'
              },
              formFields: [
                {
                  key: 'name',
                  label: '姓名',
                  type: 'text',
                  placeholder: '请输入您的姓名',
                  required: true,
                  visible: true,
                  validation: {
                    minLength: 2,
                    maxLength: 20,
                    pattern: '^[\\u4e00-\\u9fa5a-zA-Z\\s]+$',
                    errorMessage: '请输入正确的姓名（2-20个字符，仅支持中文、英文）'
                  },
                  order: 1
                },
                {
                  key: 'phone',
                  label: '手机号',
                  type: 'number',
                  placeholder: '请输入手机号码',
                  required: true,
                  visible: true,
                  validation: {
                    pattern: '^1[3-9]\\d{9}$',
                    errorMessage: '请输入正确的手机号码'
                  },
                  order: 2
                }
              ],
              buttonConfig: {
                submitText: '确认签到',
                submittingText: '签到中...',
                theme: 'primary',
                size: 'large'
              },
              messages: {
                success: '签到成功！',
                duplicateError: '今日已签到，请勿重复签到',
                networkError: '网络连接失败，请检查网络后重试',
                validationError: '请检查输入信息'
              },
              styleConfig: {
                primaryColor: '#007bff',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                showDecorations: true
              },
              features: {
                enableValidation: true,
                enableToast: true,
                enableLoading: true,
                autoReset: true,
                resetDelay: 2000
              }
            };

            // 更新为默认配置
            await this.updateSignInConfig(defaultConfig);
            
            this.setData({
              config: defaultConfig
            });
            
            wx.showToast({
              title: '重置成功',
              icon: 'success'
            });
            
          } catch (error) {
            console.error('重置配置失败:', error);
            
            wx.showToast({
              title: '重置失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  /**
   * 刷新配置
   */
  onRefreshConfig() {
    this.loadCurrentConfig();
  },

  /**
   * 编辑字段配置
   */
  onEditField(e) {
    const { index } = e.currentTarget.dataset;
    const field = this.data.config.formFields[index];
    
    wx.showModal({
      title: '字段配置',
      content: `字段: ${field.label}\n类型: ${field.type}\n必填: ${field.required ? '是' : '否'}\n显示: ${field.visible ? '是' : '否'}`,
      showCancel: false,
      confirmText: '确定'
    });
  },

  /**
   * 切换字段显示状态
   */
  async onToggleFieldVisible(e) {
    const { index } = e.currentTarget.dataset;
    const config = JSON.parse(JSON.stringify(this.data.config)); // 深拷贝
    
    config.formFields[index].visible = !config.formFields[index].visible;
    
    try {
      wx.showLoading({
        title: '更新中...'
      });
      
      await this.updateSignInConfig(config);
      
      this.setData({
        config: config
      });
      
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('更新配置失败:', error);
      
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  }
})
