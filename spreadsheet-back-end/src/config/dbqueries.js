import { JSONB } from "sequelize";
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
      isActive BOOLEAN DEFAULT true,
      numberSummary INTEGER DEFAULT 0,
      selectSummary varchar(255)[],
      dateSummary varchar(255)
      );`);
    console.log("columnInfo table created successfully.");
  } catch (error) {
    console.error("Error creating Column Info Table:", error);
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
    const result = await sequelize.query(
      "SELECT * FROM ColumnInfo ORDER BY id ASC;",
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("Fetched all data from the ColumnInfo table.");
    return result;
  } catch (error) {
    console.error("Error fetching all data from the ColumnInfo table:", error);
    return [];
  }
};

//update cell value
export const updateSpreadsheetData = async (id, columnName, colType, value) => {
  try {
    let result;

    if (Array.isArray(value)) {
      result = await sequelize.query(
        `UPDATE spreadsheet SET ${columnName} = ARRAY[:value] WHERE id = :id;`,
        {
          replacements: { id, value },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      result = await sequelize.query(
        `UPDATE spreadsheet SET ${columnName} = :value WHERE id = :id;`,
        {
          replacements: { id, value },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }

    if (colType === "number") {
      const sumResult = await sequelize.query(
        `
        SELECT SUM(${columnName}) AS totalSum
        FROM spreadsheet;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      console.log(sumResult);

      const result = await sequelize.query(
        `
        UPDATE ColumnInfo
        SET numberSummary = ${sumResult[0].totalsum}
        WHERE colTitle = '${columnName}';
        `,
        {
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    } else if (colType === "date") {
      const nearestDateResult = await sequelize.query(
        `
        SELECT *
        FROM spreadsheet
        ORDER BY ABS(EXTRACT(epoch FROM (TO_TIMESTAMP(${columnName}, 'MM/DD/YYYY, HH:MI:SS AM') - NOW()))) ASC
        LIMIT 1;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(nearestDateResult);

      // Update your ColumnInfo table accordingly.
      // For example, you can extract the nearest date and update the summary.
      const nearestDate = nearestDateResult[0][columnName];
      const updateResult = await sequelize.query(
        `
        UPDATE ColumnInfo
        SET dateSummary = :nearestDate
        WHERE colTitle = :columnName;
        `,
        {
          replacements: { nearestDate, columnName },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      console.log(
        `Updated dateSummary for colTitle ${columnName} in the ColumnInfo table.`
      );
    } else if (colType === "singleSelect") {
      const frequencyResult = await sequelize.query(
        `
        SELECT ${columnName} AS stringValue, COUNT(${columnName}) AS frequency
        FROM spreadsheet
        GROUP BY ${columnName}
        HAVING COUNT(${columnName}) = (
          SELECT COUNT(${columnName})
          FROM spreadsheet
          GROUP BY ${columnName}
          ORDER BY COUNT(${columnName}) DESC
          LIMIT 1
        );
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      console.log(frequencyResult);

      const mostFrequentStrings = frequencyResult.map(
        (result) => result.stringvalue
      );

      console.log(
        `Most frequent strings for ${columnName}: ${mostFrequentStrings.join(
          ", "
        )}`
      );

      const updateResult = await sequelize.query(
        `
        UPDATE ColumnInfo
        SET selectSummary = ARRAY[:mostFrequentStrings]
        WHERE colTitle = :columnName;
        `,
        {
          replacements: { mostFrequentStrings, columnName },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      console.log(
        `Updated selectSummary for colTitle ${columnName} in the ColumnInfo table.`
      );
    } else if (colType === "multiSelect") {
      const frequencyResult = await sequelize.query(
        `
        SELECT unnest(${columnName}) AS stringValue, COUNT(*) AS frequency
        FROM spreadsheet
        WHERE ${columnName} IS NOT NULL
        GROUP BY stringValue
        HAVING COUNT(*) = (
          SELECT COUNT(*)
          FROM spreadsheet
          WHERE ${columnName} IS NOT NULL
          GROUP BY unnest(${columnName})
          ORDER BY COUNT(*) DESC
          LIMIT 1
        );
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(frequencyResult);

      const mostFrequentStrings = frequencyResult.map(
        (result) => result.stringvalue
      );

      console.log(
        `Most frequent strings for ${columnName}: ${mostFrequentStrings.join(
          ", "
        )}`
      );

      const updateResult = await sequelize.query(
        `
        UPDATE ColumnInfo
        SET selectSummary = ARRAY[:mostFrequentStrings]
        WHERE colTitle = :columnName;
        `,
        {
          replacements: { mostFrequentStrings, columnName },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      console.log(
        `Updated selectSummary for colTitle ${columnName} in the ColumnInfo table.`
      );
    }

    console.log(`Updated ${columnName} for id ${id} in the spreadsheet table.`);
    return result;
  } catch (error) {
    console.error("Error updating data in the spreadsheet table:", error);
    return [];
  }
};
