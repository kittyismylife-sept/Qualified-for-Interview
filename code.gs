const SPREADSHEET_ID = "1AtD6L-fvGUIpzMTxOyfR2oC4EC0YQFEzrQhwEcxjV6c"; 
const SHEET_NAME_DB = "database"; 
const SHEET_NAME_RESULT = "Results"; 
const HR_EMAIL = "Wphupita@toyota.co.th"; 

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('ระบบตรวจสอบผลการคัดเลือก')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function checkID(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ws = ss.getSheetByName(SHEET_NAME_DB);
  const data = ws.getDataRange().getValues(); 

  const headers = data[0];
  
  // กำหนดชื่อหัวคอลัมน์
  const COL_NAME_PREFIX = "Title";
  const COL_NAME_ID     = "National ID Card";   
  const COL_NAME_TH     = "ชื่อ - นามสกุล (ENG)";     
  const COL_NAME_EMAIL  = "Email";             
  const COL_NAME_GROUP  = "Group";             
  const COL_NAME_LOC    = "สถานที่ฝึกงาน";       

  // หาตำแหน่ง Index
  const idxPrefix = headers.indexOf(COL_NAME_PREFIX); 
  const idxID     = headers.indexOf(COL_NAME_ID);
  const idxName   = headers.indexOf(COL_NAME_TH);
  const idxEmail  = headers.indexOf(COL_NAME_EMAIL);
  const idxGroup  = headers.indexOf(COL_NAME_GROUP);
  const idxLoc    = headers.indexOf(COL_NAME_LOC);

  // ตรวจสอบ Error Log
  if (idxID === -1) Logger.log("❌ หาคอลัมน์ ID ไม่เจอ");
  if (idxPrefix === -1) Logger.log("❌ หาคอลัมน์ คำนำหน้า ไม่เจอ");

  let inputID = String(id).trim();

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (idxID === -1) return { found: false };
    
    let dbID = String(row[idxID]).trim(); 
    let dbLast6 = dbID.length >= 6 ? dbID.slice(-6) : dbID;

    if (dbLast6 === inputID) {
      let prefix = (idxPrefix !== -1) ? row[idxPrefix] : "";
      let nameTh = (idxName !== -1) ? row[idxName] : "";
      let fullName = prefix + nameTh; 
      
      return {
        found: true,
        id: dbID, 
        name: fullName, 
        email: (idxEmail !== -1) ? row[idxEmail] : "",
        group: (idxGroup !== -1) ? row[idxGroup] : "",
        location: (idxLoc !== -1) ? row[idxLoc] : ""
      };
    }
  }
  return { found: false };
}

function processUserAction(userData, actionType) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let resultSheet = ss.getSheetByName(SHEET_NAME_RESULT);
  if (!resultSheet) {
    resultSheet = ss.insertSheet(SHEET_NAME_RESULT);
    resultSheet.appendRow(["Timestamp", "ID", "Name", "Group", "Action"]); 
  }

  resultSheet.appendRow([
    new Date(),          
    userData.id,         
    userData.name,       
    userData.group,      
    actionType           
  ]);

  const subjectHR = `[Update] ผู้สมัคร ${actionType}: ${userData.name}`;
  const bodyHR = `
    มีรายการใหม่จากระบบ:
    --------------------------------
    ชื่อ: ${userData.name}
    รหัส: ${userData.id}
    กลุ่มงาน: ${userData.group}
    สถานที่: ${userData.location}
    สถานะ: ${actionType === 'CONFIRM' ? '✅ ยืนยันสัมภาษณ์' : '❌ สละสิทธิ์/ไม่สะดวก'}
    --------------------------------
  `;
  
  try {
    MailApp.sendEmail(HR_EMAIL, subjectHR, bodyHR);
  } catch (e) { }

  return "SUCCESS";
}
