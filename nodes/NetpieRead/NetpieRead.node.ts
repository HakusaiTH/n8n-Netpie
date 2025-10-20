// nodes/NetpieRead/NetpieRead.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
  IHttpRequestOptions,
  IHttpRequestMethods,
} from 'n8n-workflow';

export class NetpieRead implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NETPIE Read',
    name: 'netpieRead',
    icon: 'file:netpie.svg',
    group: ['transform'],
    version: 1,
    description: 'Read shadow data from NETPIE',
    defaults: { name: 'NETPIE Read' },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [{ name: 'netpieApi', required: true }],
    properties: [
      // UX: Resource + Operation
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        default: 'shadow',
        noDataExpression: true,
        options: [{ name: 'Shadow', value: 'shadow' }],
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'get',
        noDataExpression: true,
        options: [
          {
            name: 'Get',
            value: 'get',
            action: 'Get shadow value',
            description: 'Retrieve a value from device shadow',
          },
        ],
        displayOptions: { show: { resource: ['shadow'] } },
      },

      // Params
      {
        displayName: 'Alias',
        name: 'alias',
        type: 'string',
        default: 'led',
        placeholder: 'e.g. led',
        description: 'Shadow alias to retrieve',
        displayOptions: { show: { resource: ['shadow'], operation: ['get'] } },
        required: true,
      },

      // Simplify
      {
        displayName: 'Simplify',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description: 'Whether to return a simplified version of the response instead of the raw data',
        displayOptions: { show: { resource: ['shadow'], operation: ['get'] } },
      },

      // Options
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        default: {},
        placeholder: 'Add option',
        options: [
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 15000,
            description: 'Request timeout in milliseconds',
          },
        ],
        displayOptions: { show: { resource: ['shadow'], operation: ['get'] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const base = 'https://api.netpie.io/v2/device';

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      try {
        if (resource === 'shadow' && operation === 'get') {
          const alias = (this.getNodeParameter('alias', i) as string).trim();
          const simplify = this.getNodeParameter('simplify', i) as boolean;
          const { timeout = 15000 } = (this.getNodeParameter('options', i, {}) as { timeout?: number });

          const req: IHttpRequestOptions = {
            method: 'GET' as IHttpRequestMethods,
            url: `${base}/shadow/data`,
            qs: { alias },
            json: true,
            timeout,
          };

          const res = await this.helpers.httpRequestWithAuthentication.call(this, 'netpieApi', req);

          const out = simplify
            ? {
                alias,
                value:
                  res?.value ??
                  res?.[alias] ??
                  (typeof res === 'object' && res !== null ? res : String(res)),
              }
            : res;

          returnData.push({ json: out, pairedItem: { item: i } });
        } else {
          throw new NodeOperationError(this.getNode(), 'Unsupported resource or operation', {
            itemIndex: i,
          });
        }
      } catch (e: any) {
        const statusCode = e?.statusCode ?? e?.response?.statusCode;
        const rawBody =
          (e?.response?.body && typeof e.response.body === 'string') ? e.response.body : undefined;

        const hint =
          `Request to get shadow value could not be completed [Item ${i + 1}] ` +
          `Check that 'Alias' exists and your credentials are valid`;

        const message = rawBody ?? e?.message ?? hint;

        if (this.continueOnFail()) {
          returnData.push({ json: { message, statusCode, hint }, pairedItem: { item: i } });
          continue;
        }
        throw new NodeOperationError(this.getNode(), `${hint}\n${message}`, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
