/* @flow */
import type {
  HullUserClaims,
  HullUserAttributes,
  HullEventProperties,
  HullEventContext
} from "hull";

import type {
  TypeformResponse,
  TypeformForm,
  TypeformResponseAnswer,
  TypeformConnectorPrivateSettings
} from "../types";

const _ = require("lodash");
const striptags = require("striptags");

const defaultHiddenFieldsIdents = {
  email: "email",
  anonymous_id: "anonymous_id",
  external_id: "external_id",
  hull_id: "id"
};

class MappingUtil {
  privateSettings: TypeformConnectorPrivateSettings;

  constructor({
    privateSettings
  }: {
    privateSettings: TypeformConnectorPrivateSettings
  }) {
    this.privateSettings = privateSettings;
  }

  getHullUserClaims({ hidden, answers }: TypeformResponse): HullUserClaims {
    const ident = {};
    _.map(defaultHiddenFieldsIdents, (v, k) => {
      const value = hidden && hidden[k];
      if (value) {
        ident[v] = value;
      }
    });

    const emailFieldId = this.privateSettings.field_as_email;
    if (emailFieldId) {
      if (hidden && hidden[emailFieldId]) {
        ident.email = hidden[emailFieldId].toString();
      }
      const emailAnswer = _.find(answers, { field: { id: emailFieldId } });
      if (emailAnswer && emailAnswer.email) {
        ident.email = emailAnswer.email;
      }
    }

    return ident;
  }

  getHullUserAttributes(
    typeformResponse: TypeformResponse
  ): HullUserAttributes {
    const incomingUserAttributes =
      this.privateSettings.incoming_user_attributes || [];
    return _.reduce(
      incomingUserAttributes,
      (attributes, attribute) => {
        if (!attribute.hull || !attribute.service) {
          return attributes;
        }
        const hullTraitName = attribute.hull.replace("traits_", "");
        const answer = _.find(typeformResponse.answers, {
          field: { id: attribute.service }
        });
        if (!answer) {
          if (
            typeformResponse.hidden &&
            typeformResponse.hidden[attribute.service]
          ) {
            attributes[hullTraitName] =
              typeformResponse.hidden[attribute.service];
          } else if (
            typeformResponse.calculated &&
            typeformResponse.calculated[attribute.service]
          ) {
            attributes[hullTraitName] =
              typeformResponse.calculated[attribute.service];
          }
          return attributes;
        }

        const value = this.getAnswerValue(answer);
        attributes[hullTraitName] = value;
        return attributes;
      },
      {}
    );
  }

  getHullUserEventProperties(
    form: TypeformForm,
    response: TypeformResponse
  ): HullEventProperties {
    const baseProperties = {
      form_title: form.title,
      form_id: form.id
    };

    const propertiesFromAnswers = (response.answers || []).reduce(
      (properties, answer) => {
        // $FlowFixMe
        const formField = _.find(form.fields, { id: answer.field.id });
        if (formField === undefined) {
          return properties;
        }
        const propertyName: string = striptags(formField.title);
        const propertyValue = this.getAnswerValue(answer);
        properties[propertyName] = propertyValue;
        return properties;
      },
      {}
    );
    const propertiesFromHidden = response.hidden;
    const propertiesFromCalculated = response.calculated;
    return {
      ...baseProperties,
      ...propertiesFromAnswers,
      ...propertiesFromHidden,
      ...propertiesFromCalculated
    };
    // _.map(_.merge(response.answers, response.hidden), (answer, questionId) => {
    //   const question = _.find(questions, { id: questionId });
    //   const propName = (question ? striptags(question.question) : questionId);
    //
    //   if (_.has(props, propName)) {
    //     if (_.isArray(props[propName])) {
    //       props[propName].push(this.castAnswerType(questionId, answer));
    //     } else {
    //       props[propName] = [props[propName], this.castAnswerType(questionId, answer)];
    //     }
    //   } else {
    //     props[propName] = this.castAnswerType(questionId, answer);
    //   }
    // });
    // return props;
  }

  getAnswerValue(
    answer: TypeformResponseAnswer
  ): string | boolean | number | Array<string> | void {
    switch (answer.type) {
      case "text":
        return answer.text;
      case "boolean":
        return answer.boolean;
      case "email":
        return answer.email;
      case "number":
        return answer.number;
      case "choice":
        return answer.choice && answer.choice.label;
      case "date":
        return answer.date;
      case "file_url":
        return answer.file_url;
      case "choices":
        return answer.choices && answer.choices.labels;
      default:
        return undefined;
    }
  }
  // isHidden(question) {
  //   return question.id.search("_") === -1;
  // }
  //
  // isNotHidden(question) {
  //   return question.id.search("_") !== -1;
  // }
  //
  // getQuestionType(questionId = "") {
  //   return (questionId || "").split("_")[0];
  // }
  //
  // isChoice(questionId = "") {
  //   return (questionId || "").split("_").slice(-2, -1).pop() === "choice";
  // }
  //
  // castAnswerType(questionId = "", answer = "") {
  //   const questionType = this.getQuestionType(questionId);
  //
  //   if (_.includes(["rating", "opinionscale", "number", "payment"], questionType)) {
  //     return parseFloat(answer);
  //   }
  //
  //   if (_.includes(["yesno", "terms"], questionType)) {
  //     return answer === "1";
  //   }
  //
  //   if (_.includes(["date"], questionType)) {
  //     return answer === "1";
  //   }
  //
  //   return answer;
  // }

  getHullUserEventContext(response: TypeformResponse): HullEventContext {
    const context = {
      useragent: response.metadata.user_agent,
      referer: response.metadata.referer,
      source: "typeform",
      event_type: "form",
      event_id: ["typeform", response.token, "submit"].join("-"),
      created_at: response.submitted_at
    };

    return context;
  }
}

module.exports = MappingUtil;
