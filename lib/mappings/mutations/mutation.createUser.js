
import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  const id = util.autoId();
  const key = {
    PK: `USER#${id}`,
    SK: `USER#${id}`,
  };
  const item = { ...ctx.args.input };
  item.typeName = "User";
  item.GSI1PK = `USER`;
  item.GSISK = `USER#${id}`;
  item.createdAt = util.time.nowEpochMilliSeconds();
  item.updatedAt = util.time.nowEpochMilliSeconds();
  return put({
    key: key,
    item: item,
  });
}

export function response(ctx) {
  return {...ctx.result, id: ctx.result.PK.substring(5)+"#"+ctx.result.SK.substring(5)};
}
