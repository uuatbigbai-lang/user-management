import { mockIp, mockReqId } from '../../../utils/mock';
import { config, requestBackend } from '../../../config/index';

export function create(params) {
  if (!config.useMock) {
    return saveTrackingNo(params);
  }

  const _resq = {
    data: null,
    code: 'Success',
    msg: null,
    requestId: mockReqId(),
    clientIp: mockIp(),
    rt: 79,
    success: true,
  };
  return Promise.resolve(_resq);
}

export function update(params) {
  if (!config.useMock) {
    return saveTrackingNo(params);
  }

  const _resq = {
    data: null,
    code: 'Success',
    msg: null,
    requestId: mockReqId(),
    clientIp: mockIp(),
    rt: 79,
    success: true,
  };
  return Promise.resolve(_resq);
}

function saveTrackingNo(params) {
  return requestBackend({
    path: '/api/after-sale/logistics',
    method: 'POST',
    data: params,
  }).then((res) => {
    const result = res.data || {};
    if (result.code !== 0) throw new Error(result.message || '保存退货物流失败');
    return { data: result.data };
  });
}

export function getDeliverCompanyList() {
  const _resq = {
    data: [
      {
        name: '中通快递',
        code: '0001',
      },
      {
        name: '申通快递',
        code: '0002',
      },
      {
        name: '圆通快递',
        code: '0003',
      },
      {
        name: '顺丰快递',
        code: '0004',
      },
      {
        name: '百世快递',
        code: '0005',
      },
      {
        name: '韵达快递',
        code: '0006',
      },
      {
        name: '邮政快递',
        code: '0007',
      },
      {
        name: '丰网快递',
        code: '0008',
      },
      {
        name: '顺丰直邮',
        code: '0009',
      },
    ],
  };
  return Promise.resolve(_resq);
}
