import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  const id = util.autoId();
  const key = {
    PK: "USER#" + ctx.args.input.userId,
    SK: "ITEM#" + id,
  };
  const item = { ...ctx.args.input };
  item.GSI1PK = "ITEM";
  item.GSI1SK = "ITEM#" + id;
  item.typeName = "Item";
  item.createdAt = util.time.nowEpochMilliSeconds();
  item.updatedAt = util.time.nowEpochMilliSeconds();
  return put({
    key,
    item,
  });
}

export function response(ctx) {
  return {...ctx.result, id:ctx.result.PK.substring(4)+"#"+ctx.result.SK.substring(4)};
}
