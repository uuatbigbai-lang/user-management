import Toast from 'tdesign-miniprogram/toast/index';
import { updateProfile } from '../../../services/usercenter/updateProfile';

Page({
  data: {
    nameValue: '',
    submitting: false,
  },
  onLoad(options) {
    const { name } = options;
    this.setData({
      nameValue: name,
    });
  },
  onInputChange(e) {
    this.setData({
      nameValue: e.detail.value,
    });
  },
  async onSubmit() {
    const nickName = String(this.data.nameValue || '').trim();
    if (!nickName) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称不能为空',
        theme: 'warning',
      });
      return;
    }
    if (Array.from(nickName).length > 15) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称最多15个字',
        theme: 'warning',
      });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await updateProfile({ nickName });
      const app = getApp();
      const previousUserInfo = app?.getUserInfo ? (app.getUserInfo() || {}) : {};
      const nextUserInfo = {
        ...previousUserInfo,
        ...(result.userInfo || {}),
      };

      if (app?.setUserInfo) {
        app.setUserInfo(nextUserInfo);
      } else {
        if (app?.globalData) {
          app.globalData.userInfo = nextUserInfo;
        }
        wx.setStorageSync('userInfo', nextUserInfo);
      }

      Toast({
        context: this,
        selector: '#t-toast',
        message: '保存成功',
        theme: 'success',
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 300);
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '保存失败',
        theme: 'error',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
  clearContent() {
    this.setData({
      nameValue: '',
    });
  },
});
