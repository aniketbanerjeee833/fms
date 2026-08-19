export const fetchSalesForPrint = async (
  connection,
  whereClause,
  params = []
) => {

  const [sales] = await connection.query(
    `
    SELECT ...
    FROM add_sale s
    ...
    ${whereClause}
    `,
    params
  );

  // items query
  // splits query
  // mapping

  return invoices;
};

