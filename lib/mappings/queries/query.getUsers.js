import * as ddb from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  console.log("CONTEXT::   ", ctx);
  const { limit, nextToken } = ctx.args;
  const query = {
    GSI1PK: { eq: "USER" },
    GSI1SK:{begins_with: "USER#"}
  };
  return ddb.query({
    query,
    index: "listUsersAndInventoryItems",
    limit,
    nextToken,
  });
}

export function response(ctx) {
  console.log(ctx.result.items);
  return ctx.result;
}
