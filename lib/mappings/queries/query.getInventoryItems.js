export function request(ctx) {
  const { limit, nextToken } = ctx.args;
  const query = {
    GSI1PK: { eq: "ITEM" },
    GSI1SK: {begins_with: "ITEM#"}
  };

  return {
    operation: "Query",
    query,
    index: "ListUsersAndInventoryItems",
    limit,
    nextToken,
  };
}

export function response(ctx) {
  return ctx.result;
}
