# Số dư tổng không đổi khi lọc kỳ

CUA Admin: sổ QA gồm KPI955000, bonus10000, reversal−10000, penalty−5000, adjustment−2000, tổng948000. Chọn kỳ không có dòng khiến Số dư hiện tại0 vì BE lọc toàn bộ nguồn số dư theo kỳ. BE cb2cf860cf083cc38e3b4f7a235769f4e119e4e0 sửa balance và latestEntries luôn toàn sổ đúng người; chỉ earnedThisPeriod theo kỳ. Không sửa ledger hoặc công thức mặc định khi không chọn kỳ.

Hai ca SQL Admin/own RED trước sửa, sau sửa nhóm KPI/salary/certificates17/17 đạt; BE113suites/876unit,lint/build đạt. FE ghim BE trên; nhãn không chọn kỳ nói rõ Thu nhập KPI(mọi kỳ). FE130files/742test,lint/typecheck,25contracttests và productionbuild đạt.

CUA sau sửa: chọn kỳ rỗng vẫn948000, thu nhập kỳ0, ledger0dòng; chọn kỳ QA-KPI-FIX vẫn948000, thu nhập kỳ955000, ledger1dòng. Ảnh `.runtime/product-acceptance-20261116/salary-global-balance-empty-period-after.png`. Review độc lập chấp thuận; nghiệm thu toàn sản phẩm còn tiếp tục.
