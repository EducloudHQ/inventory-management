import { util } from "@aws-appsync/utils";
export function request() {
  const query = JSON.parse(
    util.transform.toDynamoDBConditionExpression({
      GSI1PK: { eq: "ORDER" },
    })
  );
  return {
    operation: "Query",
    query,
    index: "GSI1",
  };
}

export function response(ctx) {
  return ctx.result.items;
}