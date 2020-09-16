const backgroundColor = "#13151a";
const white = "#FFF";
const dark = "#111";
const disabled = "#444";
const selected = "#2684FF";
const backgroundSelected = "#4c545f";
const noBorder = {
  border: "0",
  ":active": { boxShadow: 0, border: 0 },
  ":focus": { boxShadow: 0, border: 0 },
  ":hover": { boxShadow: 0, border: 0 }
};
const styles = {
  menu: s => ({ ...s, backgroundColor: "black" }),
  valueContainer: s => ({
    ...s,
    padding: "2px 8px",
    backgroundColor,
    cursor: "pointer"
  }),
  menuList: s => ({ ...s, backgroundColor }),
  container: s => ({
    ...s,
    ...noBorder
  }),
  control: s => ({
    ...s,
    ...noBorder,
    backgroundColor,
    minHeight: "31px",
    borderRadius: "0.5rem",
    ">div": {
      borderRadius: "0.5rem"
    }
  }),
  indicatorsContainer: s => ({
    ...s,
    color: "#444"
  }),
  indicatorContainer: () => ({
    padding: "5px 8px"
  }),
  indicatorSeparator: s => ({
    ...s,
    backgroundColor: "#444"
  }),
  option: (s, { isDisabled, isSelected, isFocused }) => ({
    ...s,
    cursor: "pointer",
    color: isDisabled ? "#666" : isSelected ? white : isFocused ? white : "CCC",
    backgroundColor: isDisabled
      ? disabled
      : isSelected
      ? selected
      : isFocused
      ? backgroundSelected
      : backgroundColor,
    ":active": {
      backgroundColor: selected
    },
    ":hover": {
      backgroundColor: isDisabled
        ? disabled
        : isSelected
        ? selected
        : isFocused
        ? backgroundSelected
        : backgroundColor
    }
  }),
  singleValue: (s, { data, isFocued }) => ({
    ...s,
    color: white,
    backgroundColor
  }),
  multiValue: (s, { data }) => ({
    ...s,
    backgroundColor: "#ffffff22",
    borderRadius: "0.5rem"
  }),
  multiValueLabel: (s, { data }) => ({
    ...s,
    color: "#ccc"
  }),
  multiValueRemove: (s, { data }) => ({
    ...s,
    color: white,
    ":hover": {
      backgroundColor: "#ffffff22",
      color: dark,
      cursor: "pointer"
    }
  })
};

export default styles;
