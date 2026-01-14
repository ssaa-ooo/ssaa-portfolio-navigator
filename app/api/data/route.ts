import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

const getAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) throw new Error("環境変数が足りません");

  const formattedKey = key.replace(/\\n/g, '\n').replace(/\n/g, '\n').replace(/"/g, '').trim();
  return new JWT({
    email,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export async function GET() {
  try {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();

    // 1. プロジェクトデータの取得
    const evalSheet = doc.sheetsByTitle['Evaluations'];
    const evalRows = await evalSheet.getRows();
    const projects = evalRows.map(row => ({
      id: row.get('ProjectID'),
      name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision') || 0),
      ssR: Number(row.get('SS_Resonance') || 0),
      ssC: Number(row.get('SS_Context') || 0),
      vvM: Number(row.get('VV_Market') || 0),
      vvS: Number(row.get('VV_Speed') || 0),
      vvF: Number(row.get('VV_Friction') || 0),
    }));

    // 2. 設定データ（北極星・スコア定義）の取得
    const settingsSheet = doc.sheetsByTitle['Settings'];
    const settingsRows = await settingsSheet.getRows();
    const settings: any = {};
    settingsRows.forEach(row => {
      settings[row.get('Key')] = row.get('Value');
    });

    return NextResponse.json({ projects, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, updates } = await req.json();
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Evaluations'];
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.get('ProjectID') === id);
    if (!row) throw new Error("Project not found");

    Object.entries(updates).forEach(([key, value]) => {
      row.set(key, value);
    });

    await row.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}