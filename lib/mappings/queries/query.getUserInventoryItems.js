/* eslint-disable no-case-declarations */
import * as ddb from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  const { id, limit, nextToken } = ctx.args;
  const userId = id.split("#")[0]
  let query = { 
    PK: { eq: `USER#${userId}` }
 };
  return ddb.query({
    query,
    limit,
    nextToken,
  });
}

export function response(ctx) {
  console.log("ITEMS:::: ", ctx.result.items);
  const items = ctx.result.items;
  const user = items.find((item) => item.typeName === "User");
  const inventoryItems = {};
  // if no user is found, return null
  if (!user) {
    console.log("could not find user in reponse items");
    return null;
  }
  items.forEach((item) => {
    switch (item.typeName) {
      case "Item":
        const itemPk = item.PK.substring(5)
        const itemSk = item.SK.substring(5)
        inventoryItems[item.SK] = { ...item, id: itemPk.concat("#", itemSk) };
        break;
      default:
        break;
    }
  });
  const userPk = user.PK.substring(5)
  const userSk = user.SK.substring(5)
  user.id = userPk.concat("#", userSk)
  user.items = Object.values(inventoryItems);
  console.log("USER:::: ", user);
  return user;
}
