// packages/content/signIn/signIn.js
Page({

  /**
   * Page initial data
   */
  data: {
    // 页面配置
    pageConfig: null,
    
    // 表单数据
    formData: {},
    
    // 页面状态
    submitting: false,
    canSubmit: false,
    configLoading: true
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    // 初始化Toast组件
    this.selectComponent('#t-toast');
    this.selectComponent('#t-message');
    
    // 加载页面配置
    this.loadPageConfig();
  },

  /**
   * 加载页面配置
   */
  async loadPageConfig() {
    try {
      this.setData({
        configLoading: true
      });

      const result = await this.getSignInConfig();
      
      if (result.code === 0) {
        const config = result.data;
        
        // 初始化表单数据
        const initialFormData = {};
        config.formFields.forEach(field => {
          initialFormData[field.key] = '';
        });
        
        this.setData({
          pageConfig: config,
          formData: initialFormData,
          configLoading: false
        });
        
        console.log('页面配置加载成功:', config);
      } else {
        throw new Error(result.message || '配置加载失败');
      }
      
    } catch (error) {
      console.error('加载页面配置失败:', error);
      this.setData({
        configLoading: false
      });
      
      // 显示错误提示
      wx.showModal({
        title: '配置加载失败',
        content: '无法加载页面配置，请重试',
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.loadPageConfig();
          }
        }
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
   * 通用输入变化处理
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    }, () => {
      this.checkCanSubmit();
    });
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    if (!this.data.pageConfig) {
      return;
    }

    const { formData, pageConfig } = this.data;
    const requiredFields = pageConfig.formFields.filter(field => field.required && field.visible);
    
    const canSubmit = requiredFields.every(field => {
      const value = formData[field.key];
      return value && value.toString().trim().length > 0;
    });
    
    this.setData({
      canSubmit: canSubmit
    });
  },

  /**
   * 验证字段值
   */
  validateField(field, value) {
    if (!field.validation) {
      return { valid: true };
    }

    const validation = field.validation;
    const trimmedValue = value ? value.toString().trim() : '';

    // 检查最小长度
    if (validation.minLength && trimmedValue.length < validation.minLength) {
      return {
        valid: false,
        message: validation.errorMessage || `${field.label}长度不能少于${validation.minLength}个字符`
      };
    }

    // 检查最大长度
    if (validation.maxLength && trimmedValue.length > validation.maxLength) {
      return {
        valid: false,
        message: validation.errorMessage || `${field.label}长度不能超过${validation.maxLength}个字符`
      };
    }

    // 检查正则表达式
    if (validation.pattern && trimmedValue) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(trimmedValue)) {
        return {
          valid: false,
          message: validation.errorMessage || `请输入正确的${field.label}`
        };
      }
    }

    return { valid: true };
  },

  /**
   * 显示错误消息
   */
  showError(message) {
    wx.showModal({
      content: message,
      title: '提示',
      showCancel: false,
      duration: 2000
    });
  },

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 提交表单
   */
  async onSubmit() {
    const { formData, pageConfig } = this.data;

    if (!pageConfig) {
      this.showError('页面配置未加载，请刷新页面');
      return;
    }

    // 验证所有字段
    const visibleFields = pageConfig.formFields.filter(field => field.visible);
    
    for (let field of visibleFields) {
      if (field.required) {
        const value = formData[field.key];
        if (!value || value.toString().trim().length === 0) {
          this.showError(`${field.label}不能为空`);
          return;
        }
      }

      // 验证字段格式
      if (pageConfig.features.enableValidation) {
        const validation = this.validateField(field, formData[field.key]);
        if (!validation.valid) {
          this.showError(validation.message);
          return;
        }
      }
    }

    // 设置提交状态
    this.setData({
      submitting: true
    });

    try {
      // 准备提交数据
      const submitData = {};
      visibleFields.forEach(field => {
        const value = formData[field.key];
        submitData[field.key] = value ? value.toString().trim() : '';
      });

      // 调用签到接口
      const result = await this.submitSignIn(submitData);
      // 提交成功
      const successMessage = pageConfig.messages.success || '签到成功！';
      this.showSuccess(successMessage);

      // 跳转到签到完成页面
      setTimeout(() => {
        const signInData = encodeURIComponent(JSON.stringify(result.data));
        wx.navigateTo({
          url: `/packages/content/signInSuccess/signInSuccess?signInData=${signInData}`
        });
      }, 0);

    } catch (error) {
      console.error('签到失败:', error);
      
      let errorMessage = '签到失败，请重试';
      if (error.message.includes('今日已签到')) {
        errorMessage = pageConfig.messages.duplicateError || error.message;
      } else if (error.message.includes('网络')) {
        errorMessage = pageConfig.messages.networkError || error.message;
      }
      
      this.showError(errorMessage);
    } finally {
      this.setData({
        submitting: false
      });
    }
  },

  /**
   * 提交签到数据
   */
  submitSignIn(data) {
    return new Promise((resolve, reject) => {
      // 调用云函数
      wx.cloud.callFunction({
        name: 'Sign',
        data: data,
        success: (res) => {
          console.log('云函数调用成功:', res);
          if (res.result.code === 0) {
            resolve({
              success: true,
              message: res.result.message,
              data: res.result.data
            });
          } else {
            reject(new Error(res.result.message || '签到失败'));
          }
        },
        fail: (error) => {
          console.error('云函数调用失败:', error);
          reject(new Error('网络连接失败，请检查网络后重试'));
        }
      });
    });
  },

  /**
   * 重置表单
   */
  resetForm() {
    if (!this.data.pageConfig) {
      return;
    }

    const initialFormData = {};
    this.data.pageConfig.formFields.forEach(field => {
      initialFormData[field.key] = '';
    });

    this.setData({
      formData: initialFormData,
      canSubmit: false
    });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {
    // 下拉刷新时重新加载配置
    this.loadPageConfig().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  }
})
