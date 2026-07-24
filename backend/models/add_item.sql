-- CREATE TABLE IF NOT EXISTS add_items(
--     id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
--     Item_Code VARCHAR(255) NOT NULL,
--     Item_HSN VARCHAR(20) NOT NULL,
--     Item_Unit VARCHAR(255) DEFAULT NULL,
--     Item_Image VARCHAR(255) DEFAULT NULL,
--     Category VARCHAR(255) DEFAULT NULL,

--     Sale_Price INT(10) DEFAULT NULL,
--     Sale_Price_Type VARCHAR(255) enum('With Tax', 'Without Tax') DEFAULT "Without Tax",
--     Discount_On_Sale_Price INT(10) DEFAULT NULL,
--     Discount_Type_On_Sale_Price enum('Percentage', 'Amount') DEFAULT "Percentage",
--     Wholesale_Price INT(10) enum('With Tax', 'Without Tax') DEFAULT "Without Tax",
--     Wholesale_Price_Type VARCHAR(255) DEFAULT NULL,
--     Minimum_Wholesale_Qty  INT(10) DEFAULT NULL,
--     Purchase_Price INT(10)  DEFAULT NULL,
--     Purchase_Price_Type VARCHAR(255) enum('With Tax', 'Without Tax') DEFAULT "Without Tax",
--     GST VARCHAR(255) DEFAULT NULL,
    
--     Stock_Opening_Quantity INT(10) DEFAULT NULL,
  
--     Stock_Price INT(10) DEFAULT NULL,
--     Stock_As_Of_Date VARCHAR(255) DEFAULT NULL,
--     Stock_Minimum_Qty INT(10) DEFAULT NULL,
--     Stock_Location VARCHAR(255) DEFAULT NULL,
 
-- )
CREATE TABLE IF NOT EXISTS add_item (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Item_Name VARCHAR(255) NOT NULL,
    Item_Id VARCHAR(255) NOT NULL UNIQUE,
   
    Item_HSN VARCHAR(20) NOT NULL,
    Item_Unit VARCHAR(255) NOT NULL,
    Item_Image VARCHAR(255) DEFAULT NULL,
    Item_Category VARCHAR(255) NOT NULL,


    Stock_Quantity INT(10) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
--  Purchase_Price_Type ENUM('With Tax', 'Without Tax') DEFAULT 'Without Tax',
--   Sale_Price_Type ENUM('With Tax', 'Without Tax') DEFAULT 'Without Tax',