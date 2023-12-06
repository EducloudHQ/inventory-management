/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamoDBStreamEvent, Context } from "aws-lambda";
import * as AWS from "aws-sdk";
import { logger, metrics, tracer } from "../utils";
import { getSecret } from "@aws-lambda-powertools/parameters/secrets";
import Stripe from "stripe";

const sqs = new AWS.SQS();
export async function main(
  event: any,
  context: Context
): Promise<DynamoDBStreamEvent> {
  const stripeSecretKey = await getSecret("STRIPE_SECRET_KEY");
  console.log(stripeSecretKey);
  const stripe = new Stripe(stripeSecretKey as string, {
    typescript: true,
    apiVersion: "2023-10-16",
  });

  logger.info("Lambda invocation event", { event });

  metrics.captureColdStartMetric(); // Metrics: Capture cold start metrics

  tracer.annotateColdStart(); // Tracer: Annotate the subsegment with the cold start & serviceName
  tracer.addServiceNameAnnotation();

  tracer.putAnnotation("awsRequestId", context.awsRequestId); // Tracer: Add awsRequestId as annotation

  metrics.captureColdStartMetric(); // Metrics: Capture cold start metrics

  logger.appendKeys({
    // Logger: Append awsRequestId to each log statement
    awsRequestId: context.awsRequestId,
  });
  if (
    event.Records[0].eventName === "MODIFY" &&
    event.Records[0].dynamodb?.NewImage?.SK.S?.slice(0, 6) === "ORDER#"
  ) {
    logger.info("The required event emitted");
    const eventIndex = event.Records.length - 1;
    const lineItems = [];
    const orderItems =
      event.Records[eventIndex].dynamodb?.NewImage?.orderItems?.L;
    console.log(orderItems);
    for (const item of orderItems) {
      logger.info("Item: ", item.M);
      const orderItem = {
        quantity: parseInt(item.M.quantity.N),
        price_data: {
          currency: "usd",
          unit_amount: parseFloat(item.M.unit_price.N) * 100,
          product_data: {
            name: item.M.name.S,
            description: "test products description",
            images: [item.M.image.S],
          },
        },
      };

      lineItems.push(orderItem);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://www.educloud.academy",
      customer_email: "user.email@domain.com",
    });

    logger.info("Session data for user line items and checkout link", {
      session,
    });

    logger.info("Order Items: ", { orderItems });
    const test = await sqs
      .sendMessage({
        QueueUrl: process.env.QUEUE_URL as string,
        MessageBody: JSON.stringify(event.Records[0].dynamodb.NewImage),
      })
      .promise();

    logger.info("Lambda invocation event", { test });
    return orderItems;
  } else {
    return event;
  }
}
