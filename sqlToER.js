import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises"; 
import { exec } from 'child_process';
  
console.log('Begin: app sqlToER - convert SQL schema file to ER diagram in .drawio format and export it to .svg');
// you need to have a .env file in the root folder with the following content:
// GEMINI_API_KEY=your_api_key_here
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {	
  try {
    // Read the in files
    const promptFileContent  = await fs.readFile("in_sqlToER_prompt.txt", "utf-8");
    const inputFilePath = process.argv[2] || "in_sample_db_schema.sql";
    const sqlFileContent = await fs.readFile(inputFilePath, "utf-8");
    const templateFileContent = await fs.readFile("in_template.drawio", "utf-8");
   
    console.log('Make call to gemini-2.5-flash model');
    const startTime = Date.now(); 
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // Use the file content as the value for 'contents'
      contents: [
        { text: promptFileContent },          // The instructional part of the prompt
        { text: "Here is the SQL schema:" },  // A text separator
        { text: sqlFileContent },             // The content of db.sql file
        { text: "example template of .drawio xml file:" },  // A text separator
        { text: templateFileContent }         // The content of in_template.drawio file
      ],
      temperature: 0.2, // Adjust temperature for response variability
      system_instruction: "You are a diagramming assistant. Your primary goal is to generate a valid .drawio XML file based on the provided schema and template. Do not include any other text."
    });

    const responseText = response.text;
    const elapsedTime = (Date.now() - startTime) / 1000; // Calculate elapsed time in seconds
    console.log(`Response received from AI model. Time taken: ${elapsedTime} seconds.`);

    await fs.writeFile("sqlToEr.drawio", responseText);
    console.log("Successfully wrote response to sqlToEr.drawio");
	
  } catch (error) {
    console.error("Error during operation:", error);
  }
  
  // Execute the command to convert .drawio to .svg
  const command = '"C:\\Program Files\\draw.io\\draw.io.exe" -x -f svg -o sqlToEr.svg sqlToEr.drawio';

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`command: ${command}`);
    console.log('End: Open the sqlToEr.svg file to view the generated ER diagram.');
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
  
}

main();

