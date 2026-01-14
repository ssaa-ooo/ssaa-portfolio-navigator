import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Evaluations']; // シート名が違う場合は書き換えてください
    const rows = await sheet.getRows();

    const data = rows.map(row => ({
      id: row.get('ProjectID'),
      name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision')),
      ssR: Number(row.get('SS_Resonance')),
      ssC: Number(row.get('SS_Context')),
      vvM: Number(row.get('VV_Market')),
      vvS: Number(row.get('VV_Speed')),
      vvF: Number(row.get('VV_Friction')),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}