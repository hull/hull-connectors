const ValidationUtil = require("../../server/lib/sync-agent/validation-util");

describe("ValidationUtil", () => {
  test("should initialize the util with the default options", () => {
    const util = new ValidationUtil();

    expect(util.maxAttributeValueLength).toBe(1000);
    expect(util.maxAttributeNameLength).toBe(150);
    expect(util.maxIdentifierValueLength).toBe(150);
  });

  test("should initialize the util with the configured options", () => {
    const opts = {
      maxAttributeNameLength: 50,
      maxAttributeValueLength: 500,
      maxIdentifierValueLength: 74
    };

    const util = new ValidationUtil(opts);

    expect(util.maxAttributeValueLength).toBe(opts.maxAttributeValueLength);
    expect(util.maxAttributeNameLength).toBe(opts.maxAttributeNameLength);
    expect(util.maxIdentifierValueLength).toBe(opts.maxIdentifierValueLength);
  });

  test("should pass validation if the data is valid customer", () => {
    const opts = {
      maxAttributeNameLength: 150,
      maxAttributeValueLength: 1000,
      maxIdentifierValueLength: 150
    };

    const util = new ValidationUtil(opts);

    const customer = {
      id: "9305541e-4505-4bac-864e-0f6b6237c047",
      email: "customer@example.com",
      created_at: 1361205308,
      first_name: "Bob",
      plan: "basic",
      hull_segments: [
        "Customer contacts (admin only) ",
        "Admins — Customer companies",
        "UTM campaign has any vlaue",
        "Customers all (facebook audience)",
        "Signups with any existing utm campaign",
        "Customer contacts (all) ",
        "Signed-up more than 4 days ago $$"
      ]
    };

    const actual = util.validateCustomer(customer);

    expect(actual.isValid).toBeTruthy();
  });

  test("should fail validation if the identifier is too long", () => {
    const opts = {
      maxAttributeNameLength: 150,
      maxAttributeValueLength: 1000,
      maxIdentifierValueLength: 30
    };

    const util = new ValidationUtil(opts);

    const customer = {
      id: "9305541e-4505-4bac-864e-0f6b6237c047",
      email: "customer@example.com",
      created_at: 1361205308,
      first_name: "Bob",
      plan: "basic"
    };

    const actual = util.validateCustomer(customer);

    expect(actual.isValid).toBeFalsy();
    expect(actual.validationErrors).toHaveLength(1);
    expect(actual.validationErrors[0]).toBe("The unique identifier exceeds the limit, maximum size allowed is 150 bytes.");
  });

  test("should fail validation if the name of an attribute is too long", () => {
    const opts = {
      maxAttributeNameLength: 20,
      maxAttributeValueLength: 1000,
      maxIdentifierValueLength: 150
    };

    const util = new ValidationUtil(opts);

    const customer = {
      id: "9305541e-4505-4bac-864e-0f6b6237c047",
      email: "customer@example.com",
      created_at: 1361205308,
      first_name: "Bob",
      plan: "basic",
      thisismyattributewhichhasanamethatiswaytoolong: "foo"
    };

    const actual = util.validateCustomer(customer);

    expect(actual.isValid).toBeFalsy();
    expect(actual.validationErrors).toHaveLength(1);
    expect(actual.validationErrors[0]).toBe("The attribute name exceeds the limit, maximum size allowed is 150 bytes. The following attribute is invalid: 'thisismyattributewhichhasanamethatiswaytoolong'");
  });

  test("should fail validation if the value of an attribute is too long [object as value]", () => {
    const opts = {
      maxAttributeNameLength: 150,
      maxAttributeValueLength: 1000,
      maxIdentifierValueLength: 150
    };

    const util = new ValidationUtil(opts);

    const customer = {
      id: "9305541e-4505-4bac-864e-0f6b6237c047",
      email: "customer@example.com",
      created_at: 1361205308,
      first_name: "Bob",
      plan: "basic",
      hull_segments: [
        "Customer contacts (admin only) ",
        "Admins — Customer companies",
        "UTM campaign has any vlaue",
        "Customers all (facebook audience)",
        "Signups with any existing utm campaign",
        "Customer contacts (all) ",
        "Signed-up more than 4 days ago $$",
        "NL sync gmail labels*",
        "Front NL 60 days ago / trials",
        "Owner sender has any value {custio}",
        "Just visited pricing page (Melissa)",
        "Signups sync to SF*",
        "Subscribed to any form on website* (SF)",
        "Front Admins*",
        "Signed up*",
        "Signed up with email confirmation**",
        "Blog subscribers PR newsletter Jan 2018**",
        "SF status is SAL 2 or SQL or Won or Junk or Unqualified **",
        "{Event} Viewed HP in last 3 days**",
        "Signed-up more than 15 days ago $$",
        "Is user and channels > 0 (Intercom drip)**",
        "Signed up after 01/24**",
        "Sign-up event was triggered at least once*",
        "Historical blog subscribers*",
        "Is first admin {sync Customer.io} $$",
        "Signed-up more than 1 day ago $$",
        "Stripe plan exists custio $$",
        "has_started_free_trial",
        "Self serve admins NL — Cori {custio} ",
        "Signed-up before 02/28 $$",
        "Paid customers**",
        "Signed-up",
        "AE's calendly and phone number $$",
        "Owner is CSM {customer.io}"
      ]
    };

    const actual = util.validateCustomer(customer);

    expect(actual.isValid).toBeFalsy();
    expect(actual.validationErrors).toHaveLength(1);
    expect(actual.validationErrors[0]).toBe(`The value for the attribute exceeds the limit, maximum size allowed is 1000 bytes. The following data is invalid: '${JSON.stringify(customer.hull_segments)}' for attribute 'hull_segments'`);
  });

  test("should fail validation if the value of an attribute is too long [primitive data type as value]", () => {
    const opts = {
      maxAttributeNameLength: 150,
      maxAttributeValueLength: 1000,
      maxIdentifierValueLength: 150
    };

    const util = new ValidationUtil(opts);

    const customer = {
      id: "9305541e-4505-4bac-864e-0f6b6237c047",
      email: "customer@example.com",
      created_at: 1361205308,
      first_name: "Bob",
      plan: "basic",
      nullable_attribute: null,
      hull_segments: [
        "Customer contacts (admin only) ",
        "Admins — Customer companies",
        "UTM campaign has any vlaue",
        "Customers all (facebook audience)",
        "Signups with any existing utm campaign",
        "Customer contacts (all) ",
        "Signed-up more than 4 days ago $$",
        "NL sync gmail labels*",
        "Front NL 60 days ago / trials",
        "Owner sender has any value {custio}",
        "Just visited pricing page (Melissa)",
        "Signups sync to SF*",
        "Subscribed to any form on website* (SF)",
        "Front Admins*",
        "Signed up*",
        "Signed up with email confirmation**",
        "Blog subscribers PR newsletter Jan 2018**",
        "SF status is SAL 2 or SQL or Won or Junk or Unqualified **",
        "{Event} Viewed HP in last 3 days**",
        "Signed-up more than 15 days ago $$",
        "Is user and channels > 0 (Intercom drip)**",
        "Signed up after 01/24**",
        "Sign-up event was triggered at least once*",
        "Historical blog subscribers*",
        "Is first admin {sync Customer.io} $$",
        "Signed-up more than 1 day ago $$",
        "Stripe plan exists custio $$",
        "has_started_free_trial",
        "Self serve admins NL — Cori {custio} ",
        "Signed-up before 02/28 $$",
        "Paid customers**",
        "Signed-up",
        "AE's calendly and phone number $$",
        "Owner is CSM {customer.io}"
      ].join(" | ")
    };

    const actual = util.validateCustomer(customer);

    expect(actual.isValid).toBeFalsy();
    expect(actual.validationErrors).toHaveLength(1);
    expect(actual.validationErrors[0]).toBe(`The value for the attribute exceeds the limit, maximum size allowed is 1000 bytes. The following data is invalid: '${customer.hull_segments}' for attribute 'hull_segments'`);
  });
});
