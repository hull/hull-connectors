// @flow
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import type { Entry } from "../../types";

const List = ({
  onChange,
  defaultValue,
  title,
  children
}: {
  children?: any,
  defaultValue?: string,
  current?: Entry,
  recent?: Array<Entry>,
  loading: boolean,
  title: string,
  onChange: () => void
}) => (
  <Col xs={12} className="entry-selector">
    <FormControl
      as="select"
      size="sm"
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={title}
      aria-label={title}
      aria-describedby="basic-addon1"
    >
      <option value="user">User</option>
      <option value="account">Account</option>
    </FormControl>
    {children}
  </Col>
);
export default List;
