//@flow

export type HullConnectorSettingsTraitMapping = Array<{
  hull?: string,
  service?: string,
  name?: string,
  overwrite?: boolean
}>;

export type HullIncomingClaimsSetting = {
  hull?: string,
  service?: string,
  required?: boolean
};

export type HullUISelect = {
  label: string,
  value: string | number
};

export type HullUISelectGroup = {
  label: string,
  options: Array<HullUISelectGroup> | Array<HullUISelect>
};
