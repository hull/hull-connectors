// @flow
import type { HullUISelectResponse, HullContext } from "hull";

export default async function outgoingContactPropertiesHandler(
  _ctx: HullContext
): HullUISelectResponse {
  return {
    status: 200,
    data: {
      options: [
        { value: "civility", label: "civility" },
        { value: "first_name", label: "first_name" },
        { value: "last_name", label: "last_name" },
        { value: "full_name", label: "full_name" },
        { value: "email[0].email", label: "1st email" },
        { value: "email[1].email", label: "2nd Email" },
        { value: "email[2].email", label: "3rd Email" },
        { value: "email[3].email", label: "4th Email" },
        { value: "company", label: "company" },
        { value: "website", label: "website" },
        { value: "linkedin", label: "linkedin" },
        { value: "siren", label: "siren" },
        { value: "siret", label: "siret" },
        { value: "siret_address", label: "siret_address" },
        { value: "vat", label: "vat" },
        { value: "nb_employees", label: "nb_employees" },
        { value: "naf5_code", label: "naf5_code" },
        { value: "naf5_des", label: "naf5_des" },
        { value: "company_linkedin", label: "company_linkedin" },
        { value: "company_turnover", label: "company_turnover" },
        { value: "company_results", label: "company_results" }
      ]
    }
  };
}
