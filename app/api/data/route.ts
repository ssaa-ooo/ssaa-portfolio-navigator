import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

const getAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) throw new Error("Environment variables missing");
  const formattedKey = key.replace(/\\n/g, '\n').replace(/\n/g, '\n').replace(/"/g, '').trim();
  return new JWT({ email, key: formattedKey, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
};

export async function GET() {
  try {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();
    
    // Evaluationsシートの取得
    const evalSheet = doc.sheetsByTitle['Evaluations'];
    const evalRows = await evalSheet.getRows();
    const projects = evalRows.map(row => ({
      id: row.get('ProjectID'), // ← これが抜けているとエラーになります
      name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision') || 0),
      ssR: Number(row.get('SS_Resonance') || 0),
      ssC: Number(row.get('SS_Context') || 0),
      vvM: Number(row.get('VV_Market') || 0),
      vvS: Number(row.get('VV_Speed') || 0),
      vvF: Number(row.get('VV_Friction') || 0),
      // フェーズ2：アセット配分用の新規項目
      z: Number(row.get('Asset_Volume') || 50), 
      lead: row.get('Lead_Person') || "未割当"
    }));

    // Settingsシートの取得
    const settingsSheet = doc.sheetsByTitle['Settings'];
    const settingsRows = await settingsSheet.getRows();
    const settings: any = {};
    settingsRows.forEach(row => { settings[row.get('Key')] = row.get('Value'); });

    return NextResponse.json({ projects, settings });
  } catch (error: any) { 
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target = body.target as 'Evaluations' | 'Settings';
    const id = body.id as string;
    const updates = body.updates as Record<string, any>;

    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[target];
    const rows = await sheet.getRows();
    
    const searchKey = target === 'Evaluations' ? 'ProjectID' : 'Key';
    const row = rows.find(r => r.get(searchKey) === id);
    
    if (row) {
      Object.entries(updates).forEach(([key, value]) => { 
        row.set(key, value as any); 
      });
      await row.save();
    } else if (target === 'Settings') {
      const newRow: any = { Key: id };
      Object.entries(updates).forEach(([key, value]) => { newRow[key] = value; });
      await sheet.addRow(newRow);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) { 
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}