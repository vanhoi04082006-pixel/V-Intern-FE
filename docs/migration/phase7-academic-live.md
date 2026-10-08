# Instructor academic integration

Classes, sessions and projects use real Nest pagination, filters, create/update, detail and member endpoints. Sessions expose instructors and milestones. Project technologies/difficulty/capacity are actual fields. Assignment uses the recruitment candidate API and the transactional `/assignments` contract. Search/pagination keeps all project/session options reachable rather than silently limiting selectors to the first ten records.

`phase7-academic-live.mjs` drives real browser forms for class/session/project create/edit, class members and session milestone status. It reads SQL to compare saved names, completes a disposable graduate assignment, performs a new assignment through the Instructor browser, and verifies `unassigned → active` and the SQL active-project row. Desktop1440 and mobile390 screenshots and sanitized request URLs are retained. There is no request interception.

Local slice verification: 254 frontend tests (original tests retained), lint/typecheck/build/diff-check and three real browser groups passed. Final Instructor gate still requires Sprint/Task, evaluation AI override, scoped performance/reports and visual acceptance. The global Phase7 gate remains open until Admin and all final checks complete.

SQL2019 intermediate gate: FE42ad6479bf9b7709c43f6ca4df7a9ffbf219e93f, BE7db20c4f03b07ec5efd8fe70448ec21e05aa8b67. FE Actions37712401579 and BE Actions37711580268 succeeded. These intermediate runs are not the final exact-SHA full-product gate.
