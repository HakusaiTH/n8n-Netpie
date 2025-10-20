// nodes/NetpieSend/NetpieSend.node.ts
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

export class NetpieSend implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NETPIE Send',
    name: 'netpieSend',
    icon: 'file:netpie.svg',
    group: ['transform'],
    version: 1,
    description: 'Send MQTT message to NETPIE',
    defaults: { name: 'NETPIE Send' },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [{ name: 'netpieApi', required: true }],
    properties: [
      // UX: Resource + Operation
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        default: 'message',
        noDataExpression: true,
        options: [{ name: 'Message', value: 'message' }],
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'publish',
        noDataExpression: true,
        options: [
          {
            name: 'Publish',
            value: 'publish',
            action: 'Publish message',
            description: 'Publish a message to a topic',
          },
        ],
        displayOptions: { show: { resource: ['message'] } },
      },

      // Params
      {
        displayName: 'Topic',
        name: 'topic',
        type: 'string',
        default: 'led',
        placeholder: 'e.g. led',
        description: 'Topic to publish to',
        displayOptions: { show: { resource: ['message'], operation: ['publish'] } },
        required: true,
      },
      {
        displayName: 'Payload',
        name: 'payload',
        type: 'string',
        default: 'ledon',
        placeholder: 'e.g. ledon',
        description: 'Message payload to send',
        displayOptions: { show: { resource: ['message'], operation: ['publish'] } },
        required: true,
      },

      // Simplify
      {
        displayName: 'Simplify',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description: 'Whether to return a simplified version of the response instead of the raw data',
        displayOptions: { show: { resource: ['message'], operation: ['publish'] } },
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
          {
            displayName: 'Content Type',
            name: 'contentType',
            type: 'options',
            default: 'text/plain',
            options: [
              { name: 'Text', value: 'text/plain' },
              { name: 'JSON', value: 'application/json' },
            ],
            description: 'Content type of the payload',
          },
        ],
        displayOptions: { show: { resource: ['message'], operation: ['publish'] } },
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
        if (resource === 'message' && operation === 'publish') {
          const topic = (this.getNodeParameter('topic', i) as string).trim();
          const payload = this.getNodeParameter('payload', i) as string;
          const simplify = this.getNodeParameter('simplify', i) as boolean;
          const { timeout = 15000, contentType = 'text/plain' } =
            (this.getNodeParameter('options', i, {}) as { timeout?: number; contentType?: string });

          const req: IHttpRequestOptions = {
            method: 'PUT' as IHttpRequestMethods,
            url: `${base}/message`,
            qs: { topic },
            body: contentType === 'application/json' ? JSON.parse(payload) : payload,
            headers: { 'Content-Type': contentType },
            json: contentType === 'application/json',
            timeout,
          };

          const res = await this.helpers.httpRequestWithAuthentication.call(this, 'netpieApi', req);

          const out = simplify
            ? { published: true, topic, result: res?.result ?? 'ok' }
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
          `Request to publish message could not be completed [Item ${i + 1}] ` +
          `Check that 'Topic' is valid and your credentials are correct`;

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
