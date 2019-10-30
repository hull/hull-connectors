export default {
  Person: [
    {
      service: "email",
      hull: "email",
      overwrite: false
    },
    {
      service: "name.familyName",
      hull: "last_name",
      overwrite: false
    },
    {
      service: "name.givenName",
      hull: "first_name",
      overwrite: false
    },
    {
      service: "avatar",
      hull: "picture",
      overwrite: false
    },
    {
      service: "bio",
      hull: "bio",
      overwrite: false
    },
    {
      service: "geo.city",
      hull: "address.city",
      overwrite: false
    },
    {
      service: "geo.country",
      hull: "address.country",
      overwrite: false
    },
    {
      service: "geo.state",
      hull: "address.state",
      overwrite: false
    }
  ],
  Prospect: [
    {
      service: "email",
      hull: "email",
      overwrite: false
    },
    {
      service: "name.familyName",
      hull: "last_name",
      overwrite: false
    },
    {
      service: "name.givenName",
      hull: "first_name",
      overwrite: false
    },
    {
      service: "phone",
      hull: "phone",
      overwrite: false
    }
  ],
  Company: [
    {
      service: "name",
      hull: "name",
      overwrite: false
    },
    {
      service: "domain",
      hull: "domain",
      overwrite: false
    }
  ]
};
