## PostUpdate Checks

### prettier

upgraded to 2.1.2
https://github.com/prettier/prettier/blob/master/CHANGELOG.md
https://prettier.io/blog/2020/03/21/2.0.0.html
Breaking:

- allowParens always on
  https://prettier.io/blog/2020/03/21/2.0.0.html#change-default-value-for-arrowparens-to-always-7430httpsgithubcomprettierprettierpull7430-by-kachkaevhttpsgithubcomkachkaev

### eslint

migrate to eslint 7.9
https://eslint.org/docs/user-guide/migrating-to-6.0.0
https://eslint.org/docs/user-guide/migrating-to-7.0.0
updated ecmaVersion to "2020" -> https://eslint.org/docs/user-guide/configuring#specifying-parser-options

### style-loader
### css-loader
### sass-loader
### file-loader

updated - check building process

### syncpack
upgraded version - breaking: minimal node version

### superagent

check new default retry behaviour ?
https://github.com/visionmedia/superagent/compare/v5.3.1...v6.0.0

### superagent-throttle

moved to main package.json

### bootstrap-table

Check Bootstrap-Table in clearbit and sql connector

### bootstrap

Check .row not expanding anymore in hull-vm connectors because of bootstrap update

### codemirror

Check Codemirror behaviour in SQL connector

### copy-webpack-plugin

Check build process copies files properly

### debug

check it still works

### react-ace
upgraded -> check VM connectors

### sweetalert (hull-sql)

check behabiour and design
Separate loader from the confirm button ->
https://github.com/sweetalert2/sweetalert2/blob/master/CHANGELOG.md

### uuid

- consolidated and upgrade
- fixed imports in client.js -> check event ID generation
- purplefusion service-engine-utils : migrated to v4 in UUID generation - check behaviour ?
- import-s3-stream : migrated to v4 in UUID generation -> is it still used or can we deprecate ?
- hull-sql sync-agent: migrated to v4 in UUID generation

### react-bootstrap
1.01 -> 1.3.0
check UI

### liquidjs

- Check Message rendering in Slack connector

### mongoose
upgraded to 50.10.7
https://github.com/Automattic/mongoose/blob/master/History.md
migrated to hull-vm package


## Workspace changes

### eslint-plugin-jest

updated to latest - check for warnings

### eslint-config-prettier

Updated

### rimraf

updated

### del

removed

### object-mapper

removed

### hull-webhooks

removed ace-builds (depend on hull-vm)
removed react-ace (depend on hull-vm)
removed eslint (use monorepo version)

### minihull

remove ngrok

## FUTURE TODO

Codemirror -> Ace in SQL connector
Request-promise -> Superagent please...
-> Mailchimp depends on legacy request-promise. Risk

uuid -> check in Purplefusion why we use uuidv1 and how breaking it is - since very deprecated
