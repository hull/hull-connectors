// @flow
import _ from "lodash";

const hasInvalidCharacters = (value?: string): Array<string> =>
  _.uniq(
    ((value && value.match(/[^0-9a-z-_]/g)) || []).map(c =>
      c
        .replace(" ", "Space Character")
        .replace(/^([A-Z])$/, "Uppercase Character: $1")
    )
  );

export default hasInvalidCharacters;
