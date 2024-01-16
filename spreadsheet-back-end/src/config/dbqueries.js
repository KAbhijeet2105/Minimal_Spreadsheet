import { JSONB } from "sequelize";
import sequelize from "./dbconfig.js";

export const createSpreadSheetTable = async () => {
  try {
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS Spreadsheet (id SERIAL PRIMARY KEY, isDeleted BOOLEAN DEFAULT true);`
    );
    console.log("EmptyTable created successfully.");
  } catch (error) {
    console.error("Error creating EmptyTable:", error);
  } finally {
    //get column count
    let totalSpreadsheetColumns = await sequelize.query(
      `SELECT COUNT(*) from information_schema.columns where TABLE_NAME = 'spreadsheet';`
    );

    totalSpreadsheetColumns = totalSpreadsheetColumns[0][0].count;
    //and now we will add 50 columns

    if (totalSpreadsheetColumns <= 2) {
      // Add 50 new columns using ALTER TABLE
      //will keep name like col1, col2, etc and default data type text
      //when user will add new column we will just update column name and data type.
      for (let i = 1; i <= 50; i++) {
        const newColumnName = `col${i}`;
        await sequelize.query(
          `ALTER TABLE spreadsheet ADD COLUMN "${newColumnName}" VARCHAR(255);`
        );
      }
    }

    console.log("total spreadsheet column count: " + totalSpreadsheetColumns);
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
      colTitle VARCHAR(255) UNIQUE, 
      colDataType dtype,
      options JSONB,
      isActive BOOLEAN DEFAULT true,
      numberSummary INTEGER DEFAULT 0,
      selectSummary varchar(255)[],
      dateSummary varchar(255)
      );`);

    console.log("columnInfo table created successfully.");

    let currentColumnCount = await countActiveColumns();

    if (currentColumnCount == 0) {
      for (let i = 1; i <= 50; i++) {
        //  await sequelize.query(`INSERT INTO ColumnInfo DEFAULT VALUES;`);
      }
      console.log("columnInfo table default columns inserted .");
    }
  } catch (error) {
    console.error("Error creating Column Info Table:", error);
  } finally {
  }
};

//create column or Add column
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

    // here  inserting new column info first we will check column count is less than 50 and then will insert column data accordingly

    let activeColumnsColInfo = parseInt(await countActiveColumns());

    if (activeColumnsColInfo < 50) {
      await sequelize.query(
        `INSERT INTO columnInfo ( colTitle, colDataType, options) VALUES ('${colTitle.toLowerCase()}', '${colType}', '${JSON.stringify(
          colOptions
        )}'::jsonb);`
      );
    }

    // old : directly adding column on user  action
    // await sequelize.query(
    //   `ALTER TABLE spreadsheet ADD COLUMN IF NOT EXISTS ${colTitle} ${colSpreadsheetType};`
    // );

    // now we only need to update colTitle and colDataType in spreadsheet table (columns will get created  at  the time of table creation)

    // `ALTER TABLE spreadsheet RENAME COLUMN ${oldColtitle} TO ${colTitle}, MODIFY COLUMN ${colTitle} ${colSpreadsheetType};`

    activeColumnsColInfo = parseInt(await countActiveColumns());

    if (activeColumnsColInfo < 50) {
      let oldColtitle = `Col${activeColumnsColInfo}`;

      console.log("old col title: " + oldColtitle);
      await sequelize.query(
        `ALTER TABLE spreadsheet RENAME ${oldColtitle} TO ${colTitle};`
      );
      await sequelize.query(
        `ALTER TABLE spreadsheet ALTER COLUMN ${colTitle} TYPE ${colSpreadsheetType} USING ${colTitle}::${colSpreadsheetType};`
      );

      // let spreadsheetRows = await countSpreadsheetRows();
      // console.log("for updating isdeleted false :" + spreadsheetRows);
      // await sequelize.query(
      //   `UPDATE spreadsheet SET isdeleted = false WHERE id = ${spreadsheetRows};`
      // );

      console.log("spread sheet column altered!");
    }
  } catch (error) {
    console.error("Unable to add column :", error);
  } finally {
  }
};

// get active column count of columnInfo table

export const countActiveColumns = async () => {
  let activeColumns = await sequelize.query(
    `SELECT count(*) AS active_column_count FROM columnInfo;`
  );

  activeColumns = activeColumns[0][0].active_column_count;

  return activeColumns;
};

// count spreadsheet rows

const countSpreadsheetRows = async () => {
  let acitveRows = await sequelize.query(`SELECT count(*) FROM spreadsheet;`);

  console.log("acitve rows : =" + acitveRows);
  // acitveRows = acitveRows[0][0].active_rows;
  // console.log("acitve rows : ="+ acitveRows);

  return acitveRows;
};

const showColumnsSpreadsheet = async () => {
  //step1 select rows form columnInfo
  let aciveColumnData = await sequelize.query(
    `SELECT coltitle from columninfo ORDER BY id ASC`
  );

  const coltitles = aciveColumnData[0].map((item) => item.coltitle);
  coltitles.push("id");
  coltitles.push("isdeleted");
  console.log(coltitles);

  let qry = "SELECT ";

  for (let i = 0; i < coltitles.length; i++) {
    qry += coltitles[i];

    if (i < coltitles.length - 1) {
      qry += ", ";
    }
  }

  qry += " FROM spreadsheet where isdeleted = false ORDER BY id;";

  //const result = await sequelize.query(qry);

  const result = await sequelize.query(qry, {
    type: sequelize.QueryTypes.SELECT,
  });

  return result;
};

//add empty row
export const addEmptyRow = async () => {
  try {
    // You can customize this query based on your table structure
    await sequelize.query(
      `INSERT INTO spreadsheet (isdeleted) VALUES (false);`
    );
    console.log("Empty entry added to the spreadsheet table.");
  } catch (error) {
    console.error("Error adding empty entry to the spreadsheet table:", error);
  }
};

//fetch whole spreadsheet
export const fetchSpreadsheetData = async () => {
  let res = showColumnsSpreadsheet();

  try {
    // const result = await sequelize.query(
    //   `SELECT * FROM spreadsheet where isdeleted = false ORDER BY id ASC;`,
    //   {
    //     type: sequelize.QueryTypes.SELECT,
    //   }
    // );

    console.log("Fetched all data from the spreadsheet table.");
    return res;
  } catch (error) {
    console.error("Error fetching all data from the spreadsheet table:", error);
    return [];
  }
};

//fetch column info table data
export const fetchAllColumnInfo = async () => {
  try {
    const result = await sequelize.query(
      "SELECT * FROM ColumnInfo where isactive = true ORDER BY id ASC;",
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
