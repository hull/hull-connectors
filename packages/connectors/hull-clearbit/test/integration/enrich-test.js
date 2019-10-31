// import { expect } from "chai";
// import _ from "lodash";
// import supertest from "supertest";
//
// describe("Enrich action", () => {
//   /*   const connector = {
//     id: "123456789012345678901234",
//     private_settings: {
//       api_key: "123",
//       enrich_enabled: true,
//       enrich_user_segments: ["1"]
//     }
//   };
//   const mocks = mockr({
//     server,
//     beforeEach,
//     afterEach,
//     port: 8000,
//     segments: [
//       {
//         id: "1",
//         name: "A"
//       }
//     ]
//   });
//
//   it("should properly enrich users", done => {
//     mocks
//       .nock("https://person.clearbit.com")
//       .get(/\/v2\/combined\/find/)
//       .reply(200, {
//         person: {
//           id: "d54c54ad-40be-4305-8a34-0ab44710b90d",
//           name: {
//             fullName: "Alex MacCaw",
//             givenName: "Alex",
//             familyName: "MacCaw"
//           },
//           email: "alex@clearbit.com",
//           "//": "..."
//         },
//         company: {
//           id: "c5a6a9c5-303a-455a-935c-9dffcd2ed756",
//           name: "Clearbit",
//           legalName: "APIHub, Inc",
//           domain: "clearbit.com",
//           "//": "..."
//         }
//       });
//     mocks.minihull.userUpdate(
//       {
//         connector,
//         messages: [
//           {
//             user: {
//               email: "alex@clearbit.com",
//               last_known_ip: "1.1.1.1"
//             },
//             segments: [{ id: "1" }]
//           }
//         ]
//       },
//       ({ batch, logs }) => {
//         const [first] = batch;
//         expect(logs[1].message).to.equal("outgoing.user.start");
//         expect(logs[2].message).to.equal("outgoing.user.success");
//         expect(_.get(first, "body.clearbit/last_name", "")).to.equal("MacCaw");
//         expect(_.get(first, "body.clearbit/email", "")).to.equal(
//           "alex@clearbit.com"
//         );
//         expect(_.get(first, "body.clearbit/first_name", "")).to.deep.equal(
//           "Alex"
//         );
//         expect(_.get(first, "body.clearbit/source", "")).to.deep.equal({
//           value: "enrich",
//           operation: "setIfNull"
//         });
//         expect(_.get(first, "body.clearbit_company/domain", "")).to.equal(
//           "clearbit.com"
//         );
//         expect(_.get(first, "body.last_name", "")).to.deep.equal({
//           value: "MacCaw",
//           operation: "setIfNull"
//         });
//         expect(_.get(first, "body.first_name", "")).to.deep.equal({
//           value: "Alex",
//           operation: "setIfNull"
//         });
//         expect(batch.length).to.equal(1);
//         done();
//       }
//     );
//   });
//
//   it("should handle Invalid Email error", done => {
//     mocks
//       .nock("https://person.clearbit.com")
//       .get(/\/v2\/combined\/find/)
//       .reply(422, {
//         error: {
//           message: "Invalid email.",
//           type: "email_invalid"
//         }
//       });
//
//     mocks.minihull.userUpdate(
//       {
//         connector,
//         messages: [
//           {
//             user: {
//               id: "1234",
//               email: "foo@bar.com",
//               last_known_ip: "1.1.1.1"
//             },
//             segments: [{ id: "1" }]
//           }
//         ]
//       },
//       ({ batch, logs }) => {
//         expect(logs[2].message).to.equal("outgoing.user.error");
//         expect(batch.length).to.equal(0);
//         done();
//       }
//     );
//   });
//  */
// });
