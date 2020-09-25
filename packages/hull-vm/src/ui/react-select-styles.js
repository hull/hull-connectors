const backgroundColor = "#3a414c";
const backgroundSelected = "#4c545f";
// const menuBackgroundColor = "#3a414c";
const white = "#FFF";
const dark = "#111";
const disabled = "#444";
const selected = "#2684FF";
const borderRadius = "0.5rem";
const noBorder = {
  border: "0",
  ":active": { boxShadow: 0, border: 0 },
  ":focus": { boxShadow: 0, border: 0 },
  ":hover": { boxShadow: 0, border: 0 }
};
const styles = {
  input: s => ({
    ...s,
    color: white
  }),
  menu: s => ({
    ...s,
    backgroundColor,
    margin: 0,
    border: "none",
    boxShadow: "0 15px 15px #00000047",
    borderRadius: ` 0 0 ${borderRadius} ${borderRadius}`
  }),
  valueContainer: s => ({
    ...s,
    padding: "2px 8px",
    backgroundColor,
    cursor: "pointer",
    borderRadius: "0.5rem"
  }),
  menuList: s => ({
    ...s,
    backgroundColor: "transparent",
    padding: 0
  }),
  container: s => ({
    ...s,
    ...noBorder
  }),
  control: (s, { menuIsOpen }) => ({
    ...s,
    ...noBorder,
    backgroundColor,
    minHeight: "31px",
    boxShadow: "none",
    borderRadius: menuIsOpen ? "0.5rem 0.5rem 0 0" : "0.5rem"
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
      : "transparent",
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
