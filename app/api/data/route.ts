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
    
    const evalSheet = doc.sheetsByTitle['Evaluations'];
    const evalRows = await evalSheet.getRows();
    const projects = evalRows.map(row => ({
      id: row.get('ProjectID'), name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision') || 0), ssR: Number(row.get('SS_Resonance') || 0), ssC: Number(row.get('SS_Context') || 0),
      vvM: Number(row.get('VV_Market') || 0), vvS: Number(row.get('VV_Speed') || 0), vvF: Number(row.get('VV_Friction') || 0),
      z: Number(row.get('Asset_Volume') || 50), lead: row.get('Lead_Person') || "未割当",
      status: row.get('Status') || "Green", insight: row.get('SSAA_Insight') || ""
    }));

    const settingsSheet = doc.sheetsByTitle['Settings'];
    const settingsRows = await settingsSheet.getRows();
    const settings: any = {};
    settingsRows.forEach(row => { settings[row.get('Key')] = row.get('Value'); });

    const historySheet = doc.sheetsByTitle['History'];
    const historyRows = await historySheet.getRows();
    const historyMap: any = {};
    historyRows.forEach(row => {
      const pid = row.get('ProjectID');
      historyMap[pid] = {
        x: ((Number(row.get('SS_Vision'))*0.4)+(Number(row.get('SS_Resonance'))*0.3)+(Number(row.get('SS_Context'))*0.3))*20,
        y: ((Number(row.get('VV_Market'))*0.4)+(Number(row.get('VV_Speed'))*0.4)+(Number(row.get('VV_Friction'))*0.2))*20
      };
    });

    return NextResponse.json({ projects, settings, history: historyMap });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { target, id, updates } = body;
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();

    if (target === 'Snapshot') {
      const historySheet = doc.sheetsByTitle['History'];
      const evalSheet = doc.sheetsByTitle['Evaluations'];
      const rows = await evalSheet.getRows();
      const date = new Date().toLocaleDateString('ja-JP');
      for (const row of rows) {
        await historySheet.addRow({
          Date: date, ProjectID: row.get('ProjectID'),
          SS_Vision: row.get('SS_Vision'), SS_Resonance: row.get('SS_Resonance'), SS_Context: row.get('SS_Context'),
          VV_Market: row.get('VV_Market'), VV_Speed: row.get('VV_Speed'), VV_Friction: row.get('VV_Friction'),
          Asset_Volume: row.get('Asset_Volume')
        });
      }
      return NextResponse.json({ success: true });
    }

    const sheet = doc.sheetsByTitle[target];
    const rows = await sheet.getRows();
    const searchKey = target === 'Evaluations' ? 'ProjectID' : 'Key';
    const row = rows.find(r => r.get(searchKey) === id);
    if (row) {
      const upds = updates as Record<string, any>;
      Object.entries(upds).forEach(([k, v]) => row.set(k, String(v)));
      await row.save();
    }
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}