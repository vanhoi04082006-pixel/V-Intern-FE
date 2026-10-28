"use client";
import { useState } from 'react';
import { createCareerRole, updateCareerRole, type CareerContent, type CareerRole } from '@/lib/api/career-roles';
import { ErrorState } from '@/components/shared/data-state';
import { buttonClass, Field, inputClass } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';

const skills = (text: string) => text.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
export function CareerRoleEditor({ role, onSaved }: { role?: CareerRole; onSaved: (message: string) => void }) {
  const [code, setCode] = useState(role?.code ?? ''), [name, setName] = useState(role?.name ?? ''), [description, setDescription] = useState(role?.description ?? '');
  const [level, setLevel] = useState<CareerRole['level']>(role?.level ?? 'intern'), [language, setLanguage] = useState<CareerRole['language']>(role?.language ?? 'vi');
  const [required, setRequired] = useState(role?.requiredSkills.join('\n') ?? ''), [optional, setOptional] = useState(role?.optionalSkills.join('\n') ?? '');
  const [weights, setWeights] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(role?.competencyWeights ?? {}).map(([key, value]) => [key, String(value)])));
  const [status, setStatus] = useState<CareerRole['status']>(role?.status ?? 'draft'), [accepting, setAccepting] = useState(role?.acceptingApplications ?? false);
  const action = useAction(), requiredSkills = skills(required);
  const actualWeights = Object.fromEntries(requiredSkills.filter(skill => weights[skill]?.trim()).map(skill => [skill, Number(weights[skill])]));
  const sum = Object.values(actualWeights).reduce((total, weight) => total + weight, 0);
  return <form className="space-y-6" onSubmit={e => { e.preventDefault(); void action.run(async () => {
    const body: CareerContent = { name: name.trim(), description: description.trim(), level, language, requiredSkills, optionalSkills: skills(optional), competencyWeights: actualWeights };
    if (role) await updateCareerRole(role.code, { ...body, version: role.version, status, acceptingApplications: accepting });
    else await createCareerRole({ ...body, code: code.trim() });
    onSaved(role ? 'Đã lưu phiên bản mới của nghề nghiệp.' : 'Đã tạo bản nháp. Hoàn thiện và xuất bản khi sẵn sàng.');
  }); }}>
    <p className="text-body leading-6 text-muted-foreground">{role ? `Đang chỉnh sửa phiên bản ${role.version}. Mã nghề nghiệp giữ nguyên; mỗi lần lưu tạo một bản lịch sử mới.` : 'Nghề mới được tạo ở trạng thái bản nháp và chưa nhận hồ sơ. Không tạo thêm quyền tài khoản.'}</p>
    <fieldset disabled={action.busy} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Mã nghề nghiệp" htmlFor="career-code" hint="2–32 ký tự: chữ thường, số, gạch dưới; bắt đầu bằng chữ."><input id="career-code" className={inputClass} required minLength={2} maxLength={32} pattern="[a-z][a-z0-9_]{1,31}" disabled={Boolean(role)} value={code} onChange={e => setCode(e.target.value)} /></Field><Field label="Tên nghề nghiệp" htmlFor="career-name"><input id="career-name" className={inputClass} required minLength={2} maxLength={128} value={name} onChange={e => setName(e.target.value)} /></Field></div>
      <Field label="Mô tả" htmlFor="career-description" hint="Khi xuất bản, mô tả cần ít nhất 20 ký tự và nêu rõ công việc thực tập."><textarea id="career-description" className={inputClass} rows={3} maxLength={2000} minLength={status === 'published' ? 20 : 0} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Cấp độ" htmlFor="career-level"><select id="career-level" className={inputClass} value={level} onChange={e => setLevel(e.target.value as CareerRole['level'])}><option value="intern">Thực tập sinh</option><option value="junior">Junior</option></select></Field><Field label="Ngôn ngữ nội dung" htmlFor="career-language"><select id="career-language" className={inputClass} value={language} onChange={e => setLanguage(e.target.value as CareerRole['language'])}><option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option></select></Field></div>
      <section className="space-y-4 border-t border-border pt-5"><h3 className="font-semibold">Năng lực cần đánh giá</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Kỹ năng bắt buộc" htmlFor="career-required" hint="Mỗi dòng một kỹ năng hoặc phân cách bằng dấu phẩy. Không trùng nhau."><textarea id="career-required" className={inputClass} rows={3} value={required} onChange={e => setRequired(e.target.value)} /></Field><Field label="Kỹ năng tùy chọn" htmlFor="career-optional" hint="Bổ trợ cho vai trò, không trùng kỹ năng bắt buộc."><textarea id="career-optional" className={inputClass} rows={3} value={optional} onChange={e => setOptional(e.target.value)} /></Field></div>
        {requiredSkills.length > 0 && <div><p className={`mb-3 text-body ${sum === 100 ? 'text-success' : 'text-muted-foreground'}`}>Tổng trọng số: <strong>{sum}% / 100%</strong>. Điền đủ cho tất cả kỹ năng hoặc để trống khi lưu nháp.</p><div className="grid gap-3 sm:grid-cols-2">{[...new Set(requiredSkills)].map((skill, index) => <Field key={skill} label={`Trọng số ${skill} (%)`} htmlFor={`career-weight-${index}`}><input id={`career-weight-${index}`} type="number" min={1} max={100} step={1} className={inputClass} required={status === 'published'} value={weights[skill] ?? ''} onChange={e => setWeights(prior => ({ ...prior, [skill]: e.target.value }))} /></Field>)}</div></div>}
      </section>
      {role && <section className="space-y-4 border-t border-border pt-5"><h3 className="font-semibold">Xuất bản và nhận hồ sơ</h3><Field label="Trạng thái xuất bản" htmlFor="career-status"><select id="career-status" className={inputClass} value={status} onChange={e => { const next = e.target.value as CareerRole['status']; setStatus(next); if (next !== 'published') setAccepting(false); }}><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="archived">Đã lưu trữ</option></select></Field><label className="flex items-center gap-2 text-body"><input type="checkbox" checked={accepting} disabled={status !== 'published'} onChange={e => setAccepting(e.target.checked)} />Đang nhận hồ sơ</label><p className="text-caption leading-5 text-muted-foreground">Chỉ nghề đã xuất bản và mở nhận hồ sơ xuất hiện trong danh sách ứng tuyển. Cần đủ bộ câu hỏi để bắt đầu phỏng vấn.</p></section>}
    </fieldset>
    {Boolean(action.error) && <div className="space-y-2"><ErrorState error={action.error} /><p className="text-body text-muted-foreground">Bản nháp của bạn vẫn được giữ. Nếu có xung đột phiên bản, sao chép phần đang soạn, đóng form và tải lại danh sách trước khi mở bản mới để đối chiếu.</p></div>}
    <div className="border-t border-border pt-4"><button className={buttonClass} disabled={action.busy} type="submit">{action.busy ? 'Đang lưu…' : role ? 'Lưu thay đổi' : 'Tạo bản nháp'}</button></div>
  </form>;
}
