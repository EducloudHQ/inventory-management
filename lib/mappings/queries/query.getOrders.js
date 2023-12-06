import { util } from "@aws-appsync/utils";
export function request() {
  const query = {
      GSI1PK: { eq: "ORDER" },
      GSI1SK: {begins_with: "ORDER#"}
    }
  return {
    operation: "Query",
    query,
    index: "listOrders",
  };
}

export function response(ctx) {
  const items = ctx.result.items
  return {...items, id: items.PK.substring(4)+"#"+items.SK.substring(4)};
}
