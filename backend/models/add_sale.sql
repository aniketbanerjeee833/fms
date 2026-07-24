CREATE TABLE IF NOT EXISTS add_sale(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    Party_Id VARCHAR(255) NOT NULL,
    Sale_Id VARCHAR(255) NOT NULL UNIQUE,
    Invoice_Number VARCHAR(255) NOT NULL,
    Invoice_Date DATE NOT NULL,
    State_Of_Supply VARCHAR(255) NOT NULL, 
    
    Total_Amount DECIMAL(10,2) DEFAULT NULL,
    Total_Received DECIMAL(10,2) DEFAULT NULL,
    Balance_Due DECIMAL(10,2) DEFAULT NULL,

    Payment_Type ENUM('Cash', 'Cheque', 'Online') DEFAULT 'Cash',
    Reference_Number VARCHAR(255) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- CONSTRAINT fk_purchase_party FOREIGN KEY (Party_Id) 
    --     REFERENCES add_party(Party_Id) 
    --     ON DELETE CASCADE
);

