import { requestBackend } from '../../config/index';

export function fetchSamples(params = {}) {
  const { page = 1, pageSize = 10, type = '' } = params;
  return requestBackend({
    path: `/api/samples?page=${page}&pageSize=${pageSize}&type=${encodeURIComponent(type)}`,
  }).then((res) => {
    const result = res.data || {};
    if (result.code === 0) {
      return {
        data: result.data || [],
        total: result.total || 0,
      };
    }
    throw new Error(result.message || '加载失败');
  });
}

export function fetchSampleDetail(id) {
  return requestBackend({
    path: `/api/samples/${id}`,
  }).then((res) => {
    const result = res.data || {};
    if (result.code === 0) {
      return result.data;
    }
    throw new Error(result.message || '加载失败');
  });
}

export function saveSample(payload, id = '') {
  return requestBackend({
    path: id ? `/api/samples/${id}` : '/api/samples',
    method: id ? 'PUT' : 'POST',
    data: payload,
  }).then((res) => {
    const result = res.data || {};
    if (result.code === 0) {
      return result.data;
    }
    throw new Error(result.message || '保存失败');
  });
}
