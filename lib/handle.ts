const ADJ = [
  "brisk","calm","clever","daring","eager","faithful","gentle","jolly","kind","lucky",
  "merry","noble","plucky","proud","quick","royal","shiny","spry","sunny","witty"
];
const ANIMALS = [
  "otter","lynx","eagle","panda","fox","owl","koala","tiger","yak","zebra",
  "bear","whale","falcon","sparrow","lark","hare","moose","seal","wolf","heron"
];

export function generateHandle(seed?: string) {
  const r = (n: number) => (seed ? seeded(seed + n) : Math.random());
  const a = ADJ[Math.floor(r(1) * ADJ.length)];
  const b = ANIMALS[Math.floor(r(2) * ANIMALS.length)];
  const suffix = Math.random().toString(36).slice(2, 5);
  return `${a}-${b}-${suffix}`;
}

function seeded(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h >>>= 0;
  return (h % 10000) / 10000;
}

