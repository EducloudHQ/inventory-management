import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { join } from "path";
import { SqsDestination } from "aws-cdk-lib/aws-lambda-destinations";
import { Tracing } from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import path = require("path");
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as SQS from "aws-cdk-lib/aws-sqs";
import {
  DynamoEventSource,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";

interface OrderAppsyncFuncStackProps extends cdk.StackProps {
  ordersTable: dynamodb.Table;
  api: appsync.GraphqlApi;
  queue: SQS.Queue;
}
export class OrderAppsyncFuncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OrderAppsyncFuncStackProps) {
    super(scope, id, props);

    const OrdersDS = props.api.addDynamoDbDataSource(
      "Order_data_source",
      props.ordersTable
    );

    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "PowertoolsLayer",
      `arn:aws:lambda:${
        cdk.Stack.of(this).region
      }:094274105915:layer:AWSLambdaPowertoolsTypeScript:18`
    );

    const queueConsumer = new lambda.Function(this, "consumerFunction", {
      handler: "index.main",
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "lambda-fns/queueConsumer")
      ),
      environment: {
        TABLE_NAME: props.ordersTable.tableName,
        QUEUE_NAME: props.queue.queueName,
        QUEUE_URL: props.queue.queueUrl,
      },
      tracing: Tracing.ACTIVE,
      layers: [powertoolsLayer],
      timeout: cdk.Duration.seconds(30),
    });

    const process_order = new lambda.Function(this, "processOrder", {
      handler: "processOrder.main",
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda-fns")),
      environment: {
        TABLE_NAME: props.ordersTable.tableName,
        QUEUE_NAME: props.queue.queueName,
        QUEUE_URL: props.queue.queueUrl,
      },
      layers: [powertoolsLayer],
      tracing: Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      onSuccess: new SqsDestination(props.queue),
    });
    process_order.addEventSource(
      new DynamoEventSource(props.ordersTable, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    props.ordersTable.grantStreamRead(process_order);
    props.ordersTable.grantReadWriteData(process_order);

    queueConsumer.addEventSource(new SqsEventSource(props.queue));

    props.queue.grantConsumeMessages(queueConsumer);
    props.ordersTable.grantReadWriteData(queueConsumer);

    const streamConsumerRole = new iam.Role(this, "streamConsumerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    streamConsumerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          "arn:aws:logs:" +
            this.region +
            ":" +
            this.account +
            ":log-group:/aws/lambda/streamConsumer:*",
        ],
      })
    );

    const addItemToCart = new appsync.AppsyncFunction(this, "addItemToCart", {
      name: "addItemToCart",
      api: props.api,
      dataSource: OrdersDS,
      code: appsync.Code.fromAsset(
        join(__dirname, "mappings/mutations/mutation.addItemToCart.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });
    const placeOrder = new appsync.AppsyncFunction(this, "_placeOrder", {
      name: "placeOrder",
      api: props.api,
      dataSource: OrdersDS,
      code: appsync.Code.fromAsset(
        join(__dirname, "mappings/mutations/mutation.placeOrder.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    new appsync.Resolver(this, "pipeline-resolver-add-item-to-cart", {
      api: props.api,
      typeName: "Mutation",
      fieldName: "addItemToCart",
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [addItemToCart],
    });

    new appsync.Resolver(this, "pipeline-resolver-place_order", {
      api: props.api,
      typeName: "Mutation",
      fieldName: "placeOrder",
      code: appsync.Code.fromAsset(
        join(__dirname, "./mappings/_executeBeforeResolver.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [placeOrder],
    });
  }
}
