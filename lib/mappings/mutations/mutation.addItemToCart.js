import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  const key = {
    PK: `USER#${ctx.args.input.userId}`,
    SK: `CART#${ctx.args.input.item}`,
  };

  const item = { ...ctx.args.input };
  item.cartProductStatus = "PENDING";
  item.createdAt = util.time.nowEpochMilliSeconds();
  return put({
    key,
    item,
  });
}

export function response(ctx) {
  return {...ctx.result, id: ctx.result.PK.substring(5)+"#"+ctx.result.SK.substring(5)};
}
