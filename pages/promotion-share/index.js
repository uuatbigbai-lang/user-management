import Toast from 'tdesign-miniprogram/toast/index';

// 目标数据
const TARGET = {
  totalEarnings: 128.60,
  monthEarnings: 36.50,
  inviteCount: 5,
  orderCount: 12,
};

Page({
  data: {
    inviteCode: 'YSJ2026',
    totalEarnings: '0.00',
    monthEarnings: '0.00',
    inviteCount: 0,
    orderCount: 0,
    earningsDetail: [
      {
        name: '益生菌胶囊（30粒装）',
        time: '2026-04-20 14:30',
        amount: '12.80',
        status: 'settled',
      },
      {
        name: '肠道菌群检测试剂盒',
        time: '2026-04-18 09:15',
        amount: '29.90',
        status: 'settled',
      },
      {
        name: '复合益生菌粉（家庭装）',
        time: '2026-04-15 20:45',
        amount: '18.50',
        status: 'pending',
      },
      {
        name: '肠道炎症检测试剂',
        time: '2026-04-12 11:20',
        amount: '25.00',
        status: 'settled',
      },
    ],
  },

  _timers: [],

  onLoad() {},

  onShow() {
    this._clearTimers();
    // 先重置为 0
    this.setData({
      totalEarnings: '0.00',
      monthEarnings: '0.00',
      inviteCount: 0,
      orderCount: 0,
    });
    // 下一帧开始动画，让重置生效
    setTimeout(() => {
      this._animateNumber('totalEarnings', TARGET.totalEarnings, 2, 800);
      this._animateNumber('monthEarnings', TARGET.monthEarnings, 2, 800);
      this._animateNumber('inviteCount', TARGET.inviteCount, 0, 600);
      this._animateNumber('orderCount', TARGET.orderCount, 0, 600);
    }, 50);
  },

  onHide() {
    this._clearTimers();
  },

  onUnload() {
    this._clearTimers();
  },

  /**
   * 数字自增动画
   * @param {string} key - data 字段名
   * @param {number} target - 目标值
   * @param {number} decimals - 小数位数
   * @param {number} duration - 动画时长(ms)
   */
  _animateNumber(key, target, decimals, duration) {
    const totalFrames = 30;
    const interval = duration / totalFrames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      // 缓出效果: 1 - (1 - t)^3
      const t = frame / totalFrames;
      const ease = 1 - Math.pow(1 - t, 3);
      const current = target * ease;

      if (frame >= totalFrames) {
        clearInterval(timer);
        this.setData({ [key]: decimals > 0 ? target.toFixed(decimals) : target });
      } else {
        this.setData({ [key]: decimals > 0 ? current.toFixed(decimals) : Math.floor(current) });
      }
    }, interval);

    this._timers.push(timer);
  },

  _clearTimers() {
    this._timers.forEach((t) => clearInterval(t));
    this._timers = [];
  },

  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '邀请码已复制',
          icon: 'check-circle',
          duration: 1500,
        });
      },
    });
  },

  goShareGoods() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },

  onShareAppMessage() {
    return {
      title: '立康林 - 好物分享，一起赚佣金',
      path: `/pages/home/home?inviteCode=${this.data.inviteCode}`,
    };
  },

  onShareTimeline() {
    return {
      title: '立康林 - 分享赚佣金',
      query: `inviteCode=${this.data.inviteCode}`,
    };
  },
});