import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class NetpieApi implements ICredentialType {
  name = 'netpieApi';
  displayName = 'NETPIE API';
  documentationUrl = 'https://netpie.io/guide';

  properties: INodeProperties[] = [
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      description: 'Device client ID from NETPIE',
      required: true,
    },
    {
      displayName: 'Token',
      name: 'token',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Device token from NETPIE',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        // Authorization: Device <clientId>:<token>
        Authorization: '={{ "Device " + $credentials.clientId + ":" + $credentials.token }}',
        Accept: 'application/json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.netpie.io/v2/device',
      url: '/shadow/data',
      method: 'GET',
    },
  };
}
