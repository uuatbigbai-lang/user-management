// import QRCode from 'qrcode';
// pages/user/qrcode/generator/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qrCodeData: '', // 二维码数据
    qrCodeUrl: '', // 二维码图片URL
    isLoading: false,
    homePageUrl: '' // 首页URL
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.generateQRCode();
  },

  /**
   * 生成二维码
   */
  async generateQRCode() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'genQRcode',
        data: {
          scene: 'register',
          page: 'pages/home/home'
        }
      });

      if (res.result.success && res.result.base64) {
        // 直接使用base64数据
        await this.drawQRCodeFromBase64(res.result.base64);
      } else {
        console.error('生成二维码失败:', res.result.error);
      }
    } catch (error) {
      console.error('调用云函数失败:', error);
    }





  },

  /**
   * 创建二维码
   */
  drawQRCodeFromBase64(base64Data) {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery()
      query.select('#myCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            reject(new Error('Canvas 未找到'))
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getSystemInfoSync().pixelRatio

          // 设置 Canvas 实际尺寸
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          // 创建图片
          const image = canvas.createImage()

          image.onload = () => {
            try {
              // 清除画布
              ctx.clearRect(0, 0, 300, 300)

              // 绘制白色背景
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, 300, 300)

              // 绘制二维码（居中）
              const qrSize = 200
              const qrX = (300 - qrSize) / 2
              const qrY = 50
              ctx.drawImage(image, qrX, qrY, qrSize, qrSize)

              console.log('二维码绘制完成')
              resolve()
            } catch (err) {
              reject(err)
            }
          }

          image.onerror = (err) => {
            console.error('图片加载失败:', err)
            reject(err)
          }

          image.src = base64Data
          this.setData({
            qrCodeUrl: base64Data
          })
        })
    });
  },


  /**
   * 保存二维码到相册
   */
  // 保存 Base64 格式的图片到相册
  saveBase64ToPhotosAlbum() {
    const base64Data = this.data.qrCodeUrl;
    return new Promise((resolve, reject) => {
      if (!base64Data) {
        reject(new Error('图片数据不能为空'))
        return
      }

      // 移除 base64 前缀
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const filePath = `${wx.env.USER_DATA_PATH}/qrcode_${Date.now()}.png`

      // 将 base64 写入临时文件
      wx.getFileSystemManager().writeFile({
        filePath,
        data: base64,
        encoding: 'base64',
        success: () => {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath,
            success: () => {
              // 清理临时文件
              wx.getFileSystemManager().unlink({ filePath })
              resolve()
            },
            fail: (err) => {
              // 清理临时文件
              wx.getFileSystemManager().unlink({ filePath })
              reject(err)
            }
          })
        },
        fail: reject
      })
    })
  },

  /**
   * 分享二维码
   */
  shareQRCode() {
    if (!this.data.qrCodeUrl) {
      wx.showToast({
        title: '二维码未生成',
        icon: 'error'
      });
      return;
    }

    // 这里可以实现分享功能
    wx.showActionSheet({
      itemList: ['保存到相册', '发送给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.saveQRCode();
        } else if (res.tapIndex === 1) {
          // 可以实现发送给朋友的功能
          wx.showToast({
            title: '请长按二维码分享',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.generateQRCode();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '扫码进入小程序首页',
      path: 'pages/home/home',
      imageUrl: this.data.qrCodeUrl
    };
  }
});