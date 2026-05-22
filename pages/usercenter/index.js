import Toast from 'tdesign-miniprogram/toast/index';

// 获取全局 App 实例
const app = getApp();

const menuData = app.globalData.menuData || [];

const orderTagInfos = [
    {  title: '待付款',  iconName: 'wallet',  orderNum: 0,  tabType: 5,  status: 1,
    },
    {  title: '待发货',  iconName: 'deliver',  orderNum: 0,  tabType: 10,  status: 1,
    },
    {  title: '待收货',  iconName: 'package',  orderNum: 0,  tabType: 40,  status: 1,
    },
    {  title: '待评价',  iconName: 'comment',  orderNum: 0,  tabType: 60,  status: 1,
    },
    {  title: '退款/售后',  iconName: 'exchang',  orderNum: 0,  tabType: 0,  status: 1,
    }
  ]

const getDefaultData = () => ({
  showMakePhone: false,
  userInfo: {
    avatarUrl: '',
    nickName: '正在登录...',
    phoneNumber: '',
  },
  menuData,
  orderTagInfos,
  customerServiceInfo: {},
  currAuthStep: 2,
  showKefu: true,
  versionNo: '',
});

Page({
  data: getDefaultData(),

  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.fetUseriInfoHandle();
  },

  applyUserCenterData(userInfo) {
    const mockCountsData = [
      { type: 'qrcode', num: '邀请好友' },
      { type: 'revenue', num: '0.00' },
      { type: 'coupon', num: '0' },
      { type: 'point', num: '0' }
    ];

    const mockOrderInfo = [
      { orderNum: 0 },
      { orderNum: 0 },
      { orderNum: 0 },
      { orderNum: 0 },
      { orderNum: 0 }
    ];

    const mockCustomerServiceInfo = {
      servicePhone: '400-123-4567'
    };

    const firstMenuGroup = Array.isArray(menuData?.[0]) ? menuData[0] : [];
    firstMenuGroup.forEach((v) => {
      mockCountsData.forEach((counts) => {
        if (counts.type === v.type) {
          // eslint-disable-next-line no-param-reassign
          if (v.type === 'revenue') {
            v.tit = `¥${counts.num}`
          } else {
            v.tit = counts.num;
          }
        }
      });
    });

    const info = orderTagInfos.map((v, index) => ({
      ...v,
      ...mockOrderInfo[index],
    }));

    this.setData({
      userInfo,
      menuData,
      orderTagInfos: info,
      customerServiceInfo: mockCustomerServiceInfo,
      currAuthStep: 2,
    });
  },

  fetUseriInfoHandle() {
    // 直接使用全局变量中的用户信息
    const globalUserInfo = app.getUserInfo();
    const isLoggedIn = app.isUserLoggedIn();
    
    if (isLoggedIn && globalUserInfo) {
      console.log('使用全局登录态中的用户信息');
      this.applyUserCenterData(globalUserInfo);
      wx.stopPullDownRefresh();
    } else {
      console.log('等待自动登录结果');
      this.setData({
        userInfo: {
          avatarUrl: '',
          nickName: '正在登录...',
          phoneNumber: '',
        },
        currAuthStep: 2,
      });

      const stopRefresh = () => wx.stopPullDownRefresh();
      app.silentLogin().then(() => {
        const latestUserInfo = app.getUserInfo();
        if (app.isUserLoggedIn() && latestUserInfo) {
          this.applyUserCenterData(latestUserInfo);
        }
        stopRefresh();
      }).catch((err) => {
        console.error('自动登录失败:', err);
        this.setData({
          userInfo: {
            avatarUrl: '',
            nickName: '请稍后重试',
            phoneNumber: '',
          },
          currAuthStep: 2,
        });
        stopRefresh();
      });
    }
  },

  onClickCell({
    currentTarget
  }) {
    const {
      type
    } = currentTarget.dataset;

    switch (type) {
      case 'revenue': {
         wx.navigateTo({
          url: '/pages/template-list/index',
          success: () => {},
          fail: () => {
    
          },
        });
        break
      }
      case 'qrcode': {
         wx.navigateTo({
          url: '/pages/user/qrcode/generator/index',
          success: () => {},
          fail: () => {
            Toast({
              context: this,
              selector: '#t-toast',
              message: '无法打开二维码页面',
              icon: '',
              duration: 1500,
            });
          },
        });
        break
      }
      case 'address': {
        wx.navigateTo({
          url: '/pages/user/address/list/index'
        });
        break;
      }
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({
          url: '/pages/coupon/coupon-list/index'
        });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  jumpNav(e) {
    const status = e.detail.tabType;

    if (status === 0) {
      wx.navigateTo({
        url: '/pages/order/after-service-list/index'
      });
    } else {
      wx.navigateTo({
        url: `/pages/order/order-list/index?status=${status}`
      });
    }
  },

  jumpAllOrder() {
    wx.navigateTo({
      url: '/pages/order/order-list/index'
    });
  },

  openMakePhone() {
    this.setData({
      showMakePhone: true
    });
  },

  closeMakePhone() {
    this.setData({
      showMakePhone: false
    });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone,
    });
  },

  gotoUserEditPage() {
    const isLoggedIn = app.isUserLoggedIn();
    if (isLoggedIn) {
      wx.navigateTo({
        url: '/pages/user/person-info/index'
      });
    } else {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先登录',
        icon: '',
        duration: 1500,
      });
    }
  },

  navToPromotion() {
    wx.navigateTo({
      url: '/pages/promotion-share/index',
    });
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const {
      version,
      envVersion = __wxConfig
    } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : '0.0.1',
    });
  },
});
