/** Motion counterpart of tokens.css for Framer interactions. Seconds, not ms. */
export const workspaceMotion = {
  press: { type: "spring" as const, bounce: 0, visualDuration: 0.16 },
  instant: { duration: 0 },
};
