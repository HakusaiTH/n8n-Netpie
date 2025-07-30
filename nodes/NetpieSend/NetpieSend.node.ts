// nodes/NetpieSend/NetpieSend.node.ts

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType, // <--- ต้องเพิ่มอันนี้!
	NodeOperationError,
} from 'n8n-workflow';


export class NetpieSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NETPIE Send',
		name: 'netpieSend',
		icon: 'file:netpie.svg', // ✅ ตรงนี้สำคัญ
		group: ['transform'],
		version: 1,
		description: 'Send MQTT message to NETPIE',
		defaults: { name: 'NETPIE Send' },
		inputs: [NodeConnectionType.Main], // ✅ แก้จาก 'main'
		outputs: [NodeConnectionType.Main], // ✅ แก้จาก 'main'
		credentials: [{ name: 'netpieApi', required: true }],
		properties: [
			{
				displayName: 'Topic',
				name: 'topic',
				type: 'string',
				default: 'led',
			},
			{
				displayName: 'Payload',
				name: 'payload',
				type: 'string',
				default: 'ledon',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('netpieApi') as { clientId: string; token: string };

		for (let i = 0; i < items.length; i++) {
			try {
				const topic = this.getNodeParameter('topic', i) as string;
				const payload = this.getNodeParameter('payload', i) as string;

				const res = await this.helpers.httpRequest.call(this, {
					method: 'PUT',
					url: 'https://api.netpie.io/v2/device/message',
					qs: { topic },
					body: payload,
					headers: {
						Authorization: `Device ${credentials.clientId}:${credentials.token}`,
						'Content-Type': 'text/plain',
					},
				});

				returnData.push({ json: res });

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
