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
    },
  },

  async onLoad(query) {
    const title = query?.title ? decodeURIComponent(query.title) : '信息登记';
    const type = query?.type || '';
    const showAntibiotics = type === 'inflammation';
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
      const res = await wx.cloud.callFunction({
        name: 'getSimpleList',
        data: {
          action: 'detail',
          id,
        },
      });
      const result = res?.result || {};
      if (result.code === 0 && result.data) {
        const data = result.data;
        this.setData({
          title: data.title || this.data.title,
          type: data.type || this.data.type,
          showAntibiotics: data.type === 'inflammation',
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
          },
        });
        wx.setNavigationBarTitle({ title: data.title || this.data.title });
        return;
      }
      wx.showToast({
        title: result.message || '加载失败',
        icon: 'none',
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败，请稍后重试',
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
    };

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中', mask: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'addSimple',
        data: recordId
          ? {
              action: 'update',
              id: recordId,
              ...payload,
            }
          : payload,
      });
      const result = res?.result || {};
      if (result.code === 0) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });
        this.setData({ submitting: false });
        return;
      }
      wx.showToast({
        title: result.message || '保存失败',
        icon: 'none',
      });
    } catch (error) {
      wx.showToast({
        title: '保存失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },
});
