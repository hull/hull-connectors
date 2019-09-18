module.exports = (nock) => {
  nock("https://api.madkudu.com/v1")
    .post("/companies")
    .reply(200, {
      domain: "madkudu.com",
      object_type: "company",
      properties: {
        name: "MadKudu Inc",
        domain: "madkudu.com",
        location: {
          state: "California",
          state_code: "CA",
          country: "United States",
          country_code: "US",
          tags: ["english_speaking", "high_gdp_per_capita"]
        },
        number_of_employees: 17000,
        industry: "Software",
        customer_fit: {
          segment: "good",
          top_signals: [
            { name: "employee count", value: "180", type: "positive" },
            { name: "web traffic volume", value: "medium", type: "positive" }
          ]
        }
      }
    });
};
