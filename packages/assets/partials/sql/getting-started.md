## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Sql importer card. After installation, switch to the “Settings” tab and begin with the configuration.

Begin your configuration in the section **Database Connection** by selecting the type of your SQL database. Next specify other connection parameters such as host name and port:
![Getting Started Step 1](./docs/gettingstarted01.png)

Move on to the section **Database Login** and specify the user credentials:
![Getting Started Step 2](./docs/gettingstarted02.png)

To complete your configuration, save your changes to the settings. You can now move on to the tab “Dashboard” and write your SQL query:
![Getting Started Step 3](./docs/gettingstarted03.png)
![Getting Started Step 3](./docs/gettingstarted04.png)

Click on the button “Preview” to check if your query is working and delivering the results you expect. Once you are satisfied with the r™esult, save your changes. The SQL connector will run the query on a given interval (3 hours per default) once you enable the sync (see Synchronize data on a scheduled basis for further details). If you want to start the import directly, click on the button “Import everything” and we will get you going right away.
