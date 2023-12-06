import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkImsProjectStack } from "../lib/cdk-ims-project-stack";

const app = new cdk.App();

new CdkImsProjectStack(app, "CdkImsProjectStack", {
  env: { account: "accountID", region: "region" },
});
