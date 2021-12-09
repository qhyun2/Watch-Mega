import aws from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

const instance = new aws.DynamoDB.DocumentClient({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  params: {
    TableName: process.env.AWS_TABLE_NAME,
  },
});

export type GetParams = Omit<aws.DynamoDB.DocumentClient.GetItemInput, "TableName">;
export type PutParams = Omit<aws.DynamoDB.DocumentClient.PutItemInput, "TableName">;
type DocumentClientPromise = Promise<PromiseResult<aws.DynamoDB.DocumentClient.GetItemOutput, aws.AWSError>>;

const client = {
  get: (params: GetParams): DocumentClientPromise =>
    instance.get(params as unknown as aws.DynamoDB.DocumentClient.GetItemInput).promise(),
  put: (params: PutParams): DocumentClientPromise =>
    instance.put(params as unknown as aws.DynamoDB.DocumentClient.PutItemInput).promise(),
};

export default client;
