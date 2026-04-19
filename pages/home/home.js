import { fetchHome } from '../../services/home/home';
import { fetchGoodsList } from '../../services/good/fetchGoods';
import Toast from 'tdesign-miniprogram/toast/index';
import {
  fetchUserCenter,
} from '../../services/usercenter/fetchUsercenter.js';

Page({
  data: {
    imgSrcs: [],
    tabList: [],
    goodsList: [],
    goodsListLoadStatus: 0,
    pageLoading: false,
    current: 1,
    autoplay: true,
    duration: '500',
    interval: 5000,
    navigation: { type: 'dots' },
    swiperImageProps: { mode: 'aspectFit' },

    img1: 'https://tdesign.gtimg.com/mobile/demos/example1.png',
    img2: 'https://tdesign.gtimg.com/mobile/demos/example2.png',
    img3: 'https://tdesign.gtimg.com/mobile/demos/example3.png',
    img4: 'https://tdesign.gtimg.com/mobile/demos/example4.png',
  },

  goodListPagination: {
    index: 0,
    num: 20,
  },

  privateData: {
    tabIndex: 0,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad(p) {
    this.detectFrom(p);
    this.init();
  },

  onReachBottom() {
    if (this.data.goodsListLoadStatus === 0) {
      this.loadGoodsList();
    }
  },

  onPullDownRefresh() {
    this.init();
  },

  detectFrom(p) {
    console.log('p', p)
    const app = getApp();
    if (p.from) {
      // 更新全局变量 from
      app.globalData.from = p.from;
      console.log('已更新全局变量 from:', app.globalData.from);
    } else {
      app.globalData.from = 'null';
    }
  },

  init() {
    this.loadHomePage();
  },

  loadHomePage() {
    wx.stopPullDownRefresh();

    this.setData({
      pageLoading: true,
    });
    const app = getApp();

    fetchHome().then(({ swiper, tabList, menuData }) => {
      
      this.setData({
        tabList,
        imgSrcs: swiper,
        pageLoading: false,
      });
      app.globalData.menuData = menuData;

      this.loadGoodsList(true);
    });
  },

  tabChangeHandle(e) {
    this.privateData.tabIndex = e.detail?.value + '';
    this.loadGoodsList(true);
  },

  onReTry() {
    this.loadGoodsList();
  },

  async loadGoodsList(fresh = false) {
    if (fresh) {
      wx.pageScrollTo({
        scrollTop: 0,
      });
    }

    this.setData({ goodsListLoadStatus: 1 });

    const pageSize = this.goodListPagination.num;
    // get next page
    let pageIndex = this.goodListPagination.index + 1;
    if (fresh) {
      pageIndex = 0;
    }

    try {
      const nextList = await fetchGoodsList(pageIndex, pageSize, this.privateData.tabIndex + '');
      this.setData({
        goodsList: fresh ? nextList : this.data.goodsList.concat(nextList),
        goodsListLoadStatus: 0,
      });

      this.goodListPagination.index = pageIndex;
    } catch (err) {
      this.setData({ goodsListLoadStatus: 3 });
    }
  },

  goodListClickHandle(e) {
    const { index } = e.detail;
    const { spuId } = this.data.goodsList[index];
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}`,
    });
  },


  async goodListAddCartHandle(e) {
    wx.showLoading({ title: '加车中', mask: true })
    const result = await wx.cloud.callFunction({
      name: 'addCart',
      data: e.detail?.goods
    });
    wx.hideLoading();
    if (result) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加车成功',
      });
    } else {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加车失败',
      });
    }

  },

  navToSearchPage() {
    wx.navigateTo({ url: '/pages/goods/search/index' });
  },
  navToLLM() {
    wx.navigateTo({ url: '/pages/llm/llm' });
  },
  signIn() {
    wx.navigateTo({ url: '/pages/signIn/signIn' });
  },

  // 初始化数据到云数据库
  async initializeData() {
    try {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '正在初始化数据...',
        theme: 'loading',
        duration: 0
      });

      // 调用数据初始化云函数
      const result = await wx.cloud.callFunction({
        name: 'initializeData',
        data: {
          action: 'initAll',
          clearExisting: true
        }
      });

      console.log('数据初始化结果:', result);

      if (result.result && result.result.success) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '数据初始化成功！',
          theme: 'success',
          duration: 2000
        });

        // 刷新商品列表
        this.loadGoodsList(true);
      } else {
        throw new Error(result.result?.error || '初始化失败');
      }
    } catch (error) {
      console.error('数据初始化失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: `初始化失败: ${error.message}`,
        theme: 'error',
        duration: 3000
      });
    }
  },
  // 调用云函数进行商品操作
  async specialCall() {
    try {
      // 示例：添加一个新商品
      const addResult = await this.addGood({
        title: '测试商品 - 白色短袖连衣裙',
        primaryImage: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09a.png',
        images: [
          'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09a.png',
          'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09b.png',
        ],
        minSalePrice: 29800,
        minLinePrice: 29800,
        maxSalePrice: 29800,
        maxLinePrice: 40000,
        spuStockQuantity: 100,
        categoryIds: ['127880527393854975'],
        specList: [
          {
            specId: '10011',
            title: '颜色',
            specValueList: [
              {
                specValueId: '10012',
                specValue: '白色',
                image: null,
              },
            ],
          },
          {
            specId: '10013',
            title: '尺码',
            specValueList: [
              {
                specValueId: '11014',
                specValue: 'S',
                image: null,
              },
              {
                specValueId: '10014',
                specValue: 'M',
                image: null,
              },
            ],
          },
        ],
        skuList: [
          {
            skuId: 'test_sku_001',
            skuImage: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09a.png',
            specInfo: [
              {
                specId: '10011',
                specValueId: '10012',
              },
              {
                specId: '10013',
                specValueId: '11014',
              },
            ],
            priceInfo: [
              { priceType: 1, price: '29800' },
              { priceType: 2, price: '40000' },
            ],
            stockInfo: {
              stockQuantity: 50,
              safeStockQuantity: 0,
              soldQuantity: 0,
            },
          },
        ],
        desc: [
          'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09c.png',
        ],
      });

      if (addResult.success) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '商品添加成功',
        });

        // // 示例：获取商品列表
        // const listResult = await this.getGoodsList({
        //   page: 1,
        //   pageSize: 10,
        // });

        // console.log('商品列表:', listResult);

        // // 示例：更新刚添加的商品
        // if (addResult.data && addResult.data._id) {
        //   const updateResult = await this.updateGood({
        //     _id: addResult.data._id,
        //     title: '更新后的商品标题',
        //     soldNum: 10,
        //   });

        //   console.log('更新结果:', updateResult);
        // }
      } else {
        Toast({
          context: this,
          selector: '#t-toast',
          message: addResult.error || '操作失败',
        });
      }
    } catch (error) {
      console.error('specialCall 执行错误:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '操作失败',
      });
    }
  },

  // 添加商品
  async addGood(goodData) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'mutateGood',
        data: {
          action: 'add',
          data: goodData,
        },
      });
      return result.result;
    } catch (error) {
      console.error('添加商品失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 更新商品
  async updateGood(updateData) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'mutateGood',
        data: {
          action: 'update',
          data: updateData,
        },
      });
      return result.result;
    } catch (error) {
      console.error('更新商品失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 删除商品
  async deleteGood(goodId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'mutateGood',
        data: {
          action: 'delete',
          data: {
            _id: goodId,
          },
        },
      });
      return result.result;
    } catch (error) {
      console.error('删除商品失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 获取单个商品
  async getGood(goodId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'mutateGood',
        data: {
          action: 'get',
          data: {
            _id: goodId,
          },
        },
      });
      return result.result;
    } catch (error) {
      console.error('获取商品失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 获取商品列表
  async getGoodsList(queryData = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'mutateGood',
        data: {
          action: 'list',
          data: {
            page: 1,
            pageSize: 20,
            ...queryData,
          },
        },
      });
      return result.result;
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  navToActivityDetail() {
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=spu_10`,
    });
  },
});
