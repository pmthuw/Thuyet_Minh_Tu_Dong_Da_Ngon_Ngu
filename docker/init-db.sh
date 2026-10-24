#!/bin/bash
set -euo pipefail
SQLCMD=/opt/mssql-tools18/bin/sqlcmd
sql() { "$SQLCMD" -S sqlserver,1433 -U sa -C -b -l 15 "$@"; }
exists=$(sql -d master -h -1 -W -Q "SET NOCOUNT ON; SELECT CASE WHEN DB_ID(N'AuralisDB') IS NULL THEN 0 ELSE 1 END;" | tr -d '[:space:]')
if [ "$exists" = "0" ]; then
  echo "Creating AuralisDB using database/1_Create.sql..."
  sql -d master -i /database/1_Create.sql
  if [ "${SEED_MOCK:-false}" = "true" ]; then
    echo "Importing your database/2_Mock.sql..."
    sql -d AuralisDB -i /database/2_Mock.sql
  else
    echo "Mock import disabled. The new database has no POI data yet."
  fi
elif [ "$exists" = "1" ]; then
  echo "AuralisDB already exists; preserving all tables and data. No create/mock script will run."
else
  echo "Unexpected database probe result; stopping." >&2
  exit 1
fi
# Never recreate an existing or partially initialized database automatically.
sql -d AuralisDB -Q "IF OBJECT_ID(N'dbo.Users', N'U') IS NULL OR OBJECT_ID(N'dbo.PointsOfInterest', N'U') IS NULL OR OBJECT_ID(N'dbo.Languages', N'U') IS NULL OR OBJECT_ID(N'dbo.AudioGuides', N'U') IS NULL THROW 50001, 'AuralisDB is missing required tables. Inspect the existing database before repairing it.', 1; SELECT COUNT(*) AS PoiCount FROM dbo.PointsOfInterest;"
echo "Database initialization/check complete."
