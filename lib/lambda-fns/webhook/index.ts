/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult, Context } from "aws-lambda";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME as string;

module.exports.lambdaHandler = async (
  event: any
): Promise<APIGatewayProxyResult> => {

  console.log("Lambda invocation event", { event });
  const body = JSON.parse(event.body);

  console.log(body.data.object.receipt_email);

  const email = body.data.object.receipt_email;
  const user: any = docClient.query({
    TableName: tableName,
    KeyConditionExpression: `GSI1PK = :gsi1pk and GSI1SK = gsi1sk `,
    ProjectionExpression: "PK, SK",
    ExpressionAttributeValues: {
      "gsi1pk": "USER",
      "gsi1sk": `USER#${email}`,
      ":email": email,
    },
  });
  console.log("user:::  ", user);

  const paymentStatus: any = docClient.update({
    TableName: tableName,
    Key: {
      PK: user?.Items[0].PK
    },
    ConditionExpression: "begins_with(SK, :sk) and orderStatus = :oldOrderStatus",
    UpdateExpression: "set orderStatus = :newOrderStatus",
    ExpressionAttributeValues: {
      ":oldOrderStatus": "ORDERED",
      ":newOrderStatus": "PAYED",
      ":sk": "ORDER#",
    },
  });
  return paymentStatus;
};
