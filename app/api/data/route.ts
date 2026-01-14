import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

// 鍵をクリーンアップする関数
const getAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) throw new Error("環境変数が足りません");

  // Vercelでの改行崩れ・引用符混入を徹底的に排除
  const formattedKey = key
    .replace(/\\n/g, '\n') // 文字列の \n を実際の改行へ
    .replace(/\n/g, '\n')  // 実際の改行を維持
    .replace(/"/g, '')     // 誤って混入した引用符を削除
    .trim();

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
    console.error("GET Error:", error.message);
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
    console.error("POST Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}