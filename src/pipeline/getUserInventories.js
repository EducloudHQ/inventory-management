import { util } from '@aws-appsync/utils'

export function request(ctx) {
	const { id } = ctx.args;
	let query = { id: { eq: id } };
	query = JSON.parse(util.transform.toDynamoDBConditionExpression(query));
	return { operation: "Query", query };
  }  

export function response(ctx) {
	let {items} = ctx.result
	const user = items.find((item) => item.typeName === "User");
	
	// if no user is found, return null
	if (!user) {
	  console.log("could not find user in reponse items");
	  return {
		items
	  };
	}

	const inventories = {}
	const invent_items = [];
	items.forEach((item) => {
		switch (item.typeName) {
		  case "Inventory":
			inventories[item.sk] = { ...item, id: item.sk, items: [] };
			break;
		  case "Item":
			invent_items.push({ ...item, id: item.sk });
			break;
		  default:
			break;
		}
	  });

	  invent_items.forEach((item) => inventories[item.inventoryId].items.push(item));
	  user.inventory = Object.values(inventories);
	  return user
}