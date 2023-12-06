import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { join } from "path";
// import { bundleAppSyncResolver } from "./utils/helpers";

interface InventoryAppsyncFuncStackProps extends cdk.StackProps {
  inventoryTable: dynamodb.Table;
  api: appsync.GraphqlApi;
}
export class InventoryAppsyncFuncStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: InventoryAppsyncFuncStackProps
  ) {
    super(scope, id, props);

    const InventoryDS = props.api.addDynamoDbDataSource(
      "inventory_data_source",
      props.inventoryTable
    );

    const createUser = new appsync.AppsyncFunction(this, "create-user", {
      name: "createUser",
      api: props.api,
      dataSource: InventoryDS,
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/mutations/mutation.createUser.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const createInventoryItem = new appsync.AppsyncFunction(
      this,
      "create-inventory-item",
      {
        name: "createInventoryItem",
        api: props.api,
        dataSource: InventoryDS,
        code: appsync.Code.fromAsset(
          join(__dirname, "./mappings/mutations/mutation.createItem.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    const getUserInventoryItems = new appsync.AppsyncFunction(
      this,
      "_getUserInventoryItems",
      {
        name: "getUserInventoryItems",
        api: props.api,
        dataSource: InventoryDS,
        code: appsync.Code.fromAsset(
          join(__dirname, "mappings/queries/query.getUserItems.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    const getUsers = new appsync.AppsyncFunction(this, "_getUsers", {
      name: "getUsers",
      api: props.api,
      dataSource: InventoryDS,
      code: appsync.Code.fromAsset(
        join(__dirname, "mappings/queries/query.getUsers.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const getItems = new appsync.AppsyncFunction(this, "get-items", {
      name: "getItems",
      api: props.api,
      dataSource: InventoryDS,
      code: appsync.Code.fromAsset(
        join(__dirname, "mappings/queries/query.getItems.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    new appsync.Resolver(this, "pipeline-resolver-get-items", {
      api: props.api,
      typeName: "Query",
      fieldName: "getInventoryItems",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getItems],
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
    });

    new appsync.Resolver(this, "getUserItemsRes", {
      api: props.api,
      typeName: "Query",
      fieldName: "getUserInventoryItems",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getUserInventoryItems],
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
    });

    new appsync.Resolver(this, "pipeline-resolver-get-users", {
      api: props.api,
      typeName: "Query",
      fieldName: "getUsers",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getUsers],
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
    });

    new appsync.Resolver(this, "pipeline-resolver-create-item", {
      api: props.api,
      typeName: "Mutation",
      fieldName: "createInventoryItem",
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createInventoryItem],
    });

    new appsync.Resolver(this, "pipeline-resolver-create-posts", {
      api: props.api,
      typeName: "Mutation",
      fieldName: "createUser",
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createUser],
    });
  }
}
