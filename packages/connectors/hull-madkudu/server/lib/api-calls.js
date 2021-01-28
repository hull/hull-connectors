// @flow

import _ from "lodash";
import MadkuduError from "./madkudu-error";
import type { Company, Person } from "./types";

const MADKUDU_ANALYTICS_URL = "https://data.madkudu.com/v1/hull";
const MADKUDU_PREDICTION_API_URL = "https://api.madkudu.com/v1";

export const updateCall = ({ request, api_key }) => async body => {
  try {
    const req = request.post(MADKUDU_ANALYTICS_URL);
    const reqAuth = req.auth(api_key);
    const response = await reqAuth.send(body);
    return {
      result: "success",
      type: body.type,
      response: _.pick(response, "statusCode", "body")
    };
  } catch (err) {
    throw new MadkuduError(
      body.type,
      err,
      _.get(
        err,
        "message",
        "Unknown API error, see InnerException for more details."
      )
    );
  }
};

export const fetchCompany = ({ request, api_key }) => async (
  domain: string
): Promise<Company> => {
  try {
    const response = await request
      .get(`${MADKUDU_PREDICTION_API_URL}/companies`)
      .auth(api_key)
      .query({ domain });
    return response.body;
  } catch (err) {
    throw new MadkuduError(
      "companies",
      err,
      _.get(
        err,
        "message",
        "An unknown error occurred when calling the companies endpoint."
      )
    );
  }
};
export const fetchPerson = ({ request, api_key }) => async (
  email: string
): Promise<Person> => {
  try {
    const response = await request
      .get(`${MADKUDU_PREDICTION_API_URL}/persons`)
      .auth(api_key)
      .query({ email });
    return response.body;
  } catch (err) {
    throw new MadkuduError(
      "persons",
      err,
      _.get(
        err,
        "message",
        "An unknown error occurred when calling the persons endpoint."
      )
    );
  }
};
