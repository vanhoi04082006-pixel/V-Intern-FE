import { describe,expect,it } from 'vitest';
import { parseSavedReport,reportCsv,reportScope } from '../reports';
describe('report snapshot exports',()=>{
  it('uses inclusive calendar end date with an exclusive backend boundary',()=>{
    expect(reportScope('project','','2026-10-10','2026-10-10')).toEqual({projectId:'project',from:'2026-10-10T00:00:00.000Z',to:'2026-10-11T00:00:00.000Z'});
  });
  it('preserves unmeasured scores and protects formula-like names in Excel',()=>{
    const report=parseSavedReport({id:'id',title:'=formula',kind:'progress',projectId:'p',createdAt:'2026-10-10',snapshot:{projectName:'Dự án',scope:{projectId:'p'},members:[{userId:'u',displayName:'=HYPERLINK("bad")',totalTaskCount:2,completedTaskCount:1,taskCompletionRate:50,averageEvaluationScore:null,overdueOpenTaskCount:0,submissionCount:0,approvedCount:0,reworkCount:0}]}});
    expect(report.snapshot.members[0].averageEvaluationScore).toBeNull();
    const csv=reportCsv(report);expect(csv).toContain("'=formula");expect(csv).toContain("'=HYPERLINK");expect(csv).toContain('Dự án');
  });
  it('rejects malformed stored metrics rather than showing a made up zero',()=>{
    expect(()=>parseSavedReport({id:'id',title:'t',kind:'progress',projectId:'p',createdAt:'2026',snapshot:{scope:{projectId:'p'},projectName:'p',members:[{userId:'u'}]}})).toThrow();
  });
});
