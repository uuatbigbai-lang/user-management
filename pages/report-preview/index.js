const SCORE_TARGET = 82;
const CHART_BAR_TARGETS = [
  { name: '双歧杆菌', value: 72, status: '优势菌建议保持', color: '#3075B8' },
  { name: '乳酸杆菌', value: 58, status: '可继续提升', color: '#3075B8' },
  { name: '丁酸产生菌', value: 46, status: '关注膳食纤维', color: '#8bbf4d' },
  { name: '潜在有害菌', value: 24, status: '建议持续管理', color: '#e9a43a' },
];
const RADAR_TARGETS = [
  { name: '平衡', value: 82 },
  { name: '多样性', value: 76 },
  { name: '有益菌', value: 68 },
  { name: '屏障力', value: 73 },
];

const emptyChartBars = () => CHART_BAR_TARGETS.map((item) => ({ ...item, displayValue: 0 }));
const emptyRadarItems = () => RADAR_TARGETS.map((item) => ({ ...item, displayValue: 0 }));

Page({
  data: {
    chartAnimated: false,
    scoreValue: 0,
    scoreDeg: 0,
    labHighlights: [
      { value: 'BSL-2', label: '合作检测实验室' },
      { value: '200万+', label: '中国人群菌群样本' },
      { value: '16S', label: 'rRNA 测序技术' },
    ],
    chartBars: emptyChartBars(),
    trendNodes: [
      { label: '采样', value: '完成', left: 4, top: 58 },
      { label: '测序', value: '16S', left: 34, top: 42 },
      { label: '解读', value: 'AI+人工', left: 64, top: 32 },
      { label: '干预', value: '方案', left: 94, top: 24 },
    ],
    radarItems: emptyRadarItems(),
    productCards: [
      {
        title: '肠道菌群检测盒',
        desc: '居家完成采样，绑定小程序后寄回检测。适合想了解肠道状态、长期腹胀腹泻、饮食不规律、压力睡眠波动明显的人群。',
        tag: '先读懂',
      },
      {
        title: '可视化检测报告',
        desc: '从菌群结构、肠型、肠道预测年龄、菌群平衡和重点风险提示等维度，帮你把看不见的微生态变成看得懂的数据。',
        tag: '看得见',
      },
      {
        title: '个性化干预建议',
        desc: '结合报告结果和个人状态，匹配畅、安等益生菌健康管理方案，让后续补充不再只是“随便试试”。',
        tag: '再干预',
      },
    ],
    metrics: [
      {
        name: '菌群平衡指数',
        value: '82',
        unit: '分',
        desc: '综合评估有益菌、潜在有害菌及多样性水平，判断当前微生态是否处于相对平衡状态。',
      },
      {
        name: '肠道预测年龄',
        value: '48.6',
        unit: '岁',
        desc: '基于菌群特征给出健康参考，帮助识别肠道状态是否早于或晚于实际年龄。',
      },
      {
        name: '肠型识别',
        value: 'B型',
        unit: '',
        desc: '识别主要肠型特征，用于理解饮食结构、代谢倾向和后续营养管理方向。',
      },
      {
        name: '有益菌占比',
        value: '↑',
        unit: '待提升',
        desc: '关注双歧杆菌、乳酸杆菌等关键菌群表现，为益生菌干预选择提供依据。',
      },
      {
        name: '重点健康提示',
        value: '3',
        unit: '项',
        desc: '围绕肠道屏障、短链脂肪酸潜力、情绪睡眠相关风险等方向提供可读提示。',
      },
    ],
  },

  onReady() {
    this.createChartObserver();
  },

  onUnload() {
    if (this.chartObserver) {
      this.chartObserver.disconnect();
    }
    if (this.chartTimer) {
      clearInterval(this.chartTimer);
    }
  },

  createChartObserver() {
    this.chartObserver = this.createIntersectionObserver({
      thresholds: [0.15, 0.45],
      observeAll: false,
    });
    this.chartObserver.relativeToViewport({ bottom: -80 }).observe('#chart-section', (res) => {
      if (res.intersectionRatio > 0 && !this.data.chartAnimated) {
        this.startChartAnimation();
      }
    });
  },

  startChartAnimation() {
    if (this.data.chartAnimated) return;
    this.setData({ chartAnimated: true });

    const duration = 1100;
    const frames = 32;
    let currentFrame = 0;

    if (this.chartTimer) {
      clearInterval(this.chartTimer);
    }

    this.chartTimer = setInterval(() => {
      currentFrame += 1;
      const progress = Math.min(currentFrame / frames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const scoreValue = Math.round(SCORE_TARGET * eased);
      const scoreDeg = Math.round((SCORE_TARGET / 100) * 360 * eased);
      const chartBars = CHART_BAR_TARGETS.map((item) => ({
        ...item,
        displayValue: Math.round(item.value * eased),
      }));
      const radarItems = RADAR_TARGETS.map((item) => ({
        ...item,
        displayValue: Math.round(item.value * eased),
      }));

      this.setData({
        scoreValue,
        scoreDeg,
        chartBars,
        radarItems,
      });

      if (progress >= 1) {
        clearInterval(this.chartTimer);
        this.chartTimer = null;
      }
    }, duration / frames);
  },

  goProducts() {
    wx.navigateTo({
      url: '/pages/products/index?category=testkit',
    });
  },

  goSample() {
    wx.switchTab({
      url: '/pages/sample/index',
    });
  },
});
