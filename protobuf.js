const protobuf = require("protobufjs");

// Define the Protobuf message structure
const message = `
syntax = "proto3";

message Person {
  string name = 1;
  int32 age = 2;
  repeated string hobbies = 3;
}`;

// Load the Protobuf definition
const root = protobuf.parse(message, { keepCase: true }).root;
const Person = root.lookupType("Person");

// JSON data to be converted
const jsonData = {
  name: "John Doe",
  age: 30,
  hobbies: ["reading", "gaming", "coding"],
};

// Convert JSON to Protobuf
const errMsg = Person.verify(jsonData);
if (errMsg) {
  throw Error(errMsg);
}
const protobufData = Person.create(jsonData);
const buffer = Person.encode(protobufData).finish();

console.log(buffer);