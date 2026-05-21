const isCloudFileId = (url) => typeof url === 'string' && url.startsWith('cloud://');

const unique = (list) => [...new Set(list.filter(isCloudFileId))];
const mapUrlList = (list, urlMap) => (Array.isArray(list) ? list.map((url) => mapUrl(url, urlMap)) : []);

export const resolveCloudFileUrls = (fileIDs = []) => {
  const cloudFileIDs = unique(fileIDs);
  console.log('[cloudImage] 待转换 fileID:', cloudFileIDs);
  if (!cloudFileIDs.length) return Promise.resolve({});

  if (!wx.cloud || !wx.cloud.getTempFileURL) {
    console.error('[cloudImage] wx.cloud.getTempFileURL 不可用，请检查 wx.cloud.init 是否执行');
    return Promise.resolve({});
  }

  return wx.cloud.getTempFileURL({ fileList: cloudFileIDs }).then((res) => {
    console.log('[cloudImage] getTempFileURL 返回:', res);
    return (res.fileList || []).reduce((urlMap, item) => {
      if (item.fileID && item.tempFileURL) {
        urlMap[item.fileID] = item.tempFileURL;
      } else if (item.fileID) {
        console.warn('[cloudImage] 云存储图片临时链接获取失败:', item.fileID, item.status, item.errMsg);
      }
      return urlMap;
    }, {});
  }).catch((err) => {
    console.error('[cloudImage] getTempFileURL 调用失败:', err);
    return {};
  });
};

export const resolveCloudFileLocalPaths = (fileIDs = []) => {
  const cloudFileIDs = unique(fileIDs);
  console.log('[cloudImage] 待下载 fileID:', cloudFileIDs);
  if (!cloudFileIDs.length) return Promise.resolve({});

  if (!wx.cloud || !wx.cloud.downloadFile) {
    console.error('[cloudImage] wx.cloud.downloadFile 不可用，请检查 wx.cloud.init 是否执行');
    return Promise.resolve({});
  }

  return Promise.all(cloudFileIDs.map((fileID) => (
    wx.cloud.downloadFile({ fileID }).then((res) => ({
      fileID,
      tempFilePath: res.tempFilePath,
    })).catch((err) => {
      console.error('[cloudImage] 云存储图片下载失败:', fileID, err);
      return { fileID, tempFilePath: '' };
    })
  ))).then((fileList) => fileList.reduce((urlMap, item) => {
    if (item.fileID && item.tempFilePath) {
      urlMap[item.fileID] = item.tempFilePath;
    }
    return urlMap;
  }, {}));
};

const mapUrl = (url, urlMap) => {
  if (!isCloudFileId(url)) return url;
  if (urlMap[url]) return urlMap[url];

  console.error('[cloudImage] fileID 未成功转换，已阻止原始 cloud:// 进入 image 组件:', url);
  return '';
};

export const resolveProductImageUrls = (product) => {
  if (!product) return Promise.resolve(product);

  const skuList = Array.isArray(product.skuList) ? product.skuList : [];
  const fileIDs = [
    product.thumb,
    product.primaryImage,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.desc) ? product.desc : []),
    ...skuList.map((sku) => sku.skuImage),
  ];

  return resolveCloudFileUrls(fileIDs).then((urlMap) => {
    const resolvedProduct = {
      ...product,
      thumb: mapUrl(product.thumb, urlMap),
      primaryImage: mapUrl(product.primaryImage, urlMap),
      images: mapUrlList(product.images, urlMap).filter(Boolean),
      desc: mapUrlList(product.desc, urlMap).filter(Boolean),
      skuList: skuList.map((sku) => ({
        ...sku,
        skuImage: mapUrl(sku.skuImage, urlMap),
      })),
    };
    console.log('[cloudImage] 商品详情图片转换后:', resolvedProduct);
    return resolvedProduct;
  });
};

export const resolveProductsImageUrls = (products = []) => {
  const productList = Array.isArray(products) ? products : [];
  const fileIDs = productList.reduce((ids, product) => ids.concat([
    product.thumb,
    product.primaryImage,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.desc) ? product.desc : []),
    ...(Array.isArray(product.skuList) ? product.skuList.map((sku) => sku.skuImage) : []),
  ]), []);

  return resolveCloudFileUrls(fileIDs).then((urlMap) => {
    const resolvedProducts = productList.map((product) => ({
      ...product,
      thumb: mapUrl(product.thumb, urlMap),
      primaryImage: mapUrl(product.primaryImage, urlMap),
      images: mapUrlList(product.images, urlMap).filter(Boolean),
      desc: mapUrlList(product.desc, urlMap).filter(Boolean),
      skuList: Array.isArray(product.skuList)
        ? product.skuList.map((sku) => ({
          ...sku,
          skuImage: mapUrl(sku.skuImage, urlMap),
        }))
        : product.skuList,
    }));
    console.log('[cloudImage] 商品列表图片转换后:', resolvedProducts);
    return resolvedProducts;
  });
};
