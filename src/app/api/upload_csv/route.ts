import fs from 'fs';
import csv from 'papaparse';

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

// Assuming file is uploaded via form-data and available in req.files
  // You'll likely need a library like formidable or multer for this part
  const filePath = req.files.csvFile.path; // Example path

const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.status(200).json(results);
      fs.unlinkSync(filePath); // Clean up the temporary file
    });
};