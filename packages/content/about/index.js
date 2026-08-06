import { resolveCloudFileLocalPaths, resolveCloudFileUrls } from '../../../utils/cloudImage';

const ABOUT_ICON_CLOUD_BASE = 'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/aboutMe';
const ABOUT_ICON_FILE_IDS = {
  icon1: `${ABOUT_ICON_CLOUD_BASE}/icon1.png`,
  icon2: `${ABOUT_ICON_CLOUD_BASE}/icon2.png`,
  icon3: `${ABOUT_ICON_CLOUD_BASE}/icon3.png`,
  icon4: `${ABOUT_ICON_CLOUD_BASE}/icon4.png`,
};

Page({
  data: {
    aboutIcons: {
      icon1: '',
      icon2: '',
      icon3: '',
      icon4: '',
    },
  },

  onLoad() {
    this.loadAboutIcons();
  },

  async loadAboutIcons() {
    const fileIDs = Object.values(ABOUT_ICON_FILE_IDS);
    try {
      const localPathMap = await resolveCloudFileLocalPaths(fileIDs);
      const tempUrlMap = await resolveCloudFileUrls(fileIDs);
      const aboutIcons = Object.keys(ABOUT_ICON_FILE_IDS).reduce((result, key) => {
        const fileID = ABOUT_ICON_FILE_IDS[key];
        result[key] = localPathMap[fileID] || tempUrlMap[fileID] || '';
        return result;
      }, {});

      this.setData({ aboutIcons });
      console.log('[about] 核心业务 icons:', aboutIcons);
    } catch (err) {
      console.warn('[about] 核心业务 icon 加载失败:', err);
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },
  goSample() {
    wx.switchTab({ url: '/pages/sample/index' });
  },
});
