const getColumnType = (entries, columnName) => {
  try {
    if (entries && entries.length) {
      const values = entries.reduce((ret, e) => {
        const val = e && e[columnName];
        if (val) ret.push(val);
        return ret;
      }, []);
      return values[0] && values[0].constructor && values[0].constructor.name;
    }
  } catch (err) {
    return "";
  }
  return "";
};

export default getColumnType;
