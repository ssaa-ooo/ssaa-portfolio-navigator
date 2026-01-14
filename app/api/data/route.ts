import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) throw new Error("GOOGLE_PRIVATE_KEY is missing");

    // Vercel特有の「改行崩れ」を完全に修正するロジック
    const formattedKey = rawKey
      .replace(/\\n/g, '\n')        // 文字列としての \n を実際の改行に
      .replace(/"/g, '')             // 万が一混入した引用符を削除
      .trim();                       // 前後の余計な空白を削除

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Evaluations'];
    const rows = await sheet.getRows();

    const data = rows.map(row => ({
      id: row.get('ProjectID'),
      name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision') || 0),
      ssR: Number(row.get('SS_Resonance') || 0),
      ssC: Number(row.get('SS_Context') || 0),
      vvM: Number(row.get('VV_Market') || 0),
      vvS: Number(row.get('VV_Speed') || 0),
      vvF: Number(row.get('VV_Friction') || 0),
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}