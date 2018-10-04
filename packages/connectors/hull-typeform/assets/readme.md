# Typeform intergration

1. Go to the [My Account Page](https://admin.typeform.com/account#/section/user) and get the API KEY
2. Paste it in the settings pane and save
3. Then choose form you want to fetch responses from, save settings
4. Configure the mapping, choose which fields you want to save

To reconcile user Identities, you can setup your Typeform's to embed [Hidden Fields](https://www.typeform.com/help/hidden-fields/). We recognize the following fields automatically:

- `anonymous_id` - The User's anonymous ID. Use this to reconcile to anonymous web traffic.
- `external_id` - The User's Id in your own database
- `hull_id` - The User's Hull Id
- `email` - The user's email (overridable in settings)

To enable this, don't forget to enable Hidden fields as follows in your Form:

![Hidden Fields Setup](./typeform.png)

To configure hidden fields, click on the URL that appears as the topmost box in the `Build` tab of Typeform
