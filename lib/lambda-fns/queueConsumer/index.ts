import { SQSEvent, SQSRecord, Context, SQSBatchResponse } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
// import { logger, metrics, tracer } from "../utils";
import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from "@aws-lambda-powertools/batch";

const ddbClient = new DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME as string;
const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise<void> => {
  const payload = record.body;
  if (payload) {
    const order = JSON.parse(payload);

    console.log("Processed item", { order });
    const userPK = order.PK.S;
    for (const item of order.orderItems.L) {
      console.log(item);
      const itemSK = item.M.SK.S;
      const params = {
        TableName: tableName,
        Key: {
          PK: `${userPK}`,
          SK: `${itemSK}`,
        },
        UpdateExpression:
          "set cartProductStatus = :status, updatedAt = :updated",
        ExpressionAttributeValues: {
          ":status": "ORDERED",
          ":updated": Date.now().toString(),
        },
        ReturnValues: "UPDATED_NEW",
      };
      try {
        const res = await ddbClient.update(params).promise();
        console.log("Response", { res });
      } catch (err: unknown) {
        // logger.info("Error: ", { err });
      }
    }
  }
};

export const main = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, recordHandler, processor, {
    context,
  });
};