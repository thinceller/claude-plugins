// 料金プランページのロジック
const PLANS = [
  { id: "free", price: 0 },
  { id: "pro", price: 1200 },
  { id: "team", price: 4800 },
];

function getPlan(id) {
  return PLANS.find((p) => p.id === id);
}

module.exports = { PLANS, getPlan };
