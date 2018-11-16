const sinon = require("sinon");
const { expect } = require("chai");
const trimTraitsPrefixFromUserMessage = require("../../../src/utils/trim-traits-prefix-from-user-message");


describe("trimTraitsPrefixFromUserMessage", () => {
  it("should trim user object in the message", () => {
    const userUpdateMessage = {
      user: {
        anonymous_ids: [
          "salesforce:00Q1I000004WHchUAG"
        ],
        name: "foo",
        phone: "123123123",
        traits_top_level: "topLevelTrait",
        "traits_group/grouped_trait": "groupedTrait",
        "traits_top_level_with_traits_in_the_name": "traitsTopLevelWithTraitsInTheName",
        "traits_group/with_traits_in_the_name": "traitsGroupWithTraitsInTheName"
      },
      segments: [{
        name: "traits_segment_name"
      }],
      account_segments: [],
      account: {
        account_top_level_trait: "exampleValue",
        traits_on_the_account_level: ["A", "B"]
      },
      changes: {
        user: {
          phone: [null, "123123123"],
          traits_top_level: ["someThing", "topLevelTrait"],
          "traits_group/grouped_trait": ["oldValue", "groupedTrait"],
          "traits_top_level_with_traits_in_the_name": ["oldValue", "traitsTopLevelWithTraitsInTheName"],
          "traits_group/with_traits_in_the_name": ["oldValue", "traitsGroupWithTraitsInTheName"]
        },
        segments: {},
        account: {
          account_top_level_trait: ["oldValue", "exampleValue"],
          traits_on_the_account_level: [["A"], ["A", "B"]]
        },
        account_segments: {},
        is_new: false
      }
    };

    const trimmedMessage = trimTraitsPrefixFromUserMessage(userUpdateMessage);
    expect(trimmedMessage).to.eql({
      user: {
        anonymous_ids: [
          "salesforce:00Q1I000004WHchUAG"
        ],
        name: "foo",
        phone: "123123123",
        top_level: "topLevelTrait",
        "group/grouped_trait": "groupedTrait",
        top_level_with_traits_in_the_name: "traitsTopLevelWithTraitsInTheName",
        "group/with_traits_in_the_name": "traitsGroupWithTraitsInTheName"
      },
      segments: [{
        name: "traits_segment_name"
      }],
      account_segments: [],
      account: {
        account_top_level_trait: "exampleValue",
        traits_on_the_account_level: ["A", "B"]
      },
      changes: {
        user: {
          phone: [null, "123123123"],
          top_level: ["someThing", "topLevelTrait"],
          "group/grouped_trait": ["oldValue", "groupedTrait"],
          "top_level_with_traits_in_the_name": ["oldValue", "traitsTopLevelWithTraitsInTheName"],
          "group/with_traits_in_the_name": ["oldValue", "traitsGroupWithTraitsInTheName"]
        },
        segments: {},
        account: {
          account_top_level_trait: ["oldValue", "exampleValue"],
          traits_on_the_account_level: [["A"], ["A", "B"]]
        },
        account_segments: {},
        is_new: false
      }
    });
  });
});
