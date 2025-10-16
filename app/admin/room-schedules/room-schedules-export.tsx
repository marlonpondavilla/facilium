"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { getDocumentsFromFirestore, getFirstUserByDesignation, getSingleDocumentFromFirestore } from "@/data/actions";
import type { ApprovedScheduleDoc, ScheduleItem } from "@/types/SceduleInterface";
import type { AcademicYear } from "@/types/academicYearType";

export default function RoomSchedulesExport(){
  const [isExporting, setIsExporting] = React.useState(false);

  const exportAll = React.useCallback(async () => {
    // open popup window synchronously
    const popup = window.open("", "_blank", "width=1000,height=1200");
    if (!popup) {
      alert("Please allow popups to generate the PDF.");
      return;
    }
    popup.document.write(`<!DOCTYPE html><html><head><title>Generating…</title><meta charset='utf-8' /></head><body style="font-family:system-ui,Arial,sans-serif;padding:16px"><p style="font-size:14px;">Preparing all approved room schedules… Please wait.</p></body></html>`);
    popup.document.close();

    setIsExporting(true);
    try {
      // Fetch all approved docs and classrooms
      const approved = await getDocumentsFromFirestore<ApprovedScheduleDoc>("approvedScheduleData");
      const classroomIds = Array.from(new Set((approved||[]).map(d=>d.classroomId).filter(Boolean)));
      if (classroomIds.length === 0) throw new Error("No approved room schedules found.");

      // Active AY label (optional)
      let activeAYLabel = "";
      try {
        const years = await getDocumentsFromFirestore<AcademicYear>("academic-years");
        const active = years.find((y) => y.isActive);
        if (active) activeAYLabel = `Academic Year ${active.startAcademicYear}-${active.endAcademicYear}, ${active.term} Term`;
      } catch {}

      // Dean name
      let deanName = "";
      try {
        const dean = await getFirstUserByDesignation("Dean");
        if (dean) deanName = `${dean.firstName ?? ""} ${dean.lastName ?? ""}`.trim();
      } catch {}

      // Precompute professor names map to reduce lookups
      const allItems: Array<{ roomId: string; item: ScheduleItem }>=[];
      for(const doc of approved){
        for(const it of (doc.scheduleItems||[])){
          allItems.push({ roomId: doc.classroomId, item: { ...it, classroomId: doc.classroomId }});
        }
      }
      const professorIds = Array.from(new Set(allItems.map(x=>x.item.professor)));
      const professorNames: Record<string,string> = {};
      await Promise.all(professorIds.map(async pid=>{
        const first = await getSingleDocumentFromFirestore(pid, "userData", "firstName");
        const last = await getSingleDocumentFromFirestore(pid, "userData", "lastName");
        professorNames[pid] = [first,last].filter(Boolean).join(" ") || "Unknown";
      }));

      // Build pages for each classroom
      const days = ["Mon","Tues","Wed","Thurs","Fri","Sat"];
      const getStartIndex = (start:number)=> Math.round((start-7)*2);
      const getRowSpan = (dur:number, halfHour?:number)=> dur*2 + (halfHour===30?1:0);
      const slotsCount = (20-7)*2 + 1;
      const hours: string[] = Array.from({ length: slotsCount }, (_, i) => {
        const baseMinutes = i * 30;
        const startHour24 = 7 + Math.floor(baseMinutes / 60);
        const startMin = baseMinutes % 60 === 0 ? "00" : "30";
        const endMinutes = baseMinutes + 30;
        const endHour24 = 7 + Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60 === 0 ? "00" : "30";
        const formatHour = (h: number) => { const h12 = h % 12 === 0 ? 12 : h % 12; return h12.toString(); };
        return `${formatHour(startHour24)}:${startMin} - ${formatHour(endHour24)}:${endMin}`;
      });

      const parts: string[] = [];
      for(const roomId of classroomIds){
        const items = allItems.filter(x=>x.roomId===roomId).map(x=>x.item);
        if (!items.length) continue;
        const roomName = (await getSingleDocumentFromFirestore(roomId, "classrooms", "classroomName")) || roomId;
        const submittedBy = (approved.find(d=>d.classroomId===roomId)?.submittedBy) || "";
        const skipMap: Record<string, boolean> = {};
        const bodyRows = hours.map((label,rowIdx)=>{
          const cells: string[] = [];
          cells.push(`<td class='time'>${label}</td>`);
          days.forEach((day)=>{
            const cellKey = `${day}-${rowIdx}`;
            if (skipMap[cellKey]) return;
            const item = items.find(it=> it.day===day && getStartIndex(it.start)===rowIdx);
            if (item){
              const rowSpan = getRowSpan(item.duration, item.halfHour);
              for(let r=1;r<rowSpan;r++) skipMap[`${day}-${rowIdx+r}`]=true;
              const prof = professorNames[item.professor] || "";
              const content = `${item.courseCode}<br/>${item.section}<br/>${prof}<br/>(${roomName})`;
              cells.push(`<td class='entry' rowspan='${rowSpan}'>${content}</td>`);
            } else {
              cells.push(`<td></td>`);
            }
          });
          return `<tr>${cells.join("")}</tr>`;
        }).join("");

        const timestamp = new Date().toLocaleString("en-PH", { dateStyle:"medium", timeStyle:"short" });
        const preparedByDisplay = submittedBy ? `${submittedBy}` : "_________";

        parts.push(`
<section class='page'>
  <div class='header'>
    <img class='logo' src='${window.location.origin}/bsu-meneses-logo.png' alt='Logo' />
    <div class='branding'>
      <h1>Bulacan State University – Meneses Campus</h1>
      <h2>Official Classroom Schedule</h2>
      <div class='meta'>Room: <span class='badge'>${roomName}</span>${activeAYLabel?` &nbsp; | &nbsp; ${activeAYLabel}`:""} &nbsp; | &nbsp; Printed: ${timestamp}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Time</th>${days.map(d=>`<th>${d}</th>`).join("")}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class='signatures'>
    <div>Prepared by: ${preparedByDisplay}</div>
    <div>Approved by: ${deanName || "Campus Dean"}${deanName?", Campus Dean":""}</div>
  </div>
  <div class='footer'>Generated via Facilium</div>
</section>`);
      }

      const style = `
<style>
@page { size:A4 portrait; margin:10mm 8mm 10mm 8mm; }
:root { --accent:#4f46e5; --border:#cbd5e1; --muted:#64748b; }
body { font-family:system-ui, Arial, sans-serif; margin:0; padding:0; color:#0f172a; }
.page { page-break-after: always; }
.header { display:flex; align-items:center; gap:12px; border-bottom:1.5px solid var(--accent); padding:6px 0 4px; margin-bottom:8px; }
.logo { height:46px; width:auto; object-fit:contain; }
.branding h1 { font-size:16px; margin:0; letter-spacing:0.25px; }
.branding h2 { font-size:11px; margin:1px 0 0; font-weight:600; color:var(--muted); }
.meta { font-size:9px; margin-top:2px; color:#334155; }
table { width:100%; border-collapse:collapse; font-size:9.2px; table-layout:fixed; }
thead th { background:#fbcfe8; font-weight:700; font-size:9px; color:#000; padding:6px 4px; vertical-align:middle; border-bottom:2px solid var(--accent); box-shadow: inset 0 0 0 1000px #fbcfe8; -webkit-print-color-adjust: exact; }
th, td { border:1px solid var(--border); padding:6px 4px; text-align:center; vertical-align:middle; word-wrap:break-word; line-height:1.35; }
tbody td { font-size:8.4px; }
tbody tr:nth-child(odd) { background:#fafafa; }
.badge { display:inline-block; padding:1px 6px; border:1px solid var(--accent); border-radius:999px; font-size:9.2px; font-weight:600; color:var(--accent); }
.footer { margin-top:8px; font-size:8px; color:var(--muted); text-align:right; }
.time { font-weight:600; background:#f8fafc; }
.entry { font-weight:500; }
.signatures { margin-top:20px; font-size:10px; display:flex; justify-content:space-between; }
.signatures div { min-width:45%; }
@media print { .no-print { display:none!important; } }
</style>`;

      const docHtml = `<!DOCTYPE html><html><head><meta charset='utf-8' /><title>All Room Schedules</title>${style}</head><body>${parts.join("\n")}
<script>(function(){
 function doPrint(){ setTimeout(()=>window.print(),60);} 
 const imgs=[...document.images]; if(!imgs.length){doPrint();return;} let done=0; imgs.forEach(img=>{ if(img.complete){ if(++done===imgs.length) doPrint(); } else { img.addEventListener('load',()=>{ if(++done===imgs.length) doPrint();}); img.addEventListener('error',()=>{ if(++done===imgs.length) doPrint();}); }});
})();</script>
</body></html>`;

      popup.document.open();
      popup.document.write(docHtml);
      popup.document.close();
    } catch (e: unknown) {
      console.error(e);
      if (popup && !popup.closed){
        popup.document.open();
        const msg = (e && typeof e === 'object' && 'message' in e) ? (e as { message?: string }).message : 'Unknown error';
        popup.document.write(`<!DOCTYPE html><html><head><title>Error</title><meta charset='utf-8' /></head><body style="font-family:system-ui,Arial,sans-serif;padding:16px;color:#b91c1c"><h1 style="font-size:16px;margin-top:0;">Failed to generate schedules</h1><pre style="white-space:pre-wrap;font-size:12px;">${msg}</pre><p>Please try again.</p></body></html>`);
        popup.document.close();
      }
      alert("Failed to export");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="facilium-bg-whiter p-4 rounded-2xl border w-full max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold mb-2">Download All Room Schedules (Approved)</h1>
      <p className="text-sm text-gray-600 mb-4">Generates a multi-page PDF, one page per classroom that has approved schedules.</p>
      <Button className="facilium-bg-indigo" onClick={exportAll} disabled={isExporting}>
        {isExporting? "Generating…" : "Download PDF"}
      </Button>
    </div>
  );
}
