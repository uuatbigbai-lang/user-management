import { resp } from '../after-service-list/api';
import dayjs from 'dayjs';
import { config, requestBackend } from '../../../config/index';
import { mockIp, mockReqId } from '../../../utils/mock';

export const formatTime = (date, template) => dayjs(date).format(template);

export function getRightsDetail({ rightsNo }) {
  if (!config.useMock) {
    return requestBackend({
      path: `/api/after-sale/detail/${rightsNo}`,
    }).then((res) => {
      const result = res.data || {};
      if (result.code !== 0) throw new Error(result.message || '获取售后详情失败');
      return { data: result.data };
    });
  }

  const _resq = {
    data: {},
    code: 'Success',
    msg: null,
    requestId: mockReqId(),
    clientIp: mockIp(),
    rt: 79,
    success: true,
  };
  _resq.data =
    resp.data.dataList.filter((item) => item.rights.rightsNo === rightsNo) ||
    {};
  return Promise.resolve(_resq);
}

export function cancelRights(params = {}) {
  if (!config.useMock) {
    return requestBackend({
      path: '/api/after-sale/cancel',
      method: 'POST',
      data: params,
    }).then((res) => {
      const result = res.data || {};
      if (result.code !== 0) throw new Error(result.message || '撤销售后失败');
      return { data: result.data };
    });
  }

  const _resq = {
    data: {},
    code: 'Success',
    msg: null,
    requestId: mockReqId(),
    clientIp: mockIp(),
    rt: 79,
    success: true,
  };
  return Promise.resolve(_resq);
}
