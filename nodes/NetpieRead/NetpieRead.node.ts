// nodes/NetpieRead/NetpieRead.node.ts

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType, // <--- ต้องเพิ่มอันนี้!
	NodeOperationError,
} from 'n8n-workflow';

export class NetpieRead implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NETPIE Read',
		name: 'netpieRead',
		icon: 'file:netpie.svg', // ✅ ตรงนี้สำคัญ
		group: ['transform'],
		version: 1,
		description: 'Read shadow data from NETPIE',
		defaults: { name: 'NETPIE Read' },
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [{ name: 'netpieApi', required: true }],
		properties: [
			{
				displayName: 'Alias',
				name: 'alias',
				type: 'string',
				default: 'led',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('netpieApi') as { clientId: string; token: string };

		for (let i = 0; i < items.length; i++) {
			try {
				const alias = this.getNodeParameter('alias', i) as string;

				const res = await this.helpers.httpRequest.call(this, {
					method: 'GET',
					url: 'https://api.netpie.io/v2/device/shadow/data',
					qs: { alias },
					headers: {
						Authorization: `Device ${credentials.clientId}:${credentials.token}`,
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
