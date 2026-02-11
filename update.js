const { google } = require("googleapis");
const axios = require("axios");

const TOKEN = process.env.AHC_TOKEN;
const SHEET_ID = process.env.SHEET_ID;

async function main() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    console.log("Connected to Google Sheets");

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Josh!A2:I",
    });

    const rows = response.data.values || [];
    console.log("Total rows:", rows.length);

    for (let i = 0; i < rows.length; i++) {
      const bookingId = rows[i][1];

      if (!bookingId) continue;

      try {
        const api = await axios.get(
          `https://ahc.one/ahc/bookings/get/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          }
        );

        // 🔥 Corrected Status Path (covers all possible structures)
        const status =
          api.data?.data?.bookingStatus ||
          api.data?.data?.booking?.bookingStatus ||
          api.data?.bookingStatus ||
          api.data?.status ||
          "NO_STATUS";

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Josh!I${i + 2}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[status]],
          },
        });

        console.log(`Updated row ${i + 2} → ${status}`);

      } catch (error) {
        console.log(`Error on row ${i + 2}`);
        console.log(error.response?.data || error.message);
      }
    }

    console.log("Update completed successfully ✅");

  } catch (err) {
    console.error("Fatal Error:", err.message);
  }
}

main();
