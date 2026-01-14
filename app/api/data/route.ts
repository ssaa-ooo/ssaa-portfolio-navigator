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
    
    const rows = await doc.sheetsByTitle['Evaluations'].getRows();
    const projects = rows.map(row => ({
      id: row.get('ProjectID'), name: row.get('ProjectName'),
      ssV: Number(row.get('SS_Vision') || 0), ssR: Number(row.get('SS_Resonance') || 0), ssC: Number(row.get('SS_Context') || 0),
      vvM: Number(row.get('VV_Market') || 0), vvS: Number(row.get('VV_Speed') || 0), vvF: Number(row.get('VV_Friction') || 0),
      hours: Number(row.get('Work_Hours') || 0), lead: row.get('Lead_Person') || "",
      status: row.get('Status') || "Green", insight: row.get('SSAA_Insight') || "",
      tRev: Number(row.get('Target_Revenue') || 0), aRev: Number(row.get('Actual_Revenue') || 0),
      tProf: Number(row.get('Target_Profit') || 0), aProf: Number(row.get('Actual_Profit') || 0),
      kpiName: row.get('KPI_Name') || "", kpiT: Number(row.get('KPI_Target') || 0), kpiA: Number(row.get('KPI_Actual') || 0),
      decisionDate: row.get('Decision_Date') || "", verdict: row.get('Verdict') || "Pending"
    }));

    const settingsRows = await doc.sheetsByTitle['Settings'].getRows();
    const settings: any = {};
    settingsRows.forEach(row => { settings[row.get('Key')] = row.get('Value'); });

    const historyRows = await historySheetRows(doc);
    return NextResponse.json({ projects, settings, history: historyRows });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

async function historySheetRows(doc: any) {
  try {
    const historySheet = doc.sheetsByTitle['History'];
    const rows = await historySheet.getRows();
    const historyMap: any = {};
    rows.forEach((row: any) => {
      historyMap[row.get('ProjectID')] = {
        x: ((Number(row.get('SS_Vision'))*0.4)+(Number(row.get('SS_Resonance'))*0.3)+(Number(row.get('SS_Context'))*0.3))*20,
        y: ((Number(row.get('VV_Market'))*0.4)+(Number(row.get('VV_Speed'))*0.4)+(Number(row.get('VV_Friction'))*0.2))*20
      };
    });
    return historyMap;
  } catch { return {}; }
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
      const evalRows = await doc.sheetsByTitle['Evaluations'].getRows();
      for (const row of evalRows) {
        await historySheet.addRow({
          Date: new Date().toLocaleDateString('ja-JP'), ProjectID: row.get('ProjectID'),
          SS_Vision: row.get('SS_Vision'), SS_Resonance: row.get('SS_Resonance'), SS_Context: row.get('SS_Context'),
          VV_Market: row.get('VV_Market'), VV_Speed: row.get('VV_Speed'), VV_Friction: row.get('VV_Friction'),
          Work_Hours: row.get('Work_Hours'), Actual_Revenue: row.get('Actual_Revenue'), Actual_Profit: row.get('Actual_Profit')
        });
      }
      return NextResponse.json({ success: true });
    }

    const sheet = doc.sheetsByTitle[target];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get(target === 'Evaluations' ? 'ProjectID' : 'Key') === id);
    if (row) {
      Object.entries(updates).forEach(([k, v]) => row.set(k, String(v)));
      await row.save();
    }
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}