import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 1. データの取得 (GET)
export async function GET() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. データの保存 (POST)
export async function POST(req: Request) {
  try {
    const { id, updates } = await req.json();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Evaluations'];
    const rows = await sheet.getRows();
    
    // ProjectIDが一致する行を探す
    const row = rows.find(r => r.get('ProjectID') === id);
    if (!row) throw new Error("Project not found");

    // 指定されたカラムを更新
    Object.entries(updates).forEach(([key, value]) => {
      row.set(key, value);
    });

    await row.save(); // スプレッドシートへ書き込み
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}