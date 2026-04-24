Page({
  data: {
    activeTab: 0,
    tabs: ['全部', '肠道科普', '益生菌知识', '饮食营养', '检测解读'],
    articles: [
      {
        id: 1,
        title: '肠道菌群失调？这5个信号别忽视',
        summary: '腹胀、便秘、皮肤变差……这些看似不相关的症状，可能都在提醒你肠道菌群已经失衡。',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-09a.png',
        tag: '肠道科普',
        category: 1,
        date: '2026-04-18',
        url: 'https://mp.weixin.qq.com/s/example1',
      },
      {
        id: 2,
        title: '益生菌怎么选？看懂这3点就够了',
        summary: '市面上益生菌产品五花八门，菌株种类、活菌数量、保存方式是选购的三大核心指标。',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-08a.png',
        tag: '益生菌知识',
        category: 2,
        date: '2026-04-15',
        url: 'https://mp.weixin.qq.com/s/example2',
      },
      {
        id: 3,
        title: '每天吃什么，肠道最"开心"？',
        summary: '高膳食纤维饮食、发酵食物、充足饮水……一份让肠道微生态保持健康的日常饮食清单。',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-10a.png',
        tag: '饮食营养',
        category: 3,
        date: '2026-04-12',
        url: 'https://mp.weixin.qq.com/s/example3',
      },
      {
        id: 4,
        title: '宝宝反复腹泻，可能和肠道菌群有关',
        summary: '婴幼儿肠道菌群尚未成熟，反复腹泻时不妨做一次肠道菌群检测，找到根本原因。',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-09a.png',
        tag: '肠道科普',
        category: 1,
        date: '2026-04-08',
        url: 'https://mp.weixin.qq.com/s/example4',
      },
      {
        id: 5,
        title: '肠道菌群检测报告怎么看？一文读懂',
        summary: '拿到检测报告后，菌群多样性、有益菌占比、有害菌预警等关键指标应该如何解读？',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-08a.png',
        tag: '检测解读',
        category: 4,
        date: '2026-04-05',
        url: 'https://mp.weixin.qq.com/s/example5',
      },
      {
        id: 6,
        title: '益生菌什么时候吃效果最好？',
        summary: '空腹还是饭后？早上还是晚上？服用益生菌的时间和方法会直接影响其存活率和效果。',
        cover: 'https://cdn-we-retail.ym.tencent.com/miniapp/template/retail/goods/nz-10a.png',
        tag: '益生菌知识',
        category: 2,
        date: '2026-04-02',
        url: 'https://mp.weixin.qq.com/s/example6',
      },
    ],
    filteredArticles: [],
  },

  onLoad() {
    this.filterArticles();
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    this.filterArticles();
  },

  filterArticles() {
    const { activeTab, articles } = this.data;
    if (activeTab === 0) {
      this.setData({ filteredArticles: articles });
    } else {
      this.setData({
        filteredArticles: articles.filter((a) => a.category === activeTab),
      });
    }
  },

  onArticleTap(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    // 跳转公众号文章（web-view 或复制链接）
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({
          title: '链接已复制，请在浏览器中打开',
          icon: 'none',
          duration: 2000,
        });
      },
    });
  },
});