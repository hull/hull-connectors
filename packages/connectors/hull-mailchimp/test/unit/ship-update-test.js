/* global describe, it */
// const request = require("supertest");

// const Server = require("../../server").Server;


// TODO Mock calls to hull api

// describe("When handling user update/create event", function describeCase() {
//   this.timeout(10000);

//   it("should respond with ok", (done) => {
//     request(Server({ hostSecret: "boom" }))
//       .post("/notify")
//       .query({
//         organization: "5c2061e1.hullapp.dev",
//         secret: "123",
//         ship: "5777eb1e9d2f17c0b2001511"
//       })
//       .send({
//         Type: "Notification",
//         MessageId: "ecbb5fb4-c778-5b54-9d5f-104ff7e7ea69",
//         TopicArn: "arn:aws:sns:us-east-1:029046039368:notifications-52e65d490f1d42726a0000d9",
//         Subject: "ship:update",
//         Message: "{\"id\":\"5777eb1e9d2f17c0b2001516\",\"updated_at\":\"2016-07-09T17:03:26Z\",\"created_at\":\"2016-07-02T16:26:12Z\",\"name\":\"New Ship\",\"description\":null,\"extra\":{},\"stats\":{},\"tags\":[],\"picture\":\"https://502385f9.ngrok.io/picture.png\",\"type\":\"ship\",\"starts_at\":null,\"ends_at\":null,\"homepage_url\":\"https://5c2061e1.hullapp.io/ships/5777eb1e9d2f17c0b2001516\",\"manifest_url\":\"https://a2f35c6c.ngrok.io/manifest.json\",\"privacy_policy_url\":null,\"terms_of_service_url\":null,\"manifest\":{\"name\":\"Mailchimp\",\"description\":\"Synchronize Segments as Mailchimp Lists\",\"picture\":\"picture.png\",\"version\":\"0.0.1\",\"tags\":[\"outgoing\",\"batch\"],\"private_settings\":[{\"name\":\"synchronized_segments\",\"title\":\"Filtered Segments\",\"description\":\"Only sync users in at least one these segments (Empty to send everyone)\",\"type\":\"array\",\"format\":\"segment\"},{\"name\":\"list_id\",\"title\":\"Mailchimp List ID\",\"description\":\"Mailchimp List ID selected by user\",\"type\":\"string\",\"format\":\"hidden\"},{\"name\":\"api_key\",\"title\":\"API Key\",\"description\":\"Token or API Key\",\"type\":\"string\",\"format\":\"hidden\"},{\"name\":\"domain\",\"title\":\"API Domain\",\"description\":\"Mailchimp API Domain\",\"type\":\"string\",\"format\":\"hidden\"},{\"name\":\"segment_mapping\",\"type\":\"object\",\"properties\":{},\"format\":\"hidden\"}],\"readme\":\"readme.md\",\"admin\":\"/auth/\",\"ui\":false,\"subscriptions\":[{\"url\":\"/notify\"}]},\"settings\":{},\"source_url\":\"https://a2f35c6c.ngrok.io/\",\"translations\":{},\"index\":\"https://a2f35c6c.ngrok.io/\",\"resources\":{}}",
//         Timestamp: "2016-07-09T17:03:27.714Z",
//         SignatureVersion: "1",
//         Signature: "DgKlL9614H670vY5kDhWOrhSGW5rTvdIGiJI8dCokpgdoSCd3tsKpX7Zy/2FDdwl5/+RPfHt/6s5ilhQRVdHzdsQBbS2i4ZqR4/a9Y5wx4qSLVuHE0Vb2MT64kQg9EPeCZn/MI1SWZoP1gIsjbOdAmrj82CHXVW2DynaeyU5h335wHKMjnjTrJWcdIcz0/vvUv8Gga8agwspOmIIu2mGyFkGR4ux2WS95XbRjplMI6hbJFaVRFXSXHTUxQBvTjcYhNIc5O2IBPdcuCS/6TkS2+/ComwljmWobERXmtGPi8Lr0lwDfnPuuU6qQAaeNSGcllHvypWEOjgynKlVkLu3Kw==",
//         SigningCertURL: "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem",
//         UnsubscribeURL: "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:029046039368:notifications-52e65d490f1d42726a0000d9:4f38b2ef-e4fa-4970-9184-df9833137339"
//       })
//       .expect("ok", done);
//   });
// });
