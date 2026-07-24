-- CREATE TABLE IF NOT EXISTS add_purchase(
    

--     id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
--     FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id) ON DELETE CASCADE,
--     Purchase_Id VARCHAR(255) NOT NULL,
--     Bill_Number VARCHAR(255) NOT NULL,
--     Bill_Date DATE NOT NULL,
--     State_Of_Supply VARCHAR(255) NOT NULL, 
--     Item_Name VARCHAR(255) NOT NULL,
--     FOREIGN KEY (Item_Id) REFERENCES add_item(Item_Id) ON DELETE CASCADE,

--     -- Item_HSN VARCHAR(20) NOT NULL,
--     -- Item_Unit VARCHAR(255) DEFAULT NULL,
--     -- Item_Price_Per_Unit DECIMAL(10,2) DEFAULT NULL,
--     -- Item_Price_Per_Unit_Type ENUM('With Tax', 'Without Tax') DEFAULT 'Without Tax',
--     -- Item_Discount DECIMAL(10,2) DEFAULT NULL,
--     -- Item_Discount_Type ENUM('Percentage', 'Amount') DEFAULT 'Percentage',

--     Taxes VARCHAR(255) DEFAULT NULL,
--     Total_Amount DECIMAL(10,2) DEFAULT NULL
--     Total_Paid DECIMAL(10,2) DEFAULT NULL
--     Balance_Due DECIMAL(10,2) DEFAULT NULL

--     Payment_Type ENUM('Cash', "Cheque", "Online") DEFAULT "Cash",
--     Reference_Number VARCHAR(255) DEFAULT NULL,

    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- )
CREATE TABLE IF NOT EXISTS add_purchase (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    Party_Id VARCHAR(255) NOT NULL,
    Purchase_Id VARCHAR(255) NOT NULL UNIQUE,
    Bill_Number VARCHAR(255) NOT NULL,
    Bill_Date DATE NOT NULL,
    State_Of_Supply VARCHAR(255) NOT NULL, 
    
    Total_Amount DECIMAL(10,2) DEFAULT NULL,
    Total_Paid DECIMAL(10,2) DEFAULT NULL,
    Balance_Due DECIMAL(10,2) DEFAULT NULL,

    Payment_Type ENUM('Cash', 'Cheque', 'Online') DEFAULT 'Cash',
    Reference_Number VARCHAR(255) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- CONSTRAINT fk_purchase_party FOREIGN KEY (Party_Id) 
    --     REFERENCES add_party(Party_Id) 
    --     ON DELETE CASCADE
);

