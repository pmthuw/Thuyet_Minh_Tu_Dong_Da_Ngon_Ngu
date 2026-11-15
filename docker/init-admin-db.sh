#!/bin/bash
set -euo pipefail
# Keep the existing database initialization logic, then add admin tables/columns.
/bin/bash /scripts/init-db.sh
/opt/mssql-tools18/bin/sqlcmd -S sqlserver,1433 -U sa -C -b -l 15 -d AuralisDB -i /database/3_Admin.sql
echo "AURALIS admin schema ready; existing POI data preserved."
