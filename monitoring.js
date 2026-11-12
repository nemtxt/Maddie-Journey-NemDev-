/* Maddie Journey · read-only 201 files and calendar presentation.
 * Fictional fixture only; no Drive API, document mutations or calendar writes.
 */
(function(root){
  'use strict';
  const esc=function(v){return String(v===null||v===undefined?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });};
  const docLabels={'complete':'Complete','missing':'Missing','not-checked':'Not checked','not-applicable':'Not applicable'};
  const icon=function(name){return root.MJ_ICONS.svg(name);};
  const documentIcons={Employment:'briefcase',Contracts:'file',Personal:'id-card',Government:'shield'};
  const statusIcons={'complete':'check','missing':'alert-circle','not-checked':'clock','not-applicable':'minus'};
  const eventIcons={checkin:'clock',employment:'briefcase',milestone:'award',change:'activity'};
  function fileStatus(employee,docs){
    const missing=[],unchecked=[],applicable=[],complete=[];
    docs.forEach(function(doc){
      const state=employee.files201&&employee.files201[doc.id];
      if(state==='missing')missing.push(doc);
      if(state==='not-checked')unchecked.push(doc);
      if(state!=='not-applicable'){
        applicable.push(doc);
        if(state==='complete')complete.push(doc);
      }
    });
    return {employee:employee,missing:missing,unchecked:unchecked,applicable:applicable,complete:complete,
      status:missing.length?'missing':unchecked.length?'not-checked':'complete'};
  }
  function fileSummary(snapshot){
    const docs=snapshot.documents201||[],rows=snapshot.employees.map(function(e){return fileStatus(e,docs);});
    const groups={
      missing:rows.filter(function(r){return r.status==='missing';}),
      'not-checked':rows.filter(function(r){return r.status==='not-checked';}),
      complete:rows.filter(function(r){return r.status==='complete';}),all:rows
    };
    return {docs:docs,rows:rows,groups:groups,total:rows.length};
  }
  function fileView(snapshot,ui){
    const summary=fileSummary(snapshot),active=summary.groups[ui.filesFilter]?ui.filesFilter:'missing';
    const display=summary.groups[active].slice().sort(function(a,b){
      return b.missing.length-a.missing.length||a.employee.name.localeCompare(b.employee.name);
    });
    const visible=ui.filesExpanded?display:display.slice(0,12),total=summary.total;
    const docCards=summary.docs.map(function(doc){
      const count=function(state){return summary.rows.filter(function(row){
        return row.employee.files201[doc.id]===state;
      }).length;};
      const complete=count('complete'),missing=count('missing'),unchecked=count('not-checked'),na=count('not-applicable');
      return '<article class="monitor-file-card" data-group="'+esc(doc.group)+'"><span class="monitor-file-heading"><span class="monitor-file-symbol" aria-hidden="true">'+icon(documentIcons[doc.group]||'file')+'</span><span class="monitor-file-type">'+esc(doc.group)+'</span></span>'+
        '<h3>'+esc(doc.label)+'</h3><strong>'+complete+' <small>/ '+(total-na)+' applicable complete</small></strong>'+
        '<div class="monitor-file-counts"><span>'+missing+' missing</span><span>'+unchecked+' not checked</span>'+
        (na?'<span>'+na+' N/A</span>':'')+'</div></article>';
    }).join('');
    const choices=[['missing','Missing documents'],['not-checked','Not checked'],
      ['complete','Complete'],['all','All employees']];
    const tabs=choices.map(function(c){
      return '<button type="button" class="monitor-filter'+(active===c[0]?' active':'')+
        '" data-action="files-filter" data-kind="'+c[0]+'" aria-pressed="'+(active===c[0])+'">'+
        '<span class="monitor-filter-symbol" aria-hidden="true">'+icon(statusIcons[c[0]]||'list')+'</span>'+esc(c[1])+' <b>'+summary.groups[c[0]].length+'</b></button>';
    }).join('');
    const people=visible.map(function(row){
      const e=row.employee,relevant=row.status==='missing'?row.missing:
        row.status==='not-checked'?row.unchecked:row.applicable;
      const description=row.status==='complete'?'All applicable requirements complete':
        relevant.map(function(doc){return doc.label;}).join(' · ');
      return '<tr><th scope="row"><strong>'+esc(e.name)+'</strong><small>'+esc(e.id)+
        ' · '+esc((snapshot.divisions.find(function(d){return d.id===e.division;})||{}).short||e.division)+'</small></th>'+
        '<td><span class="monitor-file-status monitor-file-'+row.status+'">'+icon(statusIcons[row.status]||'info')+esc(docLabels[row.status])+'</span></td>'+
        '<td class="monitor-file-requirements">'+esc(description)+'</td>'+
        '<td><button class="button small" type="button" data-action="open" data-id="'+esc(e.id)+
        '" data-detail="files201">Inspect</button></td></tr>';
    }).join('');
    return '<p class="monitor-provenance" role="note"><strong>Fictional tracker snapshot.</strong> '+
      total+' example employee records, '+summary.docs.length+
      ' sample document types. The official 201 tracker and Google Drive folders are not connected.</p>'+
      '<section class="panel monitor-documents"><div class="panel-head"><div><h2>By document</h2>'+
      '<p>Document coverage across all '+total+' fictional employees</p></div>'+
      '<span class="monitor-section-note">Complete · Missing · Not checked · N/A</span></div>'+
      '<div class="monitor-files-grid">'+docCards+'</div></section>'+
      '<section class="panel monitor-missing"><div class="panel-head"><div>'+
      '<h2>Who is missing what</h2><p>Named employees and the exact document requirements recorded as outstanding</p></div>'+
      '<span class="monitor-section-note">'+display.length+' employees in this view</span></div>'+
      '<div class="monitor-filterbar" role="group" aria-label="201 document status filters">'+tabs+'</div>'+
      '<div class="table-wrap"><table class="table monitor-files-table"><thead><tr>'+
      '<th scope="col">Employee</th><th scope="col">Status</th><th scope="col">Specific documents</th>'+
      '<th scope="col">Details</th></tr></thead><tbody>'+
      (people||'<tr><td colspan="4">No employees match this sample status.</td></tr>')+
      '</tbody></table></div>'+
      (display.length>12?'<div class="monitor-list-footer"><button type="button" class="button small" '+
        'data-action="files-more">'+(ui.filesExpanded?'Show fewer':'Show all '+display.length)+'</button></div>':'')+
      '<p class="report-source-note">Missing means at least one missing requirement; Not checked means no missing item but at least one unchecked requirement; Complete means all applicable items are marked complete. Not applicable is excluded from missing counts. No documents can be uploaded or edited here.</p></section>';
  }
  function employeeFiles(snapshot,e){
    const docs=snapshot.documents201||[],status=fileStatus(e,docs);
    return '<section class="panel monitor-person-documents"><div class="panel-head"><div>'+
      '<h2>201 Files Checklist</h2><p>Fictional per-document statuses · not verified against an official file folder</p></div>'+
      '<span class="monitor-file-status monitor-file-'+status.status+'">'+icon(statusIcons[status.status]||'info')+esc(docLabels[status.status])+'</span></div>'+
      '<div class="table-wrap"><table class="table monitor-file-detail-table"><thead><tr>'+
      '<th scope="col">Requirement</th><th scope="col">Recorded status</th></tr></thead><tbody>'+
      docs.map(function(d){
        const state=e.files201[d.id];
        return '<tr><th scope="row">'+esc(d.label)+'</th><td><span class="monitor-file-status monitor-file-'+
          esc(state)+'">'+icon(statusIcons[state]||'info')+esc(docLabels[state])+'</span></td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="report-source-note">This document checklist is synthetic demonstration data. No source file or real verification is implied.</p></section>';
  }
  function todayManila(){
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',
        year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
      const value=function(k){return parts.find(function(p){return p.type===k;}).value;};
      return value('year')+'-'+value('month')+'-'+value('day');
    }catch(err){return new Date().toISOString().slice(0,10);}
  }
  function monthShift(m,delta){
    const d=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7))-1+delta,1));
    return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
  }
  function addMonths(date,months){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return '';
    const d=new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7))-1+months,1));
    const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
    return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+
      String(Math.min(end,Number(date.slice(8,10)))).padStart(2,'0');
  }
  function events(snapshot,start){
    const first=start+'-01',end=monthShift(start,3)+'-01',rows=[];
    const add=function(e,date,type,title,provenance){
      if(date>=first&&date<end)rows.push({employee:e,date:date,type:type,title:title,provenance:provenance});
    };
    const y0=Number(start.slice(0,4)),y1=Number(monthShift(start,2).slice(0,4));
    snapshot.employees.forEach(function(e){
      add(e,addMonths(e.startDate,3),'checkin','Third-month check-in','Calculated demo date');
      add(e,addMonths(e.startDate,5),'checkin','Fifth-month check-in','Calculated demo date');
      add(e,addMonths(e.startDate,6),'employment','Six-month probation checkpoint','Calculated demo date');
      for(let y=y0;y<=y1;y++){
        add(e,y+'-'+e.birthday.slice(5),'milestone','Birthday','Fictional profile date');
        const yearStart=y+'-'+e.startDate.slice(5);
        if(yearStart>e.startDate)add(e,yearStart,'milestone','Work anniversary','Calculated from sample start date');
      }
      (e.promotions||[]).forEach(function(p){
        add(e,p.date,'change','Promotion · '+(p.status||'Recorded'),'Explicit fictional promotion');
      });
    });
    const order={employment:0,checkin:1,change:2,milestone:3};
    return rows.sort(function(a,b){
      return a.date.localeCompare(b.date)||order[a.type]-order[b.type]||
        a.employee.name.localeCompare(b.employee.name)||a.title.localeCompare(b.title);
    });
  }
  function readableDate(date){
    return new Date(date+'T00:00:00Z').toLocaleDateString('en-PH',
      {month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  }
  function monthPanel(month,rows,ui){
    const first=new Date(month+'-01T00:00:00Z'),offset=first.getUTCDay(),
      number=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
    const monthName=first.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'});
    const all=rows.filter(function(e){return e.date.startsWith(month);});
    const selected=(ui.calendarSelected||'').startsWith(month)?ui.calendarSelected:'';
    const today=todayManila(),n=Math.ceil((offset+number)/7)*7;
    const slots=Array.from({length:n},function(_,index){
      const day=index-offset+1;
      if(day<1||day>number)return '<span class="monitor-calendar-empty" aria-hidden="true"></span>';
      const date=month+'-'+String(day).padStart(2,'0'),matching=all.filter(function(e){return e.date===date;});
      const inner='<span class="monitor-calendar-date-number">'+day+'</span>'+
        (matching.length?'<span class="monitor-calendar-dots" aria-hidden="true">'+
          Array.from(new Set(matching.map(function(e){return e.type;}))).slice(0,3).map(function(type){
            return '<i class="monitor-calendar-dot type-'+type+'"></i>';
          }).join('')+'</span>':'');
      return matching.length?'<button type="button" class="monitor-calendar-date has-events'+
        (date===today?' today':'')+(date===selected?' selected':'')+'" data-action="calendar-day" data-date="'+
        date+'" aria-pressed="'+(date===selected)+'" aria-label="'+esc(readableDate(date))+', '+
        matching.length+' fictional events">'+inner+'</button>':
        '<span class="monitor-calendar-date'+(date===today?' today':'')+'" aria-label="'+
        esc(readableDate(date))+'">'+inner+'</span>';
    }).join('');
    const detail=selected?all.filter(function(e){return e.date===selected;}):all;
    const expanded=ui.calendarExpanded===month,shown=expanded?detail:detail.slice(0,4);
    const kinds={checkin:0,employment:0,milestone:0,change:0};
    all.forEach(function(e){kinds[e.type]++;});
    return '<section class="panel monitor-calendar-month" aria-label="'+esc(monthName)+' calendar">'+
      '<div class="monitor-calendar-month-heading"><h2>'+esc(monthName)+'</h2>'+
      '<span>'+all.length+' dates</span></div>'+
      '<div class="monitor-calendar-weekdays" aria-hidden="true">'+
      ['S','M','T','W','T','F','S'].map(function(d){return '<span>'+d+'</span>';}).join('')+'</div>'+
      '<div class="monitor-calendar-grid">'+slots+'</div>'+
      '<div class="monitor-calendar-month-summary">'+
      Object.keys(kinds).filter(function(k){return kinds[k];}).map(function(k){
        return '<span class="monitor-calendar-count type-'+esc(k)+'">'+kinds[k]+' '+esc(k==='checkin'?'check-ins':k==='employment'?'employment':
          k==='change'?'changes':'milestones')+'</span>';
      }).join('')+'</div>'+
      '<div class="monitor-calendar-events"><div class="monitor-calendar-events-heading"><strong>'+
      (selected?'Events · '+esc(readableDate(selected)):'Dated sample events')+'</strong>'+
      (selected?'<button class="button small" type="button" data-action="calendar-all-days" data-month="'+month+
        '">All dates</button>':'')+'</div>'+
      (shown.length?shown.map(function(e){
        return '<button type="button" class="monitor-calendar-event" data-action="open" data-id="'+
          esc(e.employee.id)+'" data-detail="'+(e.type==='checkin'||e.type==='employment'?'journey':'milestones')+'">'+
          '<time datetime="'+e.date+'">'+esc(e.date.slice(8))+' '+
          esc(new Date(e.date+'T00:00:00Z').toLocaleDateString('en-PH',{month:'short',timeZone:'UTC'}))+'</time>'+
          '<span><b>'+esc(e.employee.name)+'</b><small>'+esc(e.title)+' · '+esc(e.provenance)+'</small></span>'+
          '<span class="monitor-calendar-event-arrow" aria-hidden="true">'+icon('arrow-up-right')+'</span></button>';
      }).join(''):'<p class="monitor-calendar-empty-message">No example events for this view.</p>')+
      (!selected&&detail.length>4?'<button class="button small monitor-calendar-more" type="button" '+
        'data-action="calendar-more" data-month="'+month+'">'+
        (expanded?'Show fewer':'+'+(detail.length-4)+' more dates')+'</button>':'')+
      '</div></section>';
  }
  function calendarView(snapshot,ui){
    const month=ui.calendarStart||todayManila().slice(0,7),
      months=[month,monthShift(month,1),monthShift(month,2)],all=events(snapshot,month);
    const types=[['all','All dates'],['checkin','Check-ins'],['employment','Employment'],
      ['milestone','Milestones'],['change','Changes']];
    const filtered=ui.calendarType==='all'?all:all.filter(function(e){return e.type===ui.calendarType;});
    const monthText=function(m){return new Date(m+'-01T00:00:00Z').toLocaleDateString('en-PH',
      {month:'short',year:'numeric',timeZone:'UTC'});};
    return '<div class="monitor-calendar-workspace">'+
      '<div class="monitor-calendar-toolbar"><div><h2>Three-month outlook</h2><p>'+
      esc(monthText(month))+' – '+esc(monthText(months[2]))+' · '+
      filtered.length+' of '+all.length+' fictional dates displayed</p></div>'+
      '<div class="monitor-calendar-controls" role="group" aria-label="Calendar range">'+
      '<button class="button small" type="button" data-action="calendar-shift" data-shift="-3">'+icon('arrow-left')+' Previous</button>'+
      '<button class="button small" type="button" data-action="calendar-today">Today</button>'+
      '<button class="button small" type="button" data-action="calendar-shift" data-shift="3">Next '+icon('arrow-right')+'</button>'+
      '</div></div>'+
      '<div class="monitor-calendar-typebar" role="group" aria-label="Calendar event filters">'+
      types.map(function(type){return '<button type="button" class="monitor-filter'+
        (ui.calendarType===type[0]?' active':'')+'" data-action="calendar-type" data-kind="'+type[0]+
        '" aria-pressed="'+(ui.calendarType===type[0])+'">'+'<span class="monitor-filter-symbol" aria-hidden="true">'+icon(eventIcons[type[0]]||'calendar')+'</span>'+esc(type[1])+'</button>';}).join('')+'</div>'+
      '<div class="monitor-calendar-three">'+months.map(function(m){return monthPanel(m,filtered,ui);}).join('')+'</div>'+
      '<p class="report-source-note">This calendar contains only fictional profile dates, recorded sample promotions and computed check-in/probation milestones. Calculated dates are not confirmed appointments, statutory deadlines or booked meetings. No PIP/LIP tracker or live calendar provider is connected.</p></div>';
  }
  root.MJ_MONITORING=Object.freeze({fileSummary:fileSummary,fileView:fileView,
    employeeFiles:employeeFiles,todayManila:todayManila,monthShift:monthShift,
    events:events,calendarView:calendarView});
})(window);
