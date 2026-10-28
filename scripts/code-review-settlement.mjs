/** Observe the existing background review; never POST again while its lease is held. */
export async function waitForSettledCodeReview(read, expectedSha, { attempts = 30, pause = () => new Promise(resolve => setTimeout(resolve, 1000)) } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const [review] = await read();
    if (review && review.headSha !== expectedSha) throw Error('Code review SHA changed while awaiting the submitted commit');
    if (review && review.status !== 'running') return review;
    if (attempt + 1 < attempts) await pause();
  }
  throw Error('Automatic code review did not finish within the bounded polling window');
}
