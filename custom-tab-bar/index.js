import TabMenu from './data';
import { fetchCartGroupData } from '../services/cart/cart';

Component({
  data: {
    active: 0,
    list: TabMenu,
    cartBadgeCount: 0,
  },

  methods: {
    onChange(event) {
      this.setData({ active: event.detail.value });
      wx.switchTab({
        url: this.data.list[event.detail.value].url.startsWith('/')
          ? this.data.list[event.detail.value].url
          : `/${this.data.list[event.detail.value].url}`,
      });
    },

    async init() {
      const app = getApp();
      const page = getCurrentPages().pop();
      const route = page ? page.route.split('?')[0] : '';
      const active = this.data.list.findIndex(
        (item) =>
          (item.url.startsWith('/') ? item.url.substr(1) : item.url) ===
          `${route}`,
      );
      this.setData({
        active,
        cartBadgeCount: app.getCartBadgeCount ? app.getCartBadgeCount() : 0,
      });
      this.refreshCartBadge();
    },

    refreshCartBadge() {
      const app = getApp();
      fetchCartGroupData().then((res) => {
        const count = Number(res.data?.selectedGoodsCount || 0);
        if (app.setCartBadgeCount) {
          app.setCartBadgeCount(count);
        }
        this.setData({ cartBadgeCount: count });
      }).catch((err) => {
        console.warn('刷新购物车角标失败:', err);
      });
    },
  },
});
