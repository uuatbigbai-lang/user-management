import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';
import {
  fetchCartGroupData,
  updateCartQuantity,
  updateCartSelect,
  deleteCartItem,
} from '../../services/cart/cart';

const app = getApp();

Page({
  data: {
    cartGroupData: null,
    deleteDialogVisible: false,
    pendingDeleteGoods: null,
  },

  onShow() {
    this.getTabBar().init();
    this.refreshData(true);
  },

  onLoad() {
    this.refreshData();
  },

  showDeleteDialog(goods) {
    this.setData({
      deleteDialogVisible: true,
      pendingDeleteGoods: goods,
    });
  },

  hideDeleteDialog(shouldRefresh = false) {
    this.setData({
      deleteDialogVisible: false,
      pendingDeleteGoods: null,
    });

    if (shouldRefresh) {
      this.refreshData(true);
    }
  },

  refreshData(refresh) {
    wx.showLoading({ title: '加载中' });
    this.getCartGroupData(refresh).then((res) => {
      wx.hideLoading();
      let isEmpty = true;
      const cartGroupData = res.data;

      for (const store of cartGroupData.storeGoods) {
        store.isSelected = true;
        store.storeStockShortage = false;
        if (!store.shortageGoodsList) {
          store.shortageGoodsList = [];
        }
        for (const activity of store.promotionGoodsList) {
          activity.goodsPromotionList = activity.goodsPromotionList.filter((goods) => {
            goods.originPrice = undefined;
            if (goods.quantity > goods.stockQuantity) {
              store.storeStockShortage = true;
            }
            if (!goods.isSelected) {
              store.isSelected = false;
            }
            if (goods.stockQuantity > 0) {
              return true;
            }
            store.shortageGoodsList.push(goods);
            return false;
          });
          if (activity.goodsPromotionList.length > 0) {
            isEmpty = false;
          }
        }
        if (store.shortageGoodsList.length > 0) {
          isEmpty = false;
        }
      }
      cartGroupData.invalidGoodItems = (cartGroupData.invalidGoodItems || []).map((goods) => {
        goods.originPrice = undefined;
        return goods;
      });
      cartGroupData.isNotEmpty = !isEmpty;
      if (app.setCartBadgeCount) {
        app.setCartBadgeCount(cartGroupData.selectedGoodsCount || 0);
      }
      const tabBar = this.getTabBar && this.getTabBar();
      if (tabBar && tabBar.init) {
        tabBar.init();
      }
      this.setData({ cartGroupData });
    });
  },

  findGoods(spuId, skuId) {
    let currentStore;
    let currentActivity;
    let currentGoods;
    const { storeGoods } = this.data.cartGroupData;
    for (const store of storeGoods) {
      for (const activity of store.promotionGoodsList) {
        for (const goods of activity.goodsPromotionList) {
          if (goods.spuId === spuId && goods.skuId === skuId) {
            currentStore = store;
            currentActivity = activity;
            currentGoods = goods;
            return { currentStore, currentActivity, currentGoods };
          }
        }
      }
    }
    return { currentStore, currentActivity, currentGoods };
  },

  getCartGroupData(refresh) {
    const { cartGroupData } = this.data;
    if (!cartGroupData || refresh) {
      return fetchCartGroupData();
    }
    return Promise.resolve({ data: cartGroupData });
  },

  // 选择单个商品 → 调接口切换选中状态，再刷新
  onGoodsSelect(e) {
    const {
      goods: { spuId, skuId },
      isSelected,
    } = e.detail;

    updateCartSelect({ spuId, skuId, isSelected }).then(() => {
      this.refreshData(true);
    });
  },

  onStoreSelect(e) {
    const {
      store: { storeId },
      isSelected,
    } = e.detail;
    // 全选/取消门店下所有商品
    const { storeGoods } = this.data.cartGroupData;
    const currentStore = storeGoods.find((s) => s.storeId === storeId);
    if (!currentStore) return;

    const promises = [];
    currentStore.promotionGoodsList.forEach((activity) => {
      activity.goodsPromotionList.forEach((goods) => {
        promises.push(updateCartSelect({ spuId: goods.spuId, skuId: goods.skuId, isSelected }));
      });
    });
    Promise.all(promises).then(() => this.refreshData(true));
  },

  // 加购数量变更 → 调接口更新
  onQuantityChange(e) {
    const {
      goods: { spuId, skuId },
      quantity,
    } = e.detail;

    const { currentGoods } = this.findGoods(spuId, skuId);
    if (!currentGoods) return;

    if (Number(quantity) <= 0) {
      this.showDeleteDialog(currentGoods);
      return;
    }

    const stockQuantity = currentGoods.stockQuantity > 0 ? currentGoods.stockQuantity : 0;
    if (quantity > stockQuantity) {
      if (currentGoods.quantity === stockQuantity && quantity - stockQuantity === 1) {
        Toast({ context: this, selector: '#t-toast', message: '当前商品库存不足' });
        return;
      }
      Dialog.confirm({
        title: '商品库存不足',
        content: `当前商品库存不足，最大可购买数量为${stockQuantity}件`,
        confirmBtn: { content: '修改为最大可购买数量', variant: 'base', style: 'color: #3075B8' },
        cancelBtn: { content: '取消', variant: 'base', style: 'color: #a3b5a6' },
      })
        .then(() => {
          updateCartQuantity({ spuId, skuId, quantity: stockQuantity }).then(() => this.refreshData(true));
        })
        .catch(() => {});
      return;
    }

    updateCartQuantity({ spuId, skuId, quantity }).then(() => this.refreshData(true));
  },

  goCollect() {
    const promotionID = '123';
    wx.navigateTo({
      url: `/pages/promotion/promotion-detail/index?promotion_id=${promotionID}`,
    });
  },

  goGoodsDetail(e) {
    const { spuId, storeId } = e.detail.goods;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}&storeId=${storeId}`,
    });
  },

  clearInvalidGoods() {
    this.refreshData(true);
  },

  // 删除商品 → 调接口删除
  onGoodsDelete(e) {
    const { goods } = e.detail;
    this.showDeleteDialog(goods);
  },

  onDeleteDialogCancel() {
    this.hideDeleteDialog(true);
  },

  onDeleteDialogConfirm() {
    const { pendingDeleteGoods } = this.data;
    if (!pendingDeleteGoods) {
      this.hideDeleteDialog();
      return;
    }

    const { spuId, skuId } = pendingDeleteGoods;
    deleteCartItem({ spuId, skuId }).then(() => {
      this.hideDeleteDialog();
      Toast({ context: this, selector: '#t-toast', message: '商品删除成功' });
      this.refreshData(true);
    });
  },

  onSelectAll(event) {
    const { isAllSelected } = event?.detail ?? {};
    // 全选/取消全选：遍历所有商品切换选中状态
    const { storeGoods } = this.data.cartGroupData;
    const promises = [];
    const newState = !isAllSelected;
    storeGoods.forEach((store) => {
      store.promotionGoodsList.forEach((activity) => {
        activity.goodsPromotionList.forEach((goods) => {
          promises.push(updateCartSelect({ spuId: goods.spuId, skuId: goods.skuId, isSelected: newState }));
        });
      });
    });
    Promise.all(promises).then(() => this.refreshData(true));
  },

  onToSettle() {
    const goodsRequestList = [];
    this.data.cartGroupData.storeGoods.forEach((store) => {
      store.promotionGoodsList.forEach((promotion) => {
        promotion.goodsPromotionList.forEach((m) => {
          if (m.isSelected == 1) {
            goodsRequestList.push(m);
          }
        });
      });
    });
    if (goodsRequestList.length === 0) {
      Toast({ context: this, selector: '#t-toast', message: '请选择要结算的商品' });
      return;
    }
    wx.setStorageSync('order.goodsRequestList', JSON.stringify(goodsRequestList));
    wx.navigateTo({ url: '/pages/order/order-confirm/index?type=cart' });
  },

  onGotoHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },
});
