/** V-Intern's original notebook companion, not a task or achievement indicator. */
export function NotebookCompanion({ teaching = false, compact = false }: {
  teaching?: boolean;
  compact?: boolean;
}) {
  return (
    <svg className={`workspace-artwork${compact ? " workspace-artwork-compact" : ""}`} viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <ellipse cx="123" cy="145" rx="70" ry="7" fill="#DCE7F8" />
      <path d="M33 42h176M33 65h176M33 88h176M33 111h176M56 23v106M79 23v106M102 23v106M125 23v106M148 23v106M171 23v106M194 23v106" stroke="#DBE6F6" strokeWidth="1" />
      <path d="m82 119-11 18h23m60-18 11 18h-23" stroke="#365B9A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M75 35q-9 0-9 10v72q0 10 10 10h82q10 0 10-10V45q0-10-10-10Z" fill="#AFCBF4" stroke="#426CC7" strokeWidth="2" />
      <path d="M84 35v92" stroke="#426CC7" strokeWidth="2" />
      <path d="M72 49H60m12 18H60m12 18H60m12 18H60" stroke="#365B9A" strokeWidth="4" strokeLinecap="round" />
      <path d="M96 49h54" stroke="#EFF5FF" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="108" cy="77" rx="8" ry="10" fill="white" /><ellipse cx="144" cy="77" rx="8" ry="10" fill="white" />
      <ellipse cx="110" cy="79" rx="3" ry="5" fill="#253858" /><ellipse cx="146" cy="79" rx="3" ry="5" fill="#253858" />
      <path d="M115 99q11 12 22 0" stroke="#253858" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="99" cy="92" rx="6" ry="3" fill="#E5B6CC" /><ellipse cx="153" cy="92" rx="6" ry="3" fill="#E5B6CC" />
      <path d="M168 92q19-5 23-24M66 94q-16 5-21-9" stroke="#426CC7" strokeWidth="6" strokeLinecap="round" />
      {teaching ? <>
        <path d="m184 73 15-37" stroke="#D5A44D" strokeWidth="5" strokeLinecap="round" />
        <path d="M178 25h40v28h-40z" fill="#FFF5D9" stroke="#D5A44D" strokeWidth="1.5" />
        <path d="m187 39 6 5 13-13" stroke="#597D63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </> : <>
        <path d="m186 39 5-8 5 8 9 4-9 5-5 9-5-9-9-5Z" fill="#E6B760" />
        <path d="m34 61 3-5 3 5 5 3-5 3-3 5-3-5-5-3Z" fill="#8A70C9" />
      </>}
      <path d="m26 125 7-13 10 4-3 14" fill="#B8CFBF" /><circle cx="39" cy="130" r="9" fill="#668BCB" /><circle cx="51" cy="135" r="8" fill="#426CC7" /><circle cx="33" cy="140" r="7" fill="#8A70C9" />
      <path d="M36 128h3m10 5h3m-21 5h3" stroke="#DCE8FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
