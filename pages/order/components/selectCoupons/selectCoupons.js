const emptyCouponImg = `https://tdesign.gtimg.com/miniprogram/template/retail/coupon/ordersure-coupon-newempty.png`;

Component({
  properties: {
    storeId: String,
    promotionGoodsList: {
      type: Array,
      value: [],
    },
    orderSureCouponList: {
      type: Array,
      value: [],
    },
    couponsShow: {
      type: Boolean,
      value: false,
      observer(couponsShow) {
        if (couponsShow) {
          this.initData(this.data.orderSureCouponList || []);
        }
      },
    },
  },
  data: {
    emptyCouponImg,
    goodsList: [],
    selectedList: [],
    couponsList: [],
    orderSureCouponList: [],
    promotionGoodsList: [],
  },
  methods: {
    initData(couponList = []) {
      const couponsList = (couponList || []).map((coupon, index) => ({
        ...coupon,
        key: coupon.couponNo || coupon.key || String(index),
        isSelected: !!coupon.selected,
        displayType: Number(coupon.type) === 4 ? 1 : coupon.type,
        displayValue: Number(coupon.type) === 4 ? Number(coupon.discountAmount || 0) : coupon.value,
        desc: coupon.desc || coupon.statusText || '',
      }));
      const selectedList = couponsList.filter((coupon) => coupon.isSelected);
      const reduce = selectedList.reduce((sum, coupon) => sum + Number(coupon.discountAmount || 0), 0);
      this.setData({
        selectedList,
        couponsList,
        reduce,
        selectedNum: selectedList.length,
      });
    },
    selectCoupon(e) {
      const { key } = e.currentTarget.dataset;
      const targetCoupon = this.data.couponsList.find((coupon) => coupon.key === key);
      if (!targetCoupon || targetCoupon.status !== 'default') return;
      const couponsList = this.data.couponsList.map((coupon) => ({
        ...coupon,
        isSelected: coupon.key === key,
      }));
      const selectedList = couponsList.filter((coupon) => coupon.isSelected);
      const reduce = selectedList.reduce((sum, coupon) => sum + Number(coupon.discountAmount || 0), 0);

      this.setData({
        selectedList,
        couponsList,
        reduce,
        selectedNum: selectedList.length,
      });

      this.triggerEvent('sure', {
        selectedList,
        couponNo: targetCoupon.couponNo || targetCoupon.key || '',
      });
    },
    hide() {
      this.setData({
        couponsShow: false,
      });
    },
  },
});
