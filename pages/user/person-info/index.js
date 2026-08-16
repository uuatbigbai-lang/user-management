import { fetchPerson } from '../../../services/usercenter/fetchPerson';
import { bindPhoneNumber } from '../../../services/usercenter/bindPhoneNumber';
import { updateAvatar, updateProfile } from '../../../services/usercenter/updateProfile';
import { buildBackendUrl } from '../../../config/index';
import { phoneEncryption } from '../../../utils/util';
import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    personInfo: {
      avatarUrl: '',
      nickName: '',
      gender: 0,
      phoneNumber: '',
      phoneNumberText: '',
    },
    showPhoneLoginPopup: false,
    phoneLoginLoading: false,
    avatarSubmitting: false,
  },
  onLoad() {
    this.init();
  },
  onShow() {
    this.fetchData();
  },
  init() {
    this.fetchData();
  },
  fetchData() {
    fetchPerson().then((personInfo) => {
      this.setData({
        personInfo: {
          ...personInfo,
          phoneNumberText: personInfo.phoneNumber ? phoneEncryption(personInfo.phoneNumber) : '',
        },
      });
    });
  },
  onClickCell({ currentTarget }) {
    const { dataset } = currentTarget;
    const { nickName } = this.data.personInfo;

    switch (dataset.type) {
      case 'salesProfile':
        wx.navigateTo({
          url: '/pages/user/sales-profile/index',
        });
        break;
      case 'name':
        wx.navigateTo({
          url: `/pages/user/name-edit/index?name=${nickName}`,
        });
        break;
      case 'avatarUrl':
        this.openChooseAvatarTip();
        break;
      case 'phoneNumber':
        this.openPhoneLoginPopup();
        break;
      default: {
        break;
      }
    }
  },
  openChooseAvatarTip() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '请点击右侧头像获取微信头像',
      theme: 'warning',
    });
  },

  syncUserInfo(nextUserInfo = {}) {
    if (app.setUserInfo) {
      app.setUserInfo(nextUserInfo);
    } else {
      app.globalData.userInfo = nextUserInfo;
      wx.setStorageSync('userInfo', nextUserInfo);
      wx.setStorageSync('isLoggedIn', true);
    }
  },

  getAvatarMimeType(filePath = '') {
    const ext = String(filePath || '').split('?')[0].split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    return 'image/png';
  },

  readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (res) => resolve(res.data || ''),
        fail: reject,
      });
    });
  },

  async onChooseAvatar(e) {
    const avatarTempFilePath = e.detail?.avatarUrl || '';
    if (!avatarTempFilePath) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '未获取到微信头像',
        theme: 'warning',
      });
      return;
    }

    this.setData({ avatarSubmitting: true });
    try {
      const imageBase64 = await this.readFileAsBase64(avatarTempFilePath);
      const result = await updateAvatar({
        imageBase64,
        mimeType: this.getAvatarMimeType(avatarTempFilePath),
      });
      const nextUserInfo = {
        ...(app.getUserInfo ? (app.getUserInfo() || {}) : {}),
        ...(result.userInfo || {}),
      };
      nextUserInfo.avatarUrl = buildBackendUrl(nextUserInfo.avatarUrl) || avatarTempFilePath;
      this.syncUserInfo(nextUserInfo);
      this.setData({
        'personInfo.avatarUrl': nextUserInfo.avatarUrl,
      });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '头像更新成功',
        theme: 'success',
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.errMsg || error.message || error.msg || '修改头像出错了',
        theme: 'error',
      });
    } finally {
      this.setData({ avatarSubmitting: false });
    }
  },

  openPhoneLoginPopup() {
    this.setData({
      showPhoneLoginPopup: true,
    });
  },

  closePhoneLoginPopup() {
    if (this.data.phoneLoginLoading) return;
    this.setData({
      showPhoneLoginPopup: false,
    });
  },

  openPrivacyContract() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        fail: () => {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '暂时无法打开隐私说明',
            icon: '',
            duration: 1500,
          });
        },
      });
      return;
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: '当前基础库暂不支持查看隐私说明',
      icon: '',
      duration: 1500,
    });
  },

  async onGetPhoneNumber(e) {
    const phoneCode = e.detail?.code;
    const errMsg = e.detail?.errMsg || '';
    if (!phoneCode) {
      if (errMsg && !errMsg.includes('fail user deny')) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未完成手机号授权',
          icon: '',
          duration: 1500,
        });
      }
      return;
    }

    this.setData({ phoneLoginLoading: true });
    try {
      const result = await bindPhoneNumber(phoneCode);
      const nextUserInfo = result.userInfo || {};
      this.syncUserInfo(nextUserInfo);
      this.setData({
        showPhoneLoginPopup: false,
        personInfo: {
          ...nextUserInfo,
          phoneNumberText: nextUserInfo.phoneNumber ? phoneEncryption(nextUserInfo.phoneNumber) : '',
        },
      });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '手机号绑定成功',
        theme: 'success',
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '手机号绑定失败',
        theme: 'error',
      });
    } finally {
      this.setData({ phoneLoginLoading: false });
    }
  },
});
