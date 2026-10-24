import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { parseLearningPackage, parseTemplateAssessment, starterArchive } from '../template-materials';
const source = { schemaVersion: 1, prerequisites: ['Node 22'], setup: 'Chuẩn bị môi trường local', run: 'node demo.cjs', starterFiles: [{ path: 'src/model.cjs', content: 'module.exports = {};' }], sampleData: [{ path: 'data/sample.json', content: '[]' }] };
describe('public and private template materials', () => {
  it('parses public v1 packages and produces a standard ZIP containing only public files', () => {
    const parsed = parseLearningPackage(source); const files = unzipSync(starterArchive(parsed));
    expect(Object.keys(files).sort()).toEqual(['data/sample.json', 'src/model.cjs']);
    expect(strFromU8(files['src/model.cjs'])).toBe(source.starterFiles[0].content);
    expect(parseLearningPackage(undefined)).toBeNull();
  });
  it('rejects unsupported, unsafe, colliding and oversized package data before preview or download', () => {
    for (const path of ['../secret', '/absolute', 'C:/file', 'src\\file.js', '.git/config', 'CON.txt']) expect(() => parseLearningPackage({ ...source, starterFiles: [{ path, content: '' }] })).toThrow();
    expect(() => parseLearningPackage({ ...source, schemaVersion: 2 })).toThrow();
    expect(() => parseLearningPackage({ ...source, assessment: {} })).toThrow();
    expect(() => parseLearningPackage({ ...source, starterFiles: [{ path: 'src', content: '' }, { path: 'src/a.js', content: '' }] })).toThrow();
    expect(() => parseLearningPackage({ ...source, starterFiles: [{ path: 'A.js', content: '' }, { path: 'a.js', content: '' }] })).toThrow();
    expect(() => parseLearningPackage({ ...source, starterFiles: [{ path: 'a.js', content: 'x'.repeat(20001) }] })).toThrow();
  });
  it('parses private material only through its own schema, preserving the explicit null assessment', () => {
    const assessment = { schemaVersion: 1, solutionFiles: [{ path: 'src/model.cjs', content: 'private reference' }], hiddenTestFiles: [{ path: 'checks/behavior.json', content: '[]' }], rubric: [{ criterion: 'Hành vi', description: 'Kiểm theo bằng chứng', weight: 100 }], taskSuites: [{ taskKey: 'core', suiteId: 'mini-notes-v1', digest: 'a'.repeat(64) }] };
    expect(parseTemplateAssessment(assessment)?.rubric[0].weight).toBe(100);
    expect(parseTemplateAssessment(null)).toBeNull();
    expect(() => parseTemplateAssessment({ ...assessment, rubric: [{ ...assessment.rubric[0], weight: 90 }] })).toThrow();
  });
});
