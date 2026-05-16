import { fetchSampleDetail, saveSample } from '../../services/sample/index';

Page({
  data: {
    title: '信息登记',
    type: '',
    showAntibiotics: false,
    submitting: false,
    recordId: '',
    genderOptions: [
      { label: '男', value: '男' },
      { label: '女', value: '女' },
    ],
    yesNoOptions: [
      { label: '是', value: '是' },
      { label: '否', value: '否' },
    ],
    antibioticsOptions: [
      { label: '是', value: '是' },
      { label: '否', value: '否' },
    ],
    form: {
      sampleNo: '',
      name: '',
      age: '',
      gender: '',
      phone: '',
      city: '',
      height: '',
      weight: '',
      antibiotics: '',
      channel: '',
      remark: '',
      bowelFrequency: '',
      stoolShape: '',
      digestiveSymptoms: '',
      menstrualStatus: '',
      pregnant: '',
      vaginalMedication: '',
      vaginalSymptoms: '',
      inflammationSymptoms: '',
      inflammationMedication: '',
    },
  },

  async onLoad(query) {
    const title = query?.title ? decodeURIComponent(query.title) : '信息登记';
    const type = query?.type || '';
    const showAntibiotics = type === 'gut' || type === 'inflammation';
    const recordId = query?.id || '';
    this.setData({
      title,
      type,
      showAntibiotics,
      recordId,
    });
    wx.setNavigationBarTitle({ title });
    if (recordId) {
      await this.loadDetail(recordId);
    }
  },

  onInputChange(event) {
    const key = event.currentTarget.dataset.key;
    const value = event.detail?.value ?? '';
    this.setData({
      [`form.${key}`]: value,
    });
  },

  onSampleVideoTap() {
    const type = this.data.type;
    const fileMap = {
      gut: 'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple1.mp4',
      vaginal:
        'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple2.mp4',
      inflammation:
        'cloud://cloud1-1gr581cp70dbd77a.636c-cloud1-1gr581cp70dbd77a-1382535808/simple/simple3.mp4',
    };
    const fileID = fileMap[type] || fileMap.gut;
    wx.showLoading({ title: '加载中', mask: true });
    wx.cloud
      .downloadFile({
        fileID,
      })
      .then((res) => {
        const tempFilePath = res?.tempFilePath || '';
        if (!tempFilePath) {
          wx.showToast({
            title: '视频地址获取失败',
            icon: 'none',
          });
          return;
        }
        wx.previewMedia({
          sources: [
            {
              url: tempFilePath,
              type: 'video',
            },
          ],
        });
      })
      .catch(() => {
        wx.showToast({
          title: '视频加载失败',
          icon: 'none',
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const data = await fetchSampleDetail(id);
      this.setData({
        title: data.title || this.data.title,
        type: data.type || this.data.type,
        showAntibiotics: data.type === 'gut' || data.type === 'inflammation',
        form: {
          sampleNo: data.sampleNo || '',
          name: data.name || '',
          age: data.age || '',
          gender: data.gender || '',
          phone: data.phone || '',
          city: data.city || '',
          height: data.height || '',
          weight: data.weight || '',
          antibiotics: data.antibiotics || '',
          channel: data.channel || '',
          remark: data.remark || '',
          bowelFrequency: data.extraInfo?.bowelFrequency || '',
          stoolShape: data.extraInfo?.stoolShape || '',
          digestiveSymptoms: data.extraInfo?.digestiveSymptoms || '',
          menstrualStatus: data.extraInfo?.menstrualStatus || '',
          pregnant: data.extraInfo?.pregnant || '',
          vaginalMedication: data.extraInfo?.vaginalMedication || '',
          vaginalSymptoms: data.extraInfo?.vaginalSymptoms || '',
          inflammationSymptoms: data.extraInfo?.inflammationSymptoms || '',
          inflammationMedication: data.extraInfo?.inflammationMedication || '',
        },
      });
      wx.setNavigationBarTitle({ title: data.title || this.data.title });
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  async onSubmit() {
    if (this.data.submitting) {
      return;
    }
    const { form, showAntibiotics, title, type, recordId } = this.data;
    const requiredKeys = [
      'sampleNo',
      'name',
      'age',
      'gender',
      'phone',
      'city',
      'height',
      'weight',
      'channel',
      'remark',
    ];
    const typeRequiredKeys = {
      gut: ['bowelFrequency', 'stoolShape', 'digestiveSymptoms'],
      vaginal: ['menstrualStatus', 'pregnant', 'vaginalMedication', 'vaginalSymptoms'],
      inflammation: ['inflammationSymptoms', 'inflammationMedication'],
    };
    requiredKeys.push(...(typeRequiredKeys[type] || []));
    if (showAntibiotics) {
      requiredKeys.push('antibiotics');
    }
    const emptyKey = requiredKeys.find((key) => {
      const value = form[key];
      return value === '' || value === null || value === undefined;
    });
    if (emptyKey) {
      wx.showToast({
        title: '请完整填写所有必填项',
        icon: 'none',
      });
      return;
    }

    const payload = {
      title,
      type,
      sampleNo: String(form.sampleNo).trim(),
      name: String(form.name).trim(),
      age: form.age,
      gender: form.gender,
      phone: String(form.phone).trim(),
      city: String(form.city).trim(),
      height: form.height,
      weight: form.weight,
      antibiotics: showAntibiotics ? form.antibiotics : '',
      channel: String(form.channel).trim(),
      remark: String(form.remark).trim(),
      extraInfo: {
        bowelFrequency: String(form.bowelFrequency || '').trim(),
        stoolShape: String(form.stoolShape || '').trim(),
        digestiveSymptoms: String(form.digestiveSymptoms || '').trim(),
        menstrualStatus: String(form.menstrualStatus || '').trim(),
        pregnant: String(form.pregnant || '').trim(),
        vaginalMedication: String(form.vaginalMedication || '').trim(),
        vaginalSymptoms: String(form.vaginalSymptoms || '').trim(),
        inflammationSymptoms: String(form.inflammationSymptoms || '').trim(),
        inflammationMedication: String(form.inflammationMedication || '').trim(),
      },
    };

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中', mask: true });
    try {
      await saveSample(payload, recordId);
      wx.showToast({
        title: '保存成功',
        icon: 'success',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },
});
