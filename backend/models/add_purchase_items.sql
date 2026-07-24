CREATE TABLE IF NOT EXISTS add_purchase_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Purchase_Id VARCHAR(255) NOT NULL,   -- FK to add_purchase
    Item_Id VARCHAR(255) NOT NULL,       -- FK to add_item
    Purchase_items_Id VARCHAR(255) NOT NULL UNIQUE,
    Quantity INT(10) NOT NULL,

   
    Purchase_Price DECIMAL(10,2) DEFAULT NULL,
    -- Purchase_Price_Type ENUM('With Tax', 'Without Tax') DEFAULT 'Without Tax',

    Discount_On_Purchase_Price DECIMAL(10,2) DEFAULT NULL,
    Discount_Type_On_Purchase_Price ENUM('Percentage', 'Amount') DEFAULT 'Percentage',

   

   
    Tax_Type VARCHAR(50) DEFAULT 'None',
    Tax_Amount DECIMAL(10,2) DEFAULT NULL,
 
    Amount DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- CONSTRAINT fk_purchase FOREIGN KEY (Purchase_Id) 
    --     REFERENCES add_purchase(Purchase_Id) 
    --     ON DELETE CASCADE,

    -- CONSTRAINT fk_purchase_item FOREIGN KEY (Item_Id) 
    --     REFERENCES add_item(Item_Id) 
    --     ON DELETE CASCADE
);

