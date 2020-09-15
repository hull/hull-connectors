const backgroundColor = "#13151a";
const dark = "#111";
const disabled = "#444";
const selected = "#2684FF";
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
  option: (s, { isDisabled, isSelected }) => ({
    ...s,
    cursor: "pointer",
    color: isSelected ? selected : isDisabled ? "#666" : "#CCC",
    backgroundColor: isDisabled ? disabled : backgroundColor,
    ":active": {
      backgroundColor: dark
    },
    ":hover": {
      backgroundColor: isDisabled ? disabled : dark
    }
  }),
  singleValue: (s, { data }) => ({
    ...s,
    color: "#FFFFFF"
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
    color: "#FFF",
    ":hover": {
      backgroundColor: dark,
      cursor: "pointer"
    }
  })
};

export default styles;
