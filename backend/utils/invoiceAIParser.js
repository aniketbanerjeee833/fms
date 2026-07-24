
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
const genAI = new GoogleGenerativeAI("AIzaSyBbcnUAa7EG0Ub9CY70jIHqyvXT65ORuRc");
export const extractInvoiceWithAI = async (imagePath) => {

 const model = genAI.getGenerativeModel({
   model: "gemini-2.5-flash"
 });

 const image = {
   inlineData: {
     data: fs.readFileSync(imagePath).toString("base64"),
     mimeType: "image/jpeg"
   }
 };

 const prompt = `
Extract purchase invoice information from this image.

Return ONLY JSON in this format:

{
 "Party_Name": "",
 "GSTIN": "",
 "Bill_Number": "",
 "Bill_Date": "",
 "State_Of_Supply": "",
 "Total_Amount": "",
 "items":[
   {
    "Item_Name":"",
    "Item_HSN":"",
    "Quantity":"",
    "Purchase_Price":"",
    "Amount":""
   }
 ]
}
`;

 const result = await model.generateContent([prompt, image]);

 const text = result.response.text();

 const jsonMatch = text.match(/\{[\s\S]*\}/);

 if (!jsonMatch) throw new Error("Invalid AI response");

 return JSON.parse(jsonMatch[0]);
};