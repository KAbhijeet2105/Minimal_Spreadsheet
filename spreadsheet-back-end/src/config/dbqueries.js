import sequelize from "./dbconfig.js";

export const createTable = async (tableName) => {
  try {
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY, isDeleted BOOLEAN DEFAULT false);`
    );
    console.log("EmptyTable created successfully.");
  } catch (error) {
    console.error("Error creating EmptyTable:", error);
  } finally {
  }
};

export const createColumnTable = async () => {
  try {
    const [existingType] = await sequelize.query(`
      SELECT typname FROM pg_type WHERE typname = 'dtype';
    `);

    if (existingType.length === 0) {
      await sequelize.query(`
    CREATE TYPE dtype AS ENUM ('number', 'text', 'date', 'singleSelect', 'multiSelect');
  `);
    } else {
      console.log("Enum type created or already exists.");
    }

    await sequelize.query(`CREATE TABLE IF NOT EXISTS ColumnInfo
     (id SERIAL PRIMARY KEY, 
      colTitle VARCHAR(255), 
      colDataType dtype,
      options JSONB,
      isActive BOOLEAN DEFAULT true);`);
    console.log("EmptyTable created successfully.");
  } catch (error) {
    console.error("Error creating EmptyTable:", error);
  } finally {
  }
};

//create column or add column
export const addColumn = async (colInfo) => {
  try {
    const colTitle = colInfo.colTitle;
    const colType = colInfo.colType;
    const colOptions = colInfo.colOptions;

    let colSpreadsheetType;

    if (
      colType === "singleSelect" ||
      colType === "text" ||
      colType === "date"
    ) {
      colSpreadsheetType = "varchar(255)";
    } else if (colType === "multiSelect") {
      colSpreadsheetType = "text[]";
    } else if (colType === "number" || colType === "decimal") {
      colSpreadsheetType = "decimal";
    }

    await sequelize.query(
      `ALTER TABLE spreadsheet ADD COLUMN IF NOT EXISTS ${colTitle} ${colSpreadsheetType};`
    );

    await sequelize.query(
      `INSERT INTO columnInfo ( colTitle, colDataType, options) VALUES ('${colTitle}', '${colType}', '${JSON.stringify(
        colOptions
      )}'::jsonb);`
    );

    console.log("Data added successfully.");
  } catch (error) {
    console.error("Unable to add column :", error);
  } finally {
  }
};

//add empty row
export const addEmptyRow = async () => {
  try {
    // You can customize this query based on your table structure
    await sequelize.query(`INSERT INTO spreadsheet DEFAULT VALUES;`);
    console.log("Empty entry added to the spreadsheet table.");
  } catch (error) {
    console.error("Error adding empty entry to the spreadsheet table:", error);
  }
};

//fetch whole spreadsheet
export const fetchSpreadsheetData = async () => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM spreadsheet ORDER BY id ASC;`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("Fetched all data from the spreadsheet table.");
    return result;
  } catch (error) {
    console.error("Error fetching all data from the spreadsheet table:", error);
    return [];
  }
};

//fetch column info table data
export const fetchAllColumnInfo = async () => {
  try {
    const result = await sequelize.query("SELECT * FROM ColumnInfo;", {
      type: sequelize.QueryTypes.SELECT,
    });

    console.log("Fetched all data from the ColumnInfo table.");
    return result;
  } catch (error) {
    console.error("Error fetching all data from the ColumnInfo table:", error);
    return [];
  }
};

//update cell value
export const updateSpreadsheetData = async (id, columnName, value) => {
  try {
    if (Array.isArray(value)) {
      const result = await sequelize.query(
        `UPDATE spreadsheet SET ${columnName} = ARRAY[:value] WHERE id = :id;`,
        {
          replacements: { id, value },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      const result = await sequelize.query(
        `UPDATE spreadsheet SET ${columnName} = :value WHERE id = :id;`,
        {
          replacements: { id, value },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }

    console.log(`Updated ${columnName} for id ${id} in the spreadsheet table.`);
    return result;
  } catch (error) {
    console.error("Error updating data in the spreadsheet table:", error);
    return [];
  }
};
