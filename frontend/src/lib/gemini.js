import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
export const genAI = new GoogleGenerativeAI(apiKey)

// Model selection — using gemini-2.5-flash for reasoning tasks (thinking enabled, 1M context)
const MAPPING_MODEL = 'gemini-2.5-flash';
const INFERENCE_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `
You are a data mapping assistant for ForgeTrack. You will receive CSV/Excel column headers and sample data from an attendance sheet.
Your task is to map each source column to one of these target fields: 
- student_name (The full name of the student)
- usn (University Seat Number, usually starts with 4SH...)
- admission_number (College admission number)
- email (Student email)
- branch_code (Department like CS, AI, IS)
- date (If there is a single column containing the session date)
- session_topic (If there is a single column containing the topic)
- attendance_status (If there is a single column containing present/absent status)
- IGNORE (For columns like SL No, invite links, or any data we don't track)

CRITICAL: If the headers look like dates (e.g., "15/4/26", "2/12/25", "Jan-20", or 5-digit Excel serial numbers like 45767), then 'is_pivoted' is TRUE. In this case, map those specific date columns to "date" and flag them as pivoted.

Detect:
1. date_format: e.g., "DD/MM/YYYY", "DD/M/YY", "YYYY-MM-DD", "EXCEL_SERIAL" etc.
2. attendance_convention: e.g., "TRUE/FALSE", "P/A", "1/0", "Present/Absent", "Y/N".
3. is_pivoted: true if dates are in headers, false if there is a 'date' column.

Return ONLY a JSON object with this schema:
{
  "mapping": { "source_column_name": "target_field_name" },
  "date_format": "detected_format",
  "attendance_convention": "detected_convention",
  "is_pivoted": true/false,
  "confidence": 0-1
}
`;

export async function analyzeCsvMapping(headers, sampleRows) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MAPPING_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      }
    });

    const prompt = `
      Headers: ${JSON.stringify(headers)}
      Sample Data (first 5 rows): ${JSON.stringify(sampleRows)}
      
      Analyze the mapping and return the JSON.
    `;

    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    throw error;
  }
}

export async function inferMissingDates(headers, scheduleDescription) {
  const INFERENCE_PROMPT = `
    You are a scheduling assistant. You will be given a list of headers from an attendance sheet and a description of the class schedule.
    Some headers are missing dates or use relative terms (e.g. "Session 1", "Week 1", "Day 1", or just empty strings).
    Some headers may be 5-digit Excel serial numbers (e.g. 45767 = a specific date since 1900).
    
    Task:
    1. Identify headers that likely represent session dates (including Excel serial numbers and relative terms like "Day 1").
    2. Based on the schedule description (e.g. "Classes are every Tuesday and Thursday starting Aug 4 2025"), assign a specific YYYY-MM-DD date to each identified header.
    3. For Excel serial numbers, convert them: Excel serial 1 = Jan 1, 1900. Add the serial - 2 days to that base (Excel has a leap year bug).
    4. Ensure the dates follow the chronological order of the headers.
    
    Return ONLY a JSON object:
    {
      "inferred_dates": { "original_header": "YYYY-MM-DD" },
      "explanation": "brief reasoning"
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: INFERENCE_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      }
    });
    
    const prompt = `
      Headers: ${JSON.stringify(headers)}
      Schedule Description: "${scheduleDescription}"
      
      Infer the dates and return the JSON.
    `;

    const result = await model.generateContent([INFERENCE_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '');
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Inference Error:", error);
    throw error;
  }
}
